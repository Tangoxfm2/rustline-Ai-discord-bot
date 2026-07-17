import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
const envResult = dotenv.config({ path: './.env' });

if (envResult.error) {
  console.error("❌ Failed to load .env file:", envResult.error);
} else {
  console.log("✅ .env loaded:", envResult.parsed);
}
if (!process.env.GROQ_API_KEY || !process.env.DSEEK_API_KEY) {
  console.warn("⚠️ WARNING: Missing AI API keys. Rustline AI will not respond.");
}

import messagesRouter from "./src/routes/messages.js";
import sessionsRouter from "./src/routes/sessions.js";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/v1/messages", messagesRouter);
app.use("/v1/sessions", sessionsRouter);

app.listen(3000, () => {
  console.log("Rustline AI running at http://localhost:3000");
});
