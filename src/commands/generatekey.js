// src/commands/generateKey.js — ES Module Rewrite

import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

export default {
  name: "generatekey",
  description: "Generate a Rustline Premium key (owner only)",
  options: [],

  run: async (interaction) => {
    const ownerId = process.env.OWNER_ID;

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "❌ Only the Rustline owner can generate keys.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const key = "RUSTLINE-" + crypto.randomUUID().split("-")[0].toUpperCase();

    const { error } = await supabase.from("license_keys").insert({
      key,
      used: false,
      used_by: null,
    });

    if (error) {
      console.error("Key insert error:", error);
      return interaction.editReply("❌ Failed to generate key.");
    }

    return interaction.editReply(`✅ Generated Premium Key:\n\`${key}\``);
  },
};
