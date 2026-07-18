import express from "express";
import { createSession } from "./sessionStore.js";

const router = express.Router();

router.post("/", (req, res) => {
  const session = createSession();
  res.json(session);
});

export default router;
