// src/ai/engines/serverBuilderEngine.js — Rustline v3 ES Module Rewrite

import { callRustlineAI } from "../../bot/modelRouter.js";

// ---------------------------------------------------------
// 1. Generate Server Blueprint (AI → JSON)
// ---------------------------------------------------------
export async function generateServerBlueprint(prompt, premium) {
  const ai = await callRustlineAI({
    messages: [
      {
        role: "user",
        content: `
The user wants a Discord server built.

Request: ${prompt}

Generate a full server blueprint including:
- Categories
- Channels
- Roles
- Permissions
- Staff system
- Logging system
- Tickets
- Reaction roles
- Branding
- Automations

Format as JSON:
{
  "serverName": "",
  "roles": [],
  "categories": [
    {
      "name": "",
      "channels": [
        {
          "name": "",
          "type": "text/voice",
          "permissions": {}
        }
      ]
    }
  ],
  "automations": [],
  "branding": {
    "icon": "",
    "banner": ""
  }
}
        `,
      },
    ],
    premium,
  });

  return ai; // JSON string
}

// ---------------------------------------------------------
// 2. Apply Blueprint to Discord Server
// ---------------------------------------------------------
export async function applyBlueprint(guild, blueprint) {
  // Create roles
  if (blueprint.roles) {
    for (const role of blueprint.roles) {
      await guild.roles.create({
        name: role.name,
        color: role.color || null,
        permissions: role.permissions || [],
      });
    }
  }

  // Create categories + channels
  if (blueprint.categories) {
    for (const category of blueprint.categories) {
      const cat = await guild.channels.create({
        name: category.name,
        type: 4, // Category
      });

      for (const channel of category.channels) {
        await guild.channels.create({
          name: channel.name,
          type: channel.type === "voice" ? 2 : 0,
          parent: cat.id,
          permissionOverwrites: channel.permissions || [],
        });
      }
    }
  }

  return true;
}

// ---------------------------------------------------------
// 3. Generate Bot Project (AI → JSON)
// ---------------------------------------------------------
export async function generateBotProject(prompt, premium) {
  const ai = await callRustlineAI({
    messages: [
      {
        role: "user",
        content: `
User wants a Discord bot project.

Request: ${prompt}

Generate a project structure as JSON:

{
  "name": "",
  "files": [
    {
      "path": "index.js",
      "content": "..."
    }
  ]
}
        `,
      },
    ],
    premium,
  });

  return ai; // JSON string
}
