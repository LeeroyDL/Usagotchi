"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser, normalizeEmail } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) router.replace("/today");
    });
  }, [router, supabase]);

  async function sendLink() {
    setBusy(true);
    setStatus("");
    try {
      const e = normalizeEmail(email);
      if (!e || !e.includes("@")) {
        setStatus("Please type a real email address.");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo: `${window.location.origin}/today` }
      });
      if (error) throw error;
      setStatus("Magic link sent. Open your email and click the link.");
    } catch (err) {
      setStatus(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h1 className="h1">Login</h1>
      <p className="p">
        We use a magic link (no password). Only the two allowed emails can use this app.
      </p>
      <input
        className="input"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="spacer" />
      <div className="row">
        <button className="btn" disabled={busy} onClick={sendLink}>
          {busy ? "Sending…" : "Send magic link"}
        </button>
      </div>
      <div className="spacer" />
      {status ? <div className="quote">{status}</div> : null}
      <div className="hr" />
      <p className="small">
        Tip: On phones, check spam/junk if you don’t see the email.
      </p>
    </div>
  );
}
