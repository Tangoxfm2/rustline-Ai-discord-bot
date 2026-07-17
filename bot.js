// import dotenv from "dotenv";
// dotenv.config();

// import { Client, GatewayIntentBits, Events, AttachmentBuilder } from "discord.js";
// import { callRustlineAI } from "./modelRouter.js";
// import { addFeedbackPacket } from "./feedbackManager.js";

// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent
//   ]
// });

// function sendAsTextFile(channel, text, filename = "rustline_output.txt") {
//   const buffer = Buffer.from(text, "utf-8");
//   const file = new AttachmentBuilder(buffer, { name: filename });
//   return channel.send({ files: [file] });
// }

// function shouldSendAsFile(text) {
//   return text.length > 3500 || text.includes("```");
// }

// client.once(Events.ClientReady, () => {
//   console.log(`Rustline Bot logged in as ${client.user.tag}`);
// });

// client.on(Events.MessageCreate, async (msg) => {
//   if (msg.author.bot) return;

//   const content = msg.content.trim();

//   // ULTRA FEEDBACK PACKET PARSER
//   if (content.startsWith("!good") || content.startsWith("!bad")) {
//     const raw = content.replace("!good", "").replace("!bad", "").trim();

//     try {
//       const packet = parseUltraFeedbackPacket(raw);
//       addFeedbackPacket(packet);

//       return msg.reply(`Ultra feedback packet stored (${packet.type}).`);
//     } catch (err) {
//       console.error("Feedback parse error:", err);
//       return msg.reply("Invalid feedback packet.");
//     }
//   }

//   // AI COMMAND
//   if (content.startsWith("!ai")) {
//     const prompt = content.replace("!ai", "").trim();
//     if (!prompt) return msg.reply("Give me something to work with.");

//     try {
//       const aiResponse = await callRustlineAI(prompt);

//       if (shouldSendAsFile(aiResponse)) {
//         await sendAsTextFile(msg.channel, aiResponse, "rustline_ai_output.txt");
//       } else {
//         await msg.channel.send(`**Rustline AI:**\n${aiResponse}`);
//       }
//     } catch (err) {
//       console.error("AI error:", err);
//       return msg.reply("AI crashed. Check logs.");
//     }
//   }
// });

// client.login(process.env.BOT_TOKEN);

// // ULTRA FEEDBACK PACKET PARSER
// function parseUltraFeedbackPacket(raw) {
//   const cleaned = raw
//     .replace("RUSTLINE_FEEDBACK_PACKET", "")
//     .replace("{", "")
//     .replace("}", "")
//     .trim();

//   const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

//   const packet = {};

//   for (const line of lines) {
//     if (line.startsWith("type:")) packet.type = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("reason:")) packet.reason = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("severity:")) packet.severity = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("strengths:")) packet.strengths = extractList(line);
//     if (line.startsWith("faults:")) packet.faults = extractList(line);
//     if (line.startsWith("avoid:")) packet.avoid = extractList(line);
//     if (line.startsWith("patterns:")) packet.patterns = extractList(line);
//     if (line.startsWith("memory_tags:")) packet.memory_tags = extractList(line);
//     if (line.startsWith("fix:")) packet.fix = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("example:")) packet.example = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("style:")) packet.style = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("architecture:")) packet.architecture = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("rewrite_mode:")) packet.rewrite_mode = line.split(":")[1].replace(";", "").trim();
//     if (line.startsWith("weight:")) packet.weight = parseFloat(line.split(":")[1].replace(";", "").trim());
//   }

//   return packet;
// }

// function extractList(line) {
//   const inside = line.substring(line.indexOf("[") + 1, line.indexOf("]"));
//   return inside.split(",").map((x) => x.trim()).filter(Boolean);
// }
import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder
} from "discord.js";

import { callRustlineAI } from "./modelRouter.js";
import { addFeedbackPacket } from "./feedbackManager.js";

// Per-thread chat memory
const activeChats = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// ----------------------
// File Output System
// ----------------------
function sendAsTextFile(channel, text, filename = "rustline_output.txt") {
  const buffer = Buffer.from(text, "utf-8");
  const file = new AttachmentBuilder(buffer, { name: filename });
  return channel.send({ files: [file] });
}

