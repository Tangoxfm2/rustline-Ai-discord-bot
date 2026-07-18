// src/builder/serverBuilder.js

/**
 * ServerBuilder
 * -------------
 * This module generates Discord server structures based on user requests.
 * It does NOT directly create servers (Discord API doesn't allow bots to create servers),
 * but it generates a full blueprint the user can apply OR the bot can apply
 * inside an existing server using channel/role creation.
 *
 * Rustline V2 uses this to:
 * - Build Discord servers
 * - Build Rust Console Edition servers
 * - Build categories, channels, roles, permissions
 * - Build wipe/update systems
 * - Build staff systems
 * - Build VIP systems
 * - Build killfeed/shop systems
 */

const { callRustlineAI } = require('../../modelRouter');

async function generateDiscordServerBlueprint(note, features = []) {
  const messages = [
    {
      role: 'user',
      content: `
The user wants a Discord server built.

Request: ${note}

Features: ${features.join(', ')}

Generate a full Discord server blueprint including:
- Categories
- Channels
- Roles
- Permissions
- Automations
- Logging
- Tickets
- Moderation
- Branding
- Webhooks
- Welcome system
- Reaction roles

Format the output as JSON with this structure:

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

Make it production-ready.
      `,
    },
  ];

  const aiReply = await callRustlineAI({ messages });

  return aiReply;
}

async function generateRustConsoleServerBlueprint(note, features = []) {
  const messages = [
    {
      role: 'user',
      content: `
The user wants a Rust Console Edition Discord server built.

Request: ${note}

Features: ${features.join(', ')}

Generate a full Rust Console server blueprint including:
- Wipe channels
- Update channels
- Killfeed
- VIP system
- Shop system
- Team roles
- Staff system
- Rules
- Branding
- Announcement flows
- Rust-specific categories

Format the output as JSON with this structure:

{
  "serverName": "",
  "roles": [],
  "categories": [
    {
      "name": "",
      "channels": [
        {
          "name": "",
          "type": "text",
          "permissions": {}
        }
      ]
    }
  ],
  "rustSystems": {
    "wipe": {},
    "updates": {},
    "killfeed": {},
    "vip": {},
    "shop": {},
    "teams": {},
    "staff": {}
  },
  "branding": {
    "icon": "",
    "banner": ""
  }
}

Make it professional and community-standard.
      `,
    },
  ];

  const aiReply = await callRustlineAI({ messages });

  return aiReply;
}

async function applyBlueprintToServer(guild, blueprint) {
  /**
   * This function actually CREATES the server structure inside Discord.
   * It uses the blueprint JSON to create:
   * - roles
   * - categories
   * - channels
   * - permissions
   */

  // Create roles
  if (blueprint.roles && Array.isArray(blueprint.roles)) {
    for (const role of blueprint.roles) {
      await guild.roles.create({
        name: role.name,
        color: role.color || null,
        permissions: role.permissions || [],
      });
    }
  }

  // Create categories + channels
  if (blueprint.categories && Array.isArray(blueprint.categories)) {
    for (const category of blueprint.categories) {
      const categoryChannel = await guild.channels.create({
        name: category.name,
        type: 4, // category
      });

      for (const channel of category.channels) {
        await guild.channels.create({
          name: channel.name,
          type: channel.type === 'voice' ? 2 : 0,
          parent: categoryChannel.id,
          permissionOverwrites: channel.permissions || [],
        });
      }
    }
  }

  return true;
}

module.exports = {
  generateDiscordServerBlueprint,
  generateRustConsoleServerBlueprint,
  applyBlueprintToServer,
};
