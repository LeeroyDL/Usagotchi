import { createClient } from "@supabase/supabase-js";

export function getAdminClient(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function norm(e){ return (e || "").trim().toLowerCase(); }

export function allowed(email){
  const a = norm(process.env.ALLOWED_EMAIL_1);
  const b = norm(process.env.ALLOWED_EMAIL_2);
  const x = norm(email);
  return !!x && (x === a || x === b);
}

export async function userFromBearer(req, admin){
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return { user: data.user, token };
}
