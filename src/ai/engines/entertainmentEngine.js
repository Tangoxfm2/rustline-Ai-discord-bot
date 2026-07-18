// src/ai/engines/entertainmentEngine.js — Rustline v3 ES Module Rewrite

import { callRustlineAI } from "../../bot/modelRouter.js";

/**
 * Entertainment mode handler
 * Used when the user asks for:
 * - jokes
 * - memes
 * - fun responses
 * - entertainment
 */
export async function handleEntertainment(message, premium) {
  const prompt = `
The user wants entertainment.

Message: ${message.content}

Generate a fun, entertaining response.
Keep it safe, friendly, and Discord‑appropriate.
If premium = true, allow more creativity.
`;

  const aiReply = await callRustlineAI({
    messages: [{ role: "user", content: prompt }],
    premium,
  });

  return message.reply(aiReply);
}
