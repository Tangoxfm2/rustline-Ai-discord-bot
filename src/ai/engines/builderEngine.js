// builderEngine.js — Rustline AI Planner + Tools + Memory v3.1
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { callRustlineAI } = require("../../bot/modelRouter");
const { isPremium } = require("../../lib/premium");
const actions = require("../../bot/botActions");

// ---------- Status ----------
function sendStatus(channel, state, detail) {
  const embed = new EmbedBuilder()
    .setTitle("Rustline AI Status")
    .setColor(0x5865f2)
    .addFields(
      { name: "State", value: state, inline: true },
      { name: "Detail", value: detail || "—", inline: true }
    )
    .setTimestamp();

  return channel.send({ embeds: [embed] });
}

// ---------- Safe AI message ----------
async function sendAIMessage(channel, text) {
  if (!text || typeof text !== "string") {
    return channel.send("⚠️ Rustline AI returned an invalid response.");
  }

  if (text.length <= 2000) {
    return channel.send(text);
  }

  const file = new AttachmentBuilder(Buffer.from(text), {
    name: "rustline-output.txt",
  });

  return channel.send({
    content: "📄 Response too long — sent as file.",
    files: [file],
  });
}

// ---------- Planner ----------
async function planActions(text, premium) {
  const prompt = `
User request: "${text}"

You are Rustline AI's planner.

You have these tools:

- createCategory(name)
- deleteCategory(name)
- createChannel(name, parent?, private?)
- deleteChannel(name)
- waitAndDeleteChannel(name, ms)
- createPrivateChannelForStaff(name, parent?)
- smartCreateChannel(name, parentName?, private?)
- createRole(name, perms)

You also have memory of previously created categories, channels, and roles.

Your job:
1. Understand the user's intent (structure, permissions, hierarchy).
2. Infer which channels should be private/staff-only.
3. Infer which channels belong under which categories.
4. Use smartCreateChannel when appropriate.
5. Use waitAndDeleteChannel for timed deletions.
6. Use createCategory before channels that reference it.

Return STRICT JSON:

{
  "steps": [
    {
      "tool": "createCategory",
      "args": { "name": "all chats" }
    },
    {
      "tool": "smartCreateChannel",
      "args": { "name": "admin-chat", "parentName": "all chats", "private": true }
    }
  ]
}

No commentary. No multiple JSON blocks.
`;

  const raw = await callRustlineAI({
    messages: [{ role: "user", content: prompt }],
    premium,
    jsonSafe: true,
  });

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  const jsonString = raw.slice(firstBrace, lastBrace + 1);

  let plan;
  try {
    plan = JSON.parse(jsonString);
  } catch (e) {
    console.error("Plan parse error:", e, raw);
    return null;
  }

  for (const step of plan.steps || []) {
    if (step.args) {
      const allowed = ["name", "ms", "parentName", "parent", "private"];
      for (const key of Object.keys(step.args)) {
        if (!allowed.includes(key)) delete step.args[key];
      }
    }
  }

  return plan;
}

// ---------- Executor ----------
async function executePlan(plan, guild, channel, user) {
  if (!plan || !Array.isArray(plan.steps)) {
    return channel.send("⚠️ Rustline AI failed to create a valid plan.");
  }

  for (const step of plan.steps) {
    const { tool, args } = step;

    await sendStatus(channel, "Using tool", tool);

    switch (tool) {
      case "createCategory": {
        const name = args?.name || "new-category";
        const result = await actions.createCategory(guild, name, user);
        await channel.send(result.msg || result);
        break;
      }

      case "deleteCategory": {
        const name = args?.name || "unknown";
        const result = await actions.deleteCategory(guild, name, user);
        await channel.send(result);
        break;
      }

      case "createChannel": {
        const name = args?.name || "new-channel";
        const parentName = args?.parentName;
        const parentId = parentName
          ? require("../memory/memoryStore").getItemId("categories", parentName)
          : null;
        const result = await actions.createChannel(
          guild,
          name,
          user,
          parentId ? { parentId } : {}
        );
        await channel.send(result);
        break;
      }

      case "smartCreateChannel": {
        const name = args?.name || "new-channel";
        const parentName = args?.parentName;
        const privateFlag = !!args?.private;
        const result = await actions.smartCreateChannel(guild, name, user, {
          parentName,
          private: privateFlag,
        });
        await channel.send(result);
        break;
      }

      case "deleteChannel": {
        const name = args?.name || "unknown";
        const result = await actions.deleteChannel(guild, name, user);
        await channel.send(result);
        break;
      }

      case "waitAndDeleteChannel": {
        const name = args?.name || "unknown";
        const ms = args?.ms || 3000;
        const result = await actions.waitAndDeleteChannel(guild, name, user, ms);
        await channel.send(result);
        break;
      }

      case "createPrivateChannelForStaff": {
        const name = args?.name || "staff-chat";
        const parentName = args?.parentName;
        const parentId = parentName
          ? require("../memory/memoryStore").getItemId("categories", parentName)
          : null;
        const result = await actions.createPrivateChannelForStaff(
          guild,
          name,
          user,
          parentId || null
        );
        await channel.send(result);
        break;
      }

      case "createRole": {
        const name = args?.name || "New Role";
        const perms = args?.perms || [];
        const result = await actions.createRole(guild, name, perms, user);
        await channel.send(result);
        break;
      }

      default:
        await channel.send(`⚠️ Unknown tool in plan: ${tool}`);
        break;
    }
  }
}

// ---------- Session (used by /chat, can also be used for mentions) ----------
function startBuilderSession(client, thread, user, note) {
  thread.send("🧠 Rustline AI is active. Describe what you want.");

  const collector = thread.createMessageCollector({
    filter: (m) => m.author.id === user.id,
  });

  collector.on("collect", async (msg) => {
    const text = msg.content.trim();
    const premium = await isPremium(user.id);
    const guild = thread.guild;

    if (/create|make|build|generate|delete|channel|category|role/i.test(text)) {
      await sendStatus(thread, "Thinking…", "Planning tools to use");

      const plan = await planActions(text, premium);
      await executePlan(plan, guild, thread, user);
      return;
    }

    await sendStatus(thread, "Thinking…", "Normal AI reply");
    const aiResponse = await callRustlineAI({
      messages: [{ role: "user", content: text }],
      premium,
    });

    return sendAIMessage(thread, aiResponse);
  });
}

module.exports = { startBuilderSession, planActions, executePlan };
