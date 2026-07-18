// src/commands/redeem.js — ES Module Rewrite

import { redeemKey } from "../lib/premium.js";

export default {
  name: "redeem",
  description: "Redeem a Rustline premium license key.",
  options: [
    {
      type: 3,
      name: "key",
      description: "Your license key",
      required: true,
    },
  ],

  run: async (interaction) => {
    const discordId = interaction.user.id;
    const licenseKey = interaction.options.getString("key");

    await interaction.deferReply({ ephemeral: true });

    const result = await redeemKey(discordId, licenseKey);

    if (!result.ok) {
      return interaction.editReply("❌ Invalid or already used license key.");
    }

    return interaction.editReply(
      "✅ Your account is now **Rustline Premium**!"
    );
  },
};
