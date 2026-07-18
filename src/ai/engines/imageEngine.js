// src/ai/engines/imageEngine.js — Rustline v3 ES Module Rewrite

import { callRustlineAI } from "../../bot/modelRouter.js";

/**
 * Image mode handler
 * Used when the user asks for:
 * - "generate an image"
 * - "draw"
 * - "picture"
 * - "image of ..."
 */
export async function handleImage(message, premium) {
  const prompt = `
The user wants an AI-generated image.

Message: ${message.content}

Generate a description for an AI image generator.
Return ONLY a description, no JSON, no code.
If premium = true, allow more detail and creativity.
`;

  const aiReply = await callRustlineAI({
    messages: [{ role: "user", content: prompt }],
    premium,
  });

  return message.reply(`🖼️ **Image Prompt:**\n${aiReply}`);
}
