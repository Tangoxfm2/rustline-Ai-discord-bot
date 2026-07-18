// src/core/feedbackSystem.js — Rustline v3 ES Module Rewrite

import { supabase } from "../lib/supabase.js";

/**
 * Records feedback into Supabase
 */
export async function recordFeedback(userId, message, mode = "chat") {
  try {
    await supabase.from("feedback").insert({
      user_id: userId,
      message,
      mode,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to record feedback:", err.message);
  }
}

/**
 * Attaches a listener to Discord client to capture reactions as feedback
 */
export function attachFeedbackListener(client) {
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;

      const emoji = reaction.emoji.name;
      const message = reaction.message;

      // Only track feedback on bot replies
      if (message.author.id !== client.user.id) return;

      await recordFeedback(user.id, `Reaction: ${emoji}`, "reaction");

    } catch (err) {
      console.error("Feedback listener error:", err.message);
    }
  });

  console.log("📥 Feedback listener attached.");
}
