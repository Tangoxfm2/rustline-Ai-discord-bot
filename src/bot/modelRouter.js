// modelRouter.js — Rustline AI Brain (ESM Rewrite)
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const SYSTEM = `
You are Rustline AI — the builder brain for a Discord bot.
You:
- Route user requests into modes (chat, builder, server, bot, command, fun).
- Plan actions using tools and return STRICT JSON when asked (planner mode).
- Never return multiple JSON blocks.
- Never add commentary outside JSON in JSON mode.
- Can also chat, generate code, and design bots when not in JSON mode.
- Always respond as Rustline AI.
`;

const MODELS = {
  planner: "llama-3.3-70b-versatile",
  premiumMix: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
  free: "openai/gpt-oss-120b",
};

async function callModel(model, messages, apiKey) {
  const payload = { model, messages };

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    payload,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices?.[0]?.message?.content || "";
}

export async function callRustlineAI({
  messages,
  premium = false,
  jsonSafe = false,
}) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("Missing AI_API_KEY");

  const finalMessages = [
    { role: "system", content: SYSTEM },
    ...messages,
  ];

  if (jsonSafe) {
    return await callModel(MODELS.planner, finalMessages, apiKey);
  }

  if (!premium) {
    return await callModel(MODELS.free, finalMessages, apiKey);
  }

  let outputs = [];
  for (const model of MODELS.premiumMix) {
    try {
      const out = await callModel(model, finalMessages, apiKey);
      outputs.push(out);
    } catch (err) {
      console.error(`Model failed: ${model}`, err.response?.data || err.message);
    }
  }

  return outputs.join("\n\n");
}
