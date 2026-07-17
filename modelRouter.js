import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import { buildAdaptiveBrain } from "./aiBrain.js";
import { loadFeedback } from "./feedbackManager.js";
import { validateWeapons } from "./rustWeapons.js";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function callRustlineAI(userMessage) {
  const brain = buildAdaptiveBrain();
  const fb = loadFeedback();

  const total = fb.good + fb.bad || 1;
  const score = fb.good / total;

  const temperature = score > 0.75 ? 1.0 : score < 0.40 ? 0.2 : 0.6;

  const systemPrompt = `
You are Rustline AI.
Ultra Feedback Personality Engine Active.

Personality: ${brain.personality}
Accuracy Mode: ${brain.accuracyMode}
Detail Level: ${brain.detailLevel}
Architecture: ${brain.architecture}

You must obey all feedback packets stored in memory.
You must reinforce GOOD patterns.
You must avoid BAD patterns.
You must rewrite code strictly when rewrite_mode=strict.
You must generate Rustline-compatible JS code.
You must output long code as .txt (handled by bot.js).
`;

  const completion = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]
  });

  let output = completion.choices[0].message.content;

  return output;
}
