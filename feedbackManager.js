import fs from "fs";

const FEEDBACK_PATH = "./aiFeedback.json";

export function loadFeedback() {
  if (!fs.existsSync(FEEDBACK_PATH)) {
    return {
      good: 0,
      bad: 0,
      packets: []
    };
  }

  const data = JSON.parse(fs.readFileSync(FEEDBACK_PATH, "utf8"));

  // SAFETY DEFAULTS
  if (!Array.isArray(data.packets)) data.packets = [];
  if (typeof data.good !== "number") data.good = 0;
  if (typeof data.bad !== "number") data.bad = 0;

  return data;
}

export function saveFeedback(data) {
  fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(data, null, 2));
}

export function addFeedbackPacket(packet) {
  const data = loadFeedback();

  if (packet.type === "GOOD") data.good++;
  if (packet.type === "BAD") data.bad++;

  data.packets.push({
    ...packet,
    timestamp: new Date().toISOString()
  });

  saveFeedback(data);
}
