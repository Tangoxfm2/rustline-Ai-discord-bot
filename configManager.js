import fs from "fs";

export function loadConfig() {
  return JSON.parse(fs.readFileSync("./rustlineConfig.json", "utf8"));
}

export function saveConfig(config) {
  fs.writeFileSync("./rustlineConfig.json", JSON.stringify(config, null, 2));
}
