// builderEngine.js — FINAL CLEAN REWRITE
const { AttachmentBuilder } = require("discord.js");
const { callRustlineAI } = require("../../modelRouter");

// Send AI message safely (split or file)
async function sendAIMessage(thread, text) {
  try {
    if (text.length <= 2000) {
      return await thread.send(text);
    }

    const file = new AttachmentBuilder(Buffer.from(text), {
      name: "rustline-output.txt",
    });

    return await thread.send({
      content: "📄 **Response was too long — sent as a file instead.**",
      files: [file],
    });
  } catch (err) {
    console.error("Error sending AI message:", err);
    await thread.send("⚠️ Error sending AI message.");
  }
}

function startBuilderSession(client, thread, user, note) {
  thread.send("🧠 Rustline AI is now active. Talk naturally — I'm listening.");

  client.on("messageCreate", async (msg) => {
    try {
      if (msg.channel.id !== thread.id) return;
      if (msg.author.bot) return;

      const aiResponse = await callRustlineAI({
        messages: [{ role: "user", content: msg.content }],
      });

      await sendAIMessage(thread, aiResponse);
    } catch (err) {
      console.error("Builder session error:", err);
      await thread.send(
        "⚠️ Rustline AI encountered an error processing your message."
      );
    }
  });
}

module.exports = { startBuilderSession };
