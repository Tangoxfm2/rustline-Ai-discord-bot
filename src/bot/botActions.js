// botActions.js — ES Module Rewrite
import {
  ChannelType,
  PermissionFlagsBits
} from "discord.js";

import {
  rememberCreatedItem,
  getItemId,
  listItems
} from "../ai/memory/memoryStore.js";

export default {
  async createCategory(guild, name, user) {
    const existing = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === name
    );
    if (existing) {
      rememberCreatedItem("categories", name, existing.id);
      return {
        ok: true,
        id: existing.id,
        msg: `⚠️ Category "${name}" already exists.`,
      };
    }

    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: `Rustline AI category creation by ${user.username}`,
    });

    rememberCreatedItem("categories", name, category.id);

    return {
      ok: true,
      id: category.id,
      msg: `📂 Category created: **${category.name}**`,
    };
  },

  async deleteCategory(guild, name, user) {
    const category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === name
    );
    if (!category) return `⚠️ Category "${name}" does not exist.`;

    await category.delete(`Rustline AI category deletion by ${user.username}`);
    return `🗑️ Category "${name}" deleted.`;
  },

  async createChannel(guild, name, user, options = {}) {
    const existing = guild.channels.cache.find((c) => c.name === name);
    if (existing) {
      rememberCreatedItem("channels", name, existing.id);
      return `⚠️ Channel "${name}" already exists.`;
    }

    const created = await guild.channels.create({
      name,
      type: options.type || ChannelType.GuildText,
      parent: options.parentId || null,
      permissionOverwrites: options.permissionOverwrites || [],
      reason: `Rustline AI channel creation by ${user.username}`,
    });

    rememberCreatedItem("channels", name, created.id);

    return `✅ Channel created: <#${created.id}>`;
  },

  async deleteChannel(guild, name, user) {
    const channel =
      guild.channels.cache.find((c) => c.name === name) ||
      (getItemId("channels", name)
        ? guild.channels.cache.get(getItemId("channels", name))
        : null);

    if (!channel) return `⚠️ Channel "${name}" does not exist.`;

    await channel.delete(`Rustline AI deletion by ${user.username}`);
    return `🗑️ Channel "${name}" deleted.`;
  },

  async waitAndDeleteChannel(guild, name, user, ms) {
    const channel =
      guild.channels.cache.find((c) => c.name === name) ||
      (getItemId("channels", name)
        ? guild.channels.cache.get(getItemId("channels", name))
        : null);

    if (!channel) return `⚠️ Channel "${name}" does not exist.`;

    await new Promise((resolve) => setTimeout(resolve, ms));

    await channel.delete(`Rustline AI timed deletion by ${user.username}`);
    return `⏱️ Channel "${name}" deleted after ${ms / 1000}s.`;
  },

  async createPrivateChannelForStaff(guild, name, user, parentId = null) {
    const staffRole =
      guild.roles.cache.find((r) => r.name.toLowerCase().includes("staff")) ||
      guild.roles.cache.find((r) => r.name.toLowerCase().includes("admin"));

    const overwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
    ];

    if (staffRole) {
      overwrites.push({
        id: staffRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }

    const created = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parentId,
      permissionOverwrites: overwrites,
      reason: `Rustline AI private staff channel by ${user.username}`,
    });

    rememberCreatedItem("channels", name, created.id);

    return `🔒 Staff channel created: <#${created.id}>`;
  },

  async smartCreateChannel(guild, name, user, opts = {}) {
    const parentId =
      opts.parentName ? getItemId("categories", opts.parentName) : opts.parentId;

    if (opts.private) {
      return await this.createPrivateChannelForStaff(guild, name, user, parentId);
    }

    return await this.createChannel(guild, name, user, { parentId });
  },

  async createRole(guild, name, perms, user) {
    const existing = guild.roles.cache.find((r) => r.name === name);
    if (existing) {
      rememberCreatedItem("roles", name, existing.id);
      return `⚠️ Role "${name}" already exists.`;
    }

    const role = await guild.roles.create({
      name,
      permissions: perms || [],
      reason: `Rustline AI role creation by ${user.username}`,
    });

    rememberCreatedItem("roles", name, role.id);

    return `🎭 Role created: **${role.name}**`;
  },

  listKnownItems() {
    return {
      categories: listItems("categories"),
      channels: listItems("channels"),
      roles: listItems("roles"),
    };
  },
};
