import "./globals.css";

export const metadata = {
  title: "Usagotchi",
  description: "A tiny shared dino-care game for two people."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">
              <span className="logo">🦖</span>
              <span className="title">Usagotchi</span>
            </div>
            <nav className="nav">
              <a className="navlink" href="/today">Today</a>
              <a className="navlink" href="/history">History</a>
              <a className="navlink" href="/settings">Settings</a>
            </nav>
          </header>
          <main className="main">{children}</main>
          <footer className="footer">Made for two humans and one needy dino.</footer>
        </div>
      </body>
    </html>
  );
}
