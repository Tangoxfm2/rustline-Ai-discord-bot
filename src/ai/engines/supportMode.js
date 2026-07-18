// src/ai/engines/supportMode.js — Rustline v3 ES Module Rewrite

import { callRustlineAI } from "../../bot/modelRouter.js";

/**
 * Support mode handler
 * Used when the user asks for:
 * - help
 * - support
 * - issues
 * - problems
 * - bugs
 */
export async function handleSupportMessage(message) {
  const prompt = `
The user is asking for support.

Message: ${message.content}

Provide:
- A helpful, friendly support response
- Clear steps or troubleshooting
- No code unless necessary
- No JSON
- Keep it Discord‑appropriate
`;

  const aiReply = await callRustlineAI({
    messages: [{ role: "user", content: prompt }],
    premium: true
  });

  return message.reply(aiReply);
}
