// src/support/supportTools.js
const { supabase } = require("../lib/supabase");

async function checkKey(key) {
  const { data, error } = await supabase
    .from("license_keys")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("checkKey error:", error);
    return { ok: false, reason: "db_error" };
  }

  if (!data) return { ok: false, reason: "not_found" };

  return {
    ok: true,
    key: data.key,
    used: data.used,
    used_by: data.used_by,
    created_at: data.created_at,
  };
}

async function verifyPremium(discordId) {
  const { data, error } = await supabase
    .from("premium_users")
    .select("*")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (error) {
    console.error("verifyPremium error:", error);
    return { ok: false, reason: "db_error" };
  }

  if (!data) return { ok: false, reason: "not_premium" };

  return {
    ok: true,
    discord_id: data.discord_id,
    license_key: data.license_key,
    created_at: data.created_at,
  };
}

async function logSupportIssue(discordId, issue) {
  const { error } = await supabase
    .from("support_logs")
    .insert({
      discord_id: discordId,
      issue,
    });

  if (error) {
    console.error("logSupportIssue error:", error);
    return { ok: false };
  }

  return { ok: true };
}

module.exports = {
  checkKey,
  verifyPremium,
  logSupportIssue,
};
