import { loadFeedback } from "./feedbackManager.js";

export function buildAdaptiveBrain() {
  const fb = loadFeedback();

  // SAFETY DEFAULTS
  const good = fb.good || 0;
  const bad = fb.bad || 0;
  const packets = Array.isArray(fb.packets) ? fb.packets : [];

  const total = good + bad || 1;
  const score = good / total;

  const last = packets.length > 0 ? packets[packets.length - 1] : null;

  let personality = "balanced_coder";
  let accuracyMode = "normal";
  let detailLevel = "medium";
  let architecture = "rustline_js";

  // Personality based on score
  if (score > 0.75) personality = "confident_senior_dev";
  if (score < 0.40) personality = "strict_accuracy_dev";

  // Apply last packet rules safely
  if (last?.rewrite_mode === "strict") accuracyMode = "strict";
  if (last?.rewrite_mode === "full") detailLevel = "high";
  if (last?.architecture) architecture = last.architecture;

  return { personality, accuracyMode, detailLevel, architecture };
}
