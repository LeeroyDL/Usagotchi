"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser, isAllowedEmail } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

export default function HistoryPage(){
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => {
    let alive = true;
    async function boot(){
      const { data } = await supabase.auth.getSession();
      if (!data?.session) { router.replace("/login"); return; }
      const email = data.session.user?.email || "";
      if (!isAllowedEmail(email)) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }
      if (!alive) return;
      setSession(data.session);

      const res = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });
      const j = await res.json();
      if (!res.ok) { setError(j?.error || "Failed"); setLoading(false); return; }
      setRows(j.rows || []);
      setLoading(false);
    }
    boot();
    return () => { alive = false; };
  }, [router, supabase]);

  if (loading) {
    return <div className="card"><h1 className="h1">History</h1><p className="p">Loading…</p></div>;
  }
  if (error) {
    return <div className="card"><h1 className="h1">History</h1><div className="quote">{error}</div></div>;
  }

  return (
    <div className="card">
      <h1 className="h1">History</h1>
      <p className="p">A simple log of the last 30 days (both of you).</p>
      <div className="list">
        {rows.length === 0 ? <div className="quote">No entries yet. The dino is judging silently.</div> : null}
        {rows.map((r) => (
          <div className="item" key={r.key}>
            <div>
              <strong>{r.date}</strong>
              <div className="small">{r.who}: {r.checked_in ? "✅ checked in" : "—"}</div>
              {r.mood ? <div className="small">Mood: {r.mood}</div> : null}
              {r.note ? <div className="small">Note: {r.note}</div> : null}
            </div>
            <div className="badge">{r.checked_in ? "❤️" : "…"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
