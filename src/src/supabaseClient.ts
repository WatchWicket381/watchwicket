import { createClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[SUPABASE] Missing environment variables");
  console.error("[SUPABASE] VITE_SUPABASE_URL:", SUPABASE_URL ? "present" : "MISSING");
  console.error("[SUPABASE] VITE_SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "present" : "MISSING");
  throw new Error(
    "[SUPABASE] Missing required environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file."
  );
}

if (typeof SUPABASE_URL !== 'string' || SUPABASE_URL.trim() === '') {
  console.error("[SUPABASE] Invalid SUPABASE_URL:", SUPABASE_URL);
  throw new Error("[SUPABASE] VITE_SUPABASE_URL must be a non-empty string");
}

if (typeof SUPABASE_ANON_KEY !== 'string' || SUPABASE_ANON_KEY.trim() === '') {
  console.error("[SUPABASE] Invalid SUPABASE_ANON_KEY");
  throw new Error("[SUPABASE] VITE_SUPABASE_ANON_KEY must be a non-empty string");
}

try {
  const urlObj = new URL(SUPABASE_URL);
  const urlHost = urlObj.host;

  console.log("=".repeat(60));
  console.log("[SUPABASE PROJECT HOST]", urlHost);
  console.log("[SUPABASE FULL URL]", SUPABASE_URL);
  console.log("=".repeat(60));

  console.log("✓ Supabase client initialized successfully");
} catch (err) {
  console.error("[SUPABASE] Invalid URL format:", SUPABASE_URL);
  throw new Error("[SUPABASE] VITE_SUPABASE_URL is not a valid URL");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
