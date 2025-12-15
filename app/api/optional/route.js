import { getAdminClient, userFromBearer, allowed } from "../_supabaseAdmin";
import { XP } from "@/lib/constants";

function msg(){
  const arr = [
    "Optional info saved. I will archive this for future emotional leverage.",
    "Mood recorded. I’m basically your tiny therapist now.",
    "Note saved. I will absolutely not judge you. (I will.)"
  ];
  return arr[Math.floor(Math.random()*arr.length)];
}

export async function POST(req){
  try{
    const admin = getAdminClient();
    const auth = await userFromBearer(req, admin);
    if (!auth?.user) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (!allowed(auth.user.email)) return Response.json({ error: "Not allowed" }, { status: 403 });

    const body = await req.json().catch(()=>({}));
    const mood = (body?.mood || "").toString().slice(0,8);
    const note = (body?.note || "").toString().slice(0,120);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth()+1).padStart(2,"0");
    const dd = String(now.getDate()).padStart(2,"0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Load previous optional
    const { data: before } = await admin
      .from("daily_actions")
      .select("mood,note,checked_in")
      .eq("user_id", auth.user.id)
      .eq("action_date", dateStr)
      .maybeSingle();

    // Upsert (doesn't require checked_in)
    const { error: upErr } = await admin
      .from("daily_actions")
      .upsert({ user_id: auth.user.id, action_date: dateStr, mood, note, checked_in: before?.checked_in ?? false }, { onConflict: "user_id,action_date" });
    if (upErr) throw upErr;

    const hadOptional = !!(before?.mood || before?.note);
    const hasOptional = !!(mood || note);

    let awarded = 0;
    if (!hadOptional && hasOptional) {
      // award OPTIONAL XP once per day per user
      const { data: creature } = await admin.from("creature").select("*").limit(1).maybeSingle();
      const newXP = (creature?.xp || 0) + XP.OPTIONAL;
      const newLevel = Math.max(1, Math.floor(newXP / XP.LEVEL_XP) + 1);
      // stage recalculated in state endpoint; keep stage update minimal
      await admin.from("creature").update({ xp: newXP, level: newLevel }).eq("id", creature.id);
      awarded = XP.OPTIONAL;
    }

    return Response.json({ ok:true, awarded, message: msg() });
  }catch(err){
    return Response.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
