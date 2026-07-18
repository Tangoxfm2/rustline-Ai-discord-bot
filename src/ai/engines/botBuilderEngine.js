// src/ai/engines/botBuilderEngine.js

import { AttachmentBuilder } from "discord.js";
import { callRustlineAI } from "../../bot/modelRouter.js";

export async function generateBotProjectAndSend(thread, prompt, premium) {
  const ai = await callRustlineAI({
    messages: [
      {
        role: "user",
        content: `
User wants a Discord bot project.

Request: ${prompt}

Generate a project structure as JSON:

{
  "name": "",
  "files": [
    { "path": "index.js", "content": "..." }
  ],
  "instructions": "How to install, run, and configure the project."
}
        `,
      },
    ],
    premium,
  });

  let project;
  try {
    project = JSON.parse(ai);
  } catch {
    await thread.send("❌ AI returned invalid project JSON.");
    return;
  }

  // Build a single text file with all code + instructions
  let bundle = `Rustline Bot Project: ${project.name}\n\n`;
  bundle += `=== Instructions ===\n${project.instructions || "No instructions provided."}\n\n`;
  bundle += `=== Files ===\n\n`;

  for (const file of project.files || []) {
    bundle += `# ${file.path}\n`;
    bundle += `${file.content}\n\n`;
  }

  const attachment = new AttachmentBuilder(Buffer.from(bundle), {
    name: `${project.name || "rustline-bot-project"}.txt`,
  });

  await thread.send({
    content: "📦 Here is your generated Discord bot project as a file.\nRead it, copy files into your project, and follow the instructions inside.",
    files: [attachment],
  });
}
