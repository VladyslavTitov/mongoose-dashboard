"use client";
import { useState, type FormEvent } from "react";
export default function Login() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const password = new FormData(e.currentTarget).get("password");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "fetch",
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.assign("/");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <div className="login-card">
        <div className="brand-mark">M</div>
        <p className="eyebrow">MONGOOSE · ADMIN</p>
        <h1>Welcome back</h1>
        <p>Sign in to manage your website.</p>
        <form onSubmit={submit}>
          <label>
            Admin password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={200}
            />
          </label>
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          {message && <p role="alert">{message}</p>}
        </form>
      </div>
    </main>
  );
}
