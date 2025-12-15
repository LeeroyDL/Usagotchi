import Link from "next/link";

export default function Home() {
  return (
    <div className="card">
      <h1 className="h1">Welcome to Usagotchi 🦖</h1>
      <p className="p">
        A tiny shared dino-care game for exactly two humans. 30 seconds a day, max.
      </p>
      <div className="row">
        <Link className="btn" href="/today">Go to Today</Link>
        <Link className="btn secondary" href="/login">Login</Link>
      </div>
      <div className="hr" />
      <p className="small">
        If you ever see a scary error: copy it here and I’ll fix it.
      </p>
    </div>
  );
}
