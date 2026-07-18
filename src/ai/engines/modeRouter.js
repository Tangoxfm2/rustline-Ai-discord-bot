// src/ai/engines/modeRouter.js — Rustline v3 ES Module Rewrite

/**
 * Detects which AI mode should be used based on the user's message.
 * This is Rustline's "brain router".
 */

export function detectMode(prompt) {
  const lower = prompt.toLowerCase();

  // Support mode
  if (
    lower.includes("help") ||
    lower.includes("support") ||
    lower.includes("issue") ||
    lower.includes("problem") ||
    lower.includes("bug")
  ) {
    return "support_mode";
  }

  // Builder mode (server builder)
  if (
    lower.includes("build a server") ||
    lower.includes("server builder") ||
    lower.includes("make me a server") ||
    lower.includes("design a server")
  ) {
    return "server_mode";
  }

  // Bot builder mode
  if (
    lower.includes("build a bot") ||
    lower.includes("bot builder") ||
    lower.includes("make me a bot") ||
    lower.includes("design a bot")
  ) {
    return "bot_mode";
  }

  // Command mode
  if (
    lower.startsWith("!") ||
    lower.includes("command:") ||
    lower.includes("make a command") ||
    lower.includes("create a command")
  ) {
    return "command_mode";
  }

  // Entertainment mode
  if (
    lower.includes("joke") ||
    lower.includes("funny") ||
    lower.includes("meme") ||
    lower.includes("entertain me")
  ) {
    return "entertainment_mode";
  }

  // Image mode
  if (
    lower.includes("image") ||
    lower.includes("draw") ||
    lower.includes("generate an image") ||
    lower.includes("picture")
  ) {
    return "image_mode";
  }

  // Default chat mode
  return "chat_mode";
}
