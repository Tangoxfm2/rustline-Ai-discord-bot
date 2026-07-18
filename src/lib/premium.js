// src/lib/premium.js — Rustline v3 ES Module Rewrite

import { supabase } from "./supabase.js";

/**
 * Checks if a user has premium status.
 * Returns true or false.
 */
export async function isPremium(userId) {
  try {
    const { data, error } = await supabase
      .from("premium_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase premium check error:", error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("Premium check failed:", err.message);
    return false;
  }
}

/**
 * Redeems a premium key for a user.
 */
export async function redeemKey(userId, key) {
  try {
    const { data: keyData, error: keyError } = await supabase
      .from("premium_keys")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (keyError || !keyData) {
      return { ok: false, msg: "❌ Invalid or already used key." };
    }

    // Mark key as used
    await supabase
      .from("premium_keys")
      .update({ used_by: userId })
      .eq("key", key);

    // Add user to premium table
    await supabase.from("premium_users").insert({
      user_id: userId,
      activated_at: new Date().toISOString(),
    });

    return { ok: true, msg: "🎉 Premium activated!" };
  } catch (err) {
    console.error("Redeem key error:", err.message);
    return { ok: false, msg: "❌ Failed to redeem key." };
  }
}
