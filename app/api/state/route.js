import { getAdminClient, userFromBearer, allowed } from "../_supabaseAdmin";
import { XP, stageFromLevel } from "@/lib/constants";

function pickMessage({bothDone, youDone, reminderOn}){
  const cute = [
    "I am a tiny dinosaur. I require exactly one (1) daily affection. Please comply.",
    "I accept love, praise, and snacks. Mostly love. But also snacks.",
    "Your relationship seems… operational. I approve."
  ];
  const sarcastic = [
    "Ah yes. Attention. My favorite nutrient.",
    "Two humans showed up. I am thriving.",
    "One of you is missing. I will remember this. (Not really.)",
    "If love is a sport, you're at least stretching today."
  ];

  if (bothDone) return sarcastic[1];
  if (youDone) return "Nice. Now convince the other human. No pressure. (Some pressure.)";
  if (reminderOn) return sarcastic[0];
  return cute[0];
}

export async function GET(req){
  try{
    const admin = getAdminClient();
    const auth = await userFromBearer(req, admin);
    if (!auth?.user) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (!allowed(auth.user.email)) return Response.json({ error: "Not allowed" }, { status: 403 });

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth()+1).padStart(2,"0");
    const dd = String(today.getDate()).padStart(2,"0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const [{ data: creature, error: e1 }, { data: settings, error: e2 }] = await Promise.all([
      admin.from("creature").select("*").limit(1).maybeSingle(),
      admin.from("app_settings").select("*").limit(1).maybeSingle()
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const { data: mine } = await admin
      .from("daily_actions")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("action_date", dateStr)
      .maybeSingle();

    // did both check in?
    const { data: allToday } = await admin
      .from("daily_actions")
      .select("user_id,checked_in")
      .eq("action_date", dateStr);

    const checked = (allToday || []).filter(x => x.checked_in).map(x => x.user_id);
    const bothDone = checked.length >= 2;
    const youDone = !!mine?.checked_in;
    const reminderOn = settings?.reminders_enabled ?? true;

    const msg = pickMessage({bothDone, youDone, reminderOn});

    // normalize stage based on level (and store if missing)
    const desiredStage = creature?.stage ?? stageFromLevel(creature?.level ?? 1);

    return Response.json({
      creature: { ...creature, stage: desiredStage },
      today: mine || { action_date: dateStr, checked_in: false, mood: "", note: "" },
      settings: settings || { reminders_enabled: true },
      message: msg
    });
  }catch(err){
    return Response.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
