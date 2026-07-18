// src/ai/engines/commandEngine.js — Rustline v3 File-Based Output

import { AttachmentBuilder } from "discord.js";
import { callRustlineAI } from "../../bot/modelRouter.js";
import { isPremium } from "../../lib/premium.js";

/**
 * Handles "command_mode" messages.
 * Always outputs code as a file.
 */
export async function handleCommandMode(message) {
  const userId = message.author.id;
  const premium = await isPremium(userId);

  const prompt = `
The user wants a Discord command generated.

Message: ${message.content}

Generate a Discord.js v14 slash command file.
Format as JSON:

{
  "name": "",
  "description": "",
  "content": "file content here",
  "instructions": "How to install and use this command."
}
`;

  const aiReply = await callRustlineAI({
    messages: [{ role: "user", content: prompt }],
    premium,
    jsonSafe: true
  });

  let parsed;
  try {
    parsed = JSON.parse(aiReply);
  } catch {
    return message.reply("❌ AI returned invalid command JSON.");
  }

  // Build file bundle
  const bundle = `
Command: ${parsed.name}
Description: ${parsed.description}

=== Instructions ===
${parsed.instructions || "Place this file in your /commands folder and reload your bot."}

=== File: ${parsed.name}.js ===
${parsed.content}
  `.trim();

  const file = new AttachmentBuilder(Buffer.from(bundle), {
    name: `${parsed.name || "command"}.txt`,
  });

  return message.reply({
    content: `🛠️ Command **${parsed.name}** generated as a file.`,
    files: [file],
  });
}

/**
 * Slash command handler (for /command)
 * Always outputs code as a file.
 */
export async function runSlashCommand(interaction) {
  const userId = interaction.user.id;
  const premium = await isPremium(userId);

  const prompt = `
User triggered slash command: ${interaction.commandName}
Options: ${JSON.stringify(interaction.options.data)}

Generate a Discord.js v14 command file.
Format as JSON:

{
  "name": "",
  "description": "",
  "content": "file content here",
  "instructions": "How to install and use this command."
}
`;

  const aiReply = await callRustlineAI({
    messages: [{ role: "user", content: prompt }],
    premium,
    jsonSafe: true
  });

  let parsed;
  try {
    parsed = JSON.parse(aiReply);
  } catch {
    return interaction.reply({
      content: "❌ AI returned invalid command JSON.",
      ephemeral: true
    });
  }

  const bundle = `
Command: ${parsed.name}
Description: ${parsed.description}

=== Instructions ===
${parsed.instructions || "Place this file in your /commands folder and reload your bot."}

=== File: ${parsed.name}.js ===
${parsed.content}
  `.trim();

  const file = new AttachmentBuilder(Buffer.from(bundle), {
    name: `${parsed.name || "command"}.txt`,
  });

  return interaction.reply({
    content: `🛠️ Command **${parsed.name}** generated as a file.`,
    files: [file],
    ephemeral: false
  });
}
