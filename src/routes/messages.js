import express from "express";
import { createSession, getSession, addMessage } from "./sessionStore.js";
import { AI_CONFIG } from "./config.js";


const router = express.Router();

router.post("/", async (req, res) => {
  let { sessionId, content } = req.body;

  if (!sessionId) {
    const newSession = createSession();
    sessionId = newSession.id;
  }

  const session = getSession(sessionId);

  addMessage(sessionId, { role: "user", content });

  const prompt = [
    { role: "system", content: AI_CONFIG.personality },
    ...session.messages
  ];

  const replyText = await callModel(prompt);

  const reply = { role: "assistant", content: replyText };
  addMessage(sessionId, reply);

  res.json({ sessionId, reply });
});

export default router;
