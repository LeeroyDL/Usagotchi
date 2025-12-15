"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser, isAllowedEmail, normalizeEmail } from "@/lib/supabaseBrowser";
import { XP, stageFromLevel } from "@/lib/constants";
import { useRouter } from "next/navigation";

const MOODS = ["😄", "🙂", "😐", "😴", "😍", "😤"];

export default function TodayPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [creature, setCreature] = useState(null);
  const [today, setToday] = useState(null);
  const [settings, setSettings] = useState({ reminders_enabled: true });

  const [note, setNote] = useState("");
  const [mood, setMood] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace("/login");
        return;
      }
      const email = data.session.user?.email || "";
      if (!isAllowedEmail(email)) {
        await supabase.auth.signOut();
        alert("This email is not allowed for this private app.");
        router.replace("/login");
        return;
      }
      if (!alive) return;
      setSession(data.session);

      await refreshState(data.session.access_token);
      if (!alive) return;
      setLoading(false);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router, supabase]);

  async function refreshState(accessToken) {
    const res = await fetch("/api/state", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "Failed to load state");
    setCreature(j.creature);
    setToday(j.today);
    setSettings(j.settings);
    setNote(j.today?.note || "");
    setMood(j.today?.mood || "");
    setMessage(j.message || "");
  }

  function dinoImage(stage){
    return `/creature/stage${stage || 1}.png`;
  }

  const progress = (() => {
    if (!creature) return 0;
    const pct = (creature.xp % XP.LEVEL_XP) / XP.LEVEL_XP;
    return Math.max(0, Math.min(1, pct));
  })();

  async function doCheckin() {
    setBusy(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mood, note })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Check-in failed");
      setMessage(j.message || "");
      // refresh state
      await refreshState(token);
    } catch (err) {
      alert(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function saveOptional() {
    setBusy(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/optional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mood, note })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setMessage(j.message || "");
      await refreshState(token);
    } catch (err) {
      alert(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function logout(){
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="card">
        <h1 className="h1">Loading…</h1>
        <p className="p">Waking the dino.</p>
      </div>
    );
  }

  const stage = creature?.stage || stageFromLevel(creature?.level || 1);

  return (
    <div className="card">
      <h1 className="h1">Today</h1>

      {settings?.reminders_enabled ? (
        <div className="badge">🔔 Reminder: give the dino 1 tap of affection.</div>
      ) : (
        <div className="badge">🔕 Reminders are off.</div>
      )}

      <div className="spacer" />
<div
  style={{
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  }}
>
  {/* Dino card */}
  <div
    style={{
      width: 220,
      padding: 12,
      borderRadius: 18,
      border: "1px solid var(--line)",
      background: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      boxSizing: "border-box",
    }}
  >
    <img
      src={dinoImage(stage)}
      alt="Usagotchi dino"
      style={{
        width: 196,
        height: 196,
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
      }}
    />
    <div style={{ fontWeight: 800, fontSize: 18 }}>
      {creature?.name ?? "Usagotchi"}
    </div>
  </div>

  {/* Stats */}
  <div style={{ flex: 1, minWidth: 240 }}>
    <div className="kpi">
      <div className="box">
        <div className="label">Level</div>
        <div className="value">{creature?.level ?? "—"}</div>
      </div>
      <div className="box">
        <div className="label">Stage</div>
        <div className="value">{creature?.stage ?? stage}</div>
      </div>
      <div className="box">
        <div className="label">XP</div>
        <div className="value">{creature?.xp ?? "—"}</div>
      </div>
    </div>
  </div>
</div>

          <div className="spacer" />
          <div className="progress" title="Progress to next level">
            <div style={{width: `${Math.round(progress * 100)}%`}} />
          </div>
          <div className="spacer" />
         <div className="spacer" />

<div className="progress" title="Progress to next level">
  <div style={{ width: `${Math.round(progress * 100)}%` }} />
</div>

<div className="spacer" />

{message ? (
  <div className="quote">{message}</div>
) : null}

<div className="hr" />


     <div style={{ marginTop: 16 }}>
  <div className="row">
    <button className="btn">
      Showed care today ❤️
    </button>
  </div>
</div>


      <div className="spacer" />

      <div className="row" style={{alignItems:"stretch", width:"100%"}}>
        <div style={{flex:1, minWidth: 220}}>
          <div className="small">Mood (optional)</div>
          <div className="row" style={{marginTop:8}}>
            {MOODS.map((m) => (
              <button
                key={m}
                className={"btn secondary"}
                style={{padding:"10px 12px"}}
                onClick={() => setMood(m)}
                disabled={busy}
                aria-pressed={mood === m}
                title="Pick a mood"
              >
                {m}
              </button>
            ))}
            <button className="btn secondary" onClick={() => setMood("")} disabled={busy}>Clear</button>
          </div>
        </div>

        <div style={{flex:1, minWidth: 260}}>
          <div className="small">One-line note (optional)</div>
          <input
            className="input"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., 'I stole you a blanket and called it teamwork.'"
            disabled={busy}
            style={{marginTop:8}}
          />
          <div className="spacer" />
          <button className="btn secondary" onClick={saveOptional} disabled={busy}>
            Save optional (+{XP.OPTIONAL} XP if new)
          </button>
        </div>
      </div>

      <div className="hr" />
      <p className="small">
        This is private: only the two allowed emails can log in.
      </p>
    </div>
  );
}
