// modelRouter.js
require('dotenv').config();
const axios = require('axios');

const RUSTLINE_SYSTEM_PROMPT = `
You are Rustline AI — a single unified builder assistant.

You build Discord bots, Discord servers, Rust Console servers, automations,
workflows, branding, moderation systems, and anything the user asks for.

You ALWAYS respond as one identity: Rustline AI.
You NEVER mention model names or internal routing.
You ALWAYS generate structured output, JSON, code, and multi-file projects.
`;

async function callRustlineAI({ messages }) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("Missing AI_API_KEY in environment");

  const payload = {
    model: "openai/gpt-oss-120b",   // ✔ stable, supported, free
    messages: [
      { role: "system", content: RUSTLINE_SYSTEM_PROMPT },
      ...messages,
    ],
  };

  try {
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

    const choice = response.data.choices?.[0];
    if (!choice) throw new Error("Groq API returned no choices");

    return choice.message.content;
  } catch (err) {
    console.error("Rustline AI Error:", err.response?.data || err.message);
    throw new Error("Rustline AI failed to generate a response.");
  }
}

module.exports = {
  callRustlineAI,
};
