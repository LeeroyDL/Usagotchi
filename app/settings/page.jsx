"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser, isAllowedEmail } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

export default function SettingsPage(){
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);

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
      const res = await fetch("/api/state", { headers: { Authorization: `Bearer ${data.session.access_token}` }});
      const j = await res.json();
      if (res.ok) setEnabled(!!j.settings?.reminders_enabled);
      setLoading(false);
    }
    boot();
    return () => { alive = false; };
  }, [router, supabase]);

  async function save(){
    setBusy(true);
    try{
      const res = await fetch("/api/settings", {
        method:"POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${session.access_token}` },
        body: JSON.stringify({ reminders_enabled: enabled })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      alert("Saved ✅");
    }catch(e){
      alert(e.message || "Error");
    }finally{
      setBusy(false);
    }
  }

  if (loading) return <div className="card"><h1 className="h1">Settings</h1><p className="p">Loading…</p></div>;

  return (
    <div className="card">
      <h1 className="h1">Settings</h1>
      <p className="p">Small toggles. No drama.</p>

      <div className="item">
        <div>
          <strong>Daily reminder line</strong>
          <div className="small">Shows a little “your dino is waiting” message on the Today screen.</div>
        </div>
        <div className="row">
          <label className="badge" style={{cursor:"pointer"}}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e)=>setEnabled(e.target.checked)}
              style={{marginRight:8}}
            />
            {enabled ? "ON" : "OFF"}
          </label>
        </div>
      </div>

      <div className="spacer" />
      <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
    </div>
  );
}
