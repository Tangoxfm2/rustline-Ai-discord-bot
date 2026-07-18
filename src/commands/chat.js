// src/commands/chat.js — ES Module Rewrite

import { AttachmentBuilder } from "discord.js";
import { callRustlineAI } from "../bot/modelRouter.js";
import { startBuilderSession } from "../ai/engines/builderEngine.js";

export default {
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

  run: async (interaction, client) => {
    await interaction.deferReply({ ephemeral: true });

    const note = interaction.options.getString("note");

    if (interaction.channel.isThread()) {
      return interaction.editReply("❌ You cannot use /chat inside a thread.");
    }

    if (!interaction.channel.threads) {
      return interaction.editReply("❌ This channel cannot create threads.");
    }

    const thread = await interaction.channel.threads.create({
      name: `Builder – ${interaction.user.username}`,
      autoArchiveDuration: 60,
      reason: "Rustline builder chat",
    });

    await interaction.editReply(`Builder chat created: <#${thread.id}>`);

    await thread.send(
      `👋 **Welcome to your Rustline AI builder chat, ${interaction.user.username}!**  
Your note: \`${note}\`

Planning your build now…`
    );

    const aiResponse = await callRustlineAI({
      messages: [
        {
          role: "user",
          content: `User note: ${note}\n\nStart the builder session.`,
        },
      ],
    });

    if (aiResponse.length <= 2000) {
      await thread.send(aiResponse);
    } else {
      const file = new AttachmentBuilder(Buffer.from(aiResponse), {
        name: "rustline-planning.txt",
      });

      await thread.send({
        content: "📄 Planning message was too long — sent as a file.",
        files: [file],
      });
    }

    startBuilderSession(client, thread, interaction.user, note);
  },
};
