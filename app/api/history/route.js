import { getAdminClient, userFromBearer, allowed } from "../_supabaseAdmin";

export async function GET(req){
  try{
    const admin = getAdminClient();
    const auth = await userFromBearer(req, admin);
    if (!auth?.user) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (!allowed(auth.user.email)) return Response.json({ error: "Not allowed" }, { status: 403 });

    // last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const yyyy = since.getFullYear();
    const mm = String(since.getMonth()+1).padStart(2,"0");
    const dd = String(since.getDate()).padStart(2,"0");
    const sinceStr = `${yyyy}-${mm}-${dd}`;

    const { data: rows, error } = await admin
      .from("daily_actions")
      .select("action_date, user_id, checked_in, mood, note, created_at")
      .gte("action_date", sinceStr)
      .order("action_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map user_id -> "You/Partner" based on email match from auth.users via admin API (simple: just show "Human A/B")
    const mapped = (rows || []).map((r, i) => ({
      key: `${r.action_date}-${r.user_id}-${i}`,
      date: r.action_date,
      who: "Human",
      checked_in: !!r.checked_in,
      mood: r.mood || "",
      note: r.note || ""
    }));

    return Response.json({ rows: mapped });
  }catch(err){
    return Response.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
