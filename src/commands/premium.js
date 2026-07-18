// src/commands/premium.js — ES Module Rewrite

import { supabase } from "../lib/supabase.js";

export default {
  name: "premium",
  description: "Make a user premium (owner only)",
  options: [
    {
      type: 6,
      name: "user",
      description: "User to upgrade",
      required: true,
    },
  ],

  run: async (interaction) => {
    const ownerId = process.env.OWNER_ID;

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "❌ Only the Rustline owner can upgrade users.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("user");

    const { error } = await supabase.from("premium_users").insert({
      discord_id: target.id,
      license_key: "OWNER-GRANTED",
    });

    if (error) {
      console.error("Premium insert error:", error);
      return interaction.editReply("❌ Failed to upgrade user.");
    }

    return interaction.editReply(
      `✅ <@${target.id}> is now **Rustline Premium**!`
    );
  },
};
