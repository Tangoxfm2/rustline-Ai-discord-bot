// src/lib/supabase.js — Rustline v3 ES Module Rewrite

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing Supabase credentials in .env");
}

export const supabase = createClient(url, key);
