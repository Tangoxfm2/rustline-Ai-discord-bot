// bot.js — FINAL CLEAN REWRITE
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  AttachmentBuilder,
} = require("discord.js");

const { callRustlineAI } = require("./modelRouter");
const { startBuilderSession } = require("./src/builder/builderEngine");

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Slash commands
const commands = [
  {
    name: "chat",
    description: "Start a Rustline AI builder chat",
    options: [
      {
        type: 3,
        name: "note",
        description: "Describe what you want Rustline to build",
        required: true,
      },
    ],
  },
];

// Register slash commands
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("Slash commands registered.");
}

// /chat handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "chat") return;

  try {
    await interaction.deferReply({ ephemeral: true });

    const note = interaction.options.getString("note");

    // Prevent /chat inside threads
    if (interaction.channel.isThread()) {
      return interaction.editReply(
        "❌ You cannot use /chat inside a thread. Use it in a normal text channel."
      );
    }

    // Prevent /chat inside unsupported channels
    if (!interaction.channel.threads) {
      return interaction.editReply(
        "❌ This channel cannot create threads. Use a normal text channel."
      );
    }

    // Create thread
    const thread = await interaction.channel.threads.create({
      name: `Builder – ${interaction.user.username}`,
      autoArchiveDuration: 60,
      reason: "Rustline builder chat",
    });

    await interaction.editReply(`Builder chat created: <#${thread.id}>`);

    // Welcome message
    await thread.send(
      `👋 **Welcome to your Rustline AI builder chat, ${interaction.user.username}!**  
Your note: \`${note}\`

Planning your build now…`
    );

    // First AI message
    const aiResponse = await callRustlineAI({
      messages: [
        {
          role: "user",
          content: `User note: ${note}\n\nStart the builder session. Plan what to build and speak normally.`,
        },
      ],
    });

    // Send first AI message (auto file if too long)
    if (aiResponse.length <= 2000) {
      await thread.send(aiResponse);
    } else {
      const file = new AttachmentBuilder(Buffer.from(aiResponse), {
        name: "rustline-planning.txt",
      });

      await thread.send({
        content: "📄 **Planning message was too long — sent as a file.**",
        files: [file],
      });
    }

    // Start builder session (AI replies inside thread)
    startBuilderSession(client, thread, interaction.user, note);

  } catch (err) {
    console.error("Chat command error:", err);
    try {
      await interaction.editReply(
        "⚠️ Rustline AI encountered an error starting the chat."
      );
    } catch {}
  }
});

// Ready
client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
});

// Login
client.login(process.env.BOT_TOKEN);
