import { createClient } from "@supabase/supabase-js";

let browserClient = null;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  browserClient = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return browserClient;
}

export function normalizeEmail(e){ return (e || "").trim().toLowerCase(); }

export function isAllowedEmail(email){
  const a = normalizeEmail(process.env.NEXT_PUBLIC_ALLOWED_EMAIL_1);
  const b = normalizeEmail(process.env.NEXT_PUBLIC_ALLOWED_EMAIL_2);
  const x = normalizeEmail(email);
  return !!x && (x === a || x === b);
}
