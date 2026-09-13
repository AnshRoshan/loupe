"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
export default function ResetPassword() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const password = new FormData(e.currentTarget).get("password");
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="simple-auth">
      <Brand />
      <h1>A fresh start.</h1>
      <p>Choose a new, strong password for your account.</p>
      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}
      {done ? (
        <div className="success-message">
          Your password has been updated.{" "}
          <Link href="/dashboard">Go to your workspace →</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label>
            New password
            <input
              required
              type="password"
              name="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <button disabled={busy} className="button button-primary">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </main>
  );
}
