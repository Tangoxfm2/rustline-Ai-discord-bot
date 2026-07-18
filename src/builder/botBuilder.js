// src/builder/botBuilder.js

/**
 * BotBuilder
 * ----------
 * Generates a full Discord.js bot project as a set of files:
 * - bot.js
 * - config.json
 * - commands/
 * - events/
 * - package.json
 * - README.md
 *
 * Rustline will later bundle these via fileBundler into a zip.
 */

const { callRustlineAI } = require('../../modelRouter');

async function generateBotProject(note, features = []) {
  const messages = [
    {
      role: 'user',
      content: `
The user wants a Discord bot built.

Request: ${note}

Features: ${features.join(', ')}

Generate a full Discord.js v14 bot project as JSON with this structure:

{
  "files": [
    {
      "path": "bot.js",
      "content": "..."
    },
    {
      "path": "config.json",
      "content": "{...}"
    },
    {
      "path": "commands/ping.js",
      "content": "..."
    },
    {
      "path": "events/ready.js",
      "content": "..."
    },
    {
      "path": "events/interactionCreate.js",
      "content": "..."
    },
    {
      "path": "package.json",
      "content": "{...}"
    },
    {
      "path": "README.md",
      "content": "..."
    }
  ]
}

Rules:
- Use discord.js v14 style.
- Make commands clean and production-ready.
- Include basic error handling.
- Make README explain how to install and run.
- Do NOT include secrets or tokens.
      `,
    },
  ];

  const aiReply = await callRustlineAI({ messages });

  return aiReply; // JSON string describing files
}

module.exports = {
  generateBotProject,
};
