import { getAdminClient, userFromBearer, allowed } from "../_supabaseAdmin";

export async function POST(req){
  try{
    const admin = getAdminClient();
    const auth = await userFromBearer(req, admin);
    if (!auth?.user) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (!allowed(auth.user.email)) return Response.json({ error: "Not allowed" }, { status: 403 });

    const body = await req.json().catch(()=>({}));
    const enabled = !!body?.reminders_enabled;

    const { data: settings } = await admin.from("app_settings").select("*").limit(1).maybeSingle();
    if (!settings) {
      await admin.from("app_settings").insert({ reminders_enabled: enabled });
    } else {
      await admin.from("app_settings").update({ reminders_enabled: enabled }).eq("id", settings.id);
    }

    return Response.json({ ok:true });
  }catch(err){
    return Response.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