function shouldSendAsFile(text) {
  return text.length > 3500 || text.includes("```");
}

// ----------------------
// Bot Ready
// ----------------------
client.once(Events.ClientReady, () => {
  console.log(`Rustline Bot logged in as ${client.user.tag}`);
});

// ----------------------
// Message Handler
// ----------------------
// ----------------------
// CHAT SYSTEM: !chat command
// ----------------------
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;

  const content = msg.content.trim();

  // Create a chat thread
  if (content.startsWith("!chat")) {
    try {
      const thread = await msg.channel.threads.create({
        name: `chat-${msg.author.username}`,
        autoArchiveDuration: 60,
        reason: "Rustline AI chat session"
      });

      activeChats.set(thread.id, []); // create memory store

      await thread.send(
        `Rustline AI chat started for <@${msg.author.id}>.  
Type normally — no !ai needed.`
      );

      return;
    } catch (err) {
      console.error("Chat thread error:", err);
      return msg.reply("Failed to create chat thread.");
    }
  }
});

// Reaction-Based Feedback
// ----------------------
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  const msg = reaction.message;

  if (!msg.content.startsWith("Rustline AI")) return;

  const aiText = msg.content.replace("Rustline AI:", "").trim();

  // GOOD
  if (reaction.emoji.name === "👍") {
    const packet = {
      type: "GOOD",
      reason: "user marked response as good",
      strengths: ["accepted"],
      reinforce: {
        style: "current",
        patterns: ["continue"],
        architecture: "rustline_js"
      },
      memory_tags: ["good_response"],
      weight: +1.0
    };

    addFeedbackPacket(packet);
    return msg.channel.send("Stored GOOD feedback.");
  }

  // BAD
  if (reaction.emoji.name === "👎") {
    const packet = {
      type: "BAD",
      reason: "user marked response as bad",
      severity: "medium",
      faults: ["response rejected"],
      corrections: {
        fix: "improve accuracy and follow Rustline architecture",
        avoid: ["previous patterns"],
        rewrite_mode: "strict"
      },
      example: "Rewrite response with correct Rustline JS format.",
      memory_tags: ["bad_response", "strict_mode"],
      weight: -1.0
    };

    addFeedbackPacket(packet);
    return msg.channel.send("Stored BAD feedback.");
  }
});

// ----------------------
// Chat Thread Cleanup
// ----------------------
client.on(Events.ThreadDelete, (thread) => {
  if (activeChats.has(thread.id)) {
    activeChats.delete(thread.id);
  }
});

// ----------------------
// Ultra Feedback Packet Parser
// ----------------------
function parseUltraFeedbackPacket(raw) {
  const cleaned = raw
    .replace("RUSTLINE_FEEDBACK_PACKET", "")
    .replace("{", "")
    .replace("}", "")
    .trim();

  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const packet = {};

  for (const line of lines) {
    if (line.startsWith("type:")) packet.type = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("reason:")) packet.reason = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("severity:")) packet.severity = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("strengths:")) packet.strengths = extractList(line);
    if (line.startsWith("faults:")) packet.faults = extractList(line);
    if (line.startsWith("avoid:")) packet.avoid = extractList(line);
    if (line.startsWith("patterns:")) packet.patterns = extractList(line);
    if (line.startsWith("memory_tags:")) packet.memory_tags = extractList(line);
    if (line.startsWith("fix:")) packet.fix = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("example:")) packet.example = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("style:")) packet.style = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("architecture:")) packet.architecture = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("rewrite_mode:")) packet.rewrite_mode = line.split(":")[1].replace(";", "").trim();
    if (line.startsWith("weight:")) packet.weight = parseFloat(line.split(":")[1].replace(";", "").trim());
  }

  return packet;
}

function extractList(line) {
  const inside = line.substring(line.indexOf("[") + 1, line.indexOf("]"));
  return inside.split(",").map((x) => x.trim()).filter(Boolean);
}

client.login(process.env.BOT_TOKEN);
