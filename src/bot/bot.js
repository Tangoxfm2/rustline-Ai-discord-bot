// bot.js — Rustline v3 ES Module Rewrite
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from "discord.js";

// Core AI + Premium
import { callRustlineAI } from "./modelRouter.js";
import { isPremium } from "../lib/premium.js";

// Mode Router
import { detectMode } from "../ai/engines/modeRouter.js";

// Mode Handlers
import { handleSupportMessage } from "../ai/engines/supportMode.js";
import { handleEntertainment } from "../ai/engines/entertainmentEngine.js";
import { handleImage } from "../ai/engines/imageEngine.js";
import { handleCommandMode } from "../ai/engines/commandEngine.js";

// Builder Engines
import { startBuilderSession } from "../ai/engines/builderEngine.js";
import {
  generateServerBlueprint,
  applyBlueprint,
} from "../ai/engines/serverBuilderEngine.js";

import { generateBotProject } from "../ai/engines/botBuilderEngine.js";


// Feedback / RL-lite
import { attachFeedbackListener } from "../core/feedbackSystem.js";

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// LOAD SLASH COMMANDS
client.commands = new Map();
const commandsPath = path.join(process.cwd(), "src/commands");
const commandFiles = fs.readdirSync(commandsPath);
const slashCommands = [];

for (const file of commandFiles) {
  const command = await import(`../commands/${file}`);
  const cmd = command.default || command;

  if (!cmd || !cmd.name || !cmd.description) continue;

  client.commands.set(cmd.name, cmd);
  slashCommands.push({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options || [],
  });
}

// REGISTER SLASH COMMANDS
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: slashCommands }
  );

  console.log("Slash commands registered.");
}

// SLASH COMMAND HANDLER
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.run(interaction, client);
  } catch (err) {
    console.error(`Command error (${interaction.commandName}):`, err);
    try {
      await interaction.reply({
        content: "⚠️ Rustline encountered an error running this command.",
        ephemeral: true,
      });
    } catch {}
  }
});

// MENTION HANDLER — @Rustline {prompt}
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const botId = client.user.id;
  const mentioned = message.mentions.users.has(botId);
  if (!mentioned) return;

  const prompt = message.content.replace(`<@${botId}>`, "").trim();
  if (!prompt) return;

  const mode = detectMode(prompt);

  switch (mode) {
    case "support_mode":
      return handleSupportMessage(message);

    case "builder_mode": {
      const thread = await message.channel.threads.create({
        name: `Builder – ${message.author.username}`,
        autoArchiveDuration: 60,
      });
      return startBuilderSession(client, thread, message.author, prompt);
    }

    case "server_mode": {
      const premium = await isPremium(message.author.id);
      const aiBlueprint = await generateServerBlueprint(prompt, premium);

      let blueprint;
      try {
        blueprint = JSON.parse(aiBlueprint);
      } catch {
        return message.reply("❌ AI returned invalid server blueprint JSON.");
      }

      await message.reply("🛠️ Server blueprint generated. Applying now…");

      try {
        await applyBlueprint(message.guild, blueprint);
        return message.reply("✅ Server structure applied successfully!");
      } catch (err) {
        console.error(err);
        return message.reply("❌ Failed to apply server blueprint.");
      }
    }

    case "bot_mode": {
      const premium = await isPremium(message.author.id);
      const aiProject = await generateBotProject(prompt, premium);

      let project;
      try {
        project = JSON.parse(aiProject);
      } catch {
        return message.reply("❌ AI returned invalid bot project JSON.");
      }

      return message.reply(
        `🤖 Bot project generated: **${project.name}**\nFiles: ${project.files.length}\n(Export/save coming in v4 dashboard.)`
      );
    }

    case "command_mode":
      return handleCommandMode(message);

    case "entertainment_mode":
      return handleEntertainment(message, await isPremium(message.author.id));

    case "image_mode":
      return handleImage(message, await isPremium(message.author.id));

    default: {
      const aiResponse = await callRustlineAI({
        messages: [{ role: "user", content: prompt }],
        premium: await isPremium(message.author.id),
      });
      return message.reply(aiResponse);
    }
  }
});

// READY EVENT
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
  attachFeedbackListener(client);
});

client.login(process.env.BOT_TOKEN);
