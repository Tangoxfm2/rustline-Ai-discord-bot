// src/core/memoryStore.js — Rustline v3 Memory Store
const { supabase } = require("../lib/supabase");

async function saveMemory(userId, type, data) {
  await supabase.from("memories").insert({
    user_id: userId,
    type,
    data,
  });
}

async function getLastMemory(userId, type) {
  const { data } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .order("id", { ascending: false })
    .limit(1);

  return data?.[0] || null;
}

module.exports = { saveMemory, getLastMemory };
