"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Github,
  LoaderCircle,
  LockKeyhole,
  ScanEye,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "./brand";
export function AuthForm({ mode }: { mode: "login" | "signup" | "reset" }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [supabase, setSupabase] = useState(false);
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setSupabase(d.supabase);
        if (d.user && mode !== "reset") router.replace("/dashboard");
      })
      .catch(() => {});
    if (new URLSearchParams(window.location.search).has("error"))
      setError(
        "The sign-in link expired or could not be verified. Please try again.",
      );
  }, [mode, router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await send({
      action: mode,
      email: data.get("email"),
      ...(mode !== "reset" ? { password: data.get("password") } : {}),
      ...(mode === "signup" ? { name: data.get("name") } : {}),
    });
  }
  async function send(body: object) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.message) setMessage(data.message);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="auth-page">
      <div className="auth-main">
        <div className="auth-top">
          <Brand />
          <Link href="/" className="text-link">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
        <div className="auth-form-wrap">
          <span className="auth-symbol">
            <ScanEye size={26} />
          </span>
          <span className="eyebrow">A FRESH PAIR OF EYES.</span>
          <h1>
            {mode === "signup"
              ? "Better code starts here."
              : mode === "reset"
                ? "Let’s get you back in."
                : "Good to see you again."}
          </h1>
          <p>
            {mode === "signup"
              ? "Create your workspace. Give your next commit a closer look."
              : mode === "reset"
                ? "We’ll send a secure recovery link to your email."
                : "Your repositories. Your reviews. A little more clarity."}
          </p>
          {mode !== "reset" && (
            <>
              <button
                disabled={busy}
                onClick={() => send({ action: "github" })}
                className="button button-dark auth-github"
              >
                <Github size={17} /> Continue with GitHub{" "}
                <ArrowRight size={15} />
              </button>
              {!supabase && (
                <p className="auth-provider-note">
                  GitHub sign-in needs Supabase configuration. Email works now.
                </p>
              )}
              <div className="auth-divider">
                <span />
                or continue with email
                <span />
              </div>
            </>
          )}
          {error && (
            <div role="alert" className="error-message">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="success-message">
              {message}
            </div>
          )}
          <form onSubmit={submit} className="auth-form">
            {mode === "signup" && (
              <label>
                Your name
                <input
                  required
                  name="name"
                  placeholder="Ansh Roshan"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                name="email"
                type="email"
                placeholder="you@yourcompany.com"
                autoComplete="email"
                maxLength={254}
              />
            </label>
            {mode !== "reset" && (
              <label>
                <span className="password-label">
                  Password
                  {mode === "login" && (
                    <Link href="/forgot-password">Forgot password?</Link>
                  )}
                </span>
                <span className="password-input">
                  <input
                    required
                    name="password"
                    aria-label="Password"
                    type={show ? "text" : "password"}
                    placeholder={
                      mode === "signup"
                        ? "At least 8 characters"
                        : "Enter your password"
                    }
                    minLength={8}
                    maxLength={128}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            )}
            <button disabled={busy} className="button button-primary">
              {busy ? (
                <LoaderCircle size={17} className="loading-spinner" />
              ) : null}
              {busy
                ? "One moment…"
                : mode === "signup"
                  ? "Create your account"
                  : mode === "reset"
                    ? "Send recovery link"
                    : "Sign in to your workspace"}
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "signup"
              ? "Already have an account?"
              : mode === "reset"
                ? "Remember your password?"
                : "New to Loupe?"}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Create an account" : "Sign in"}{" "}
              <ArrowUpIcon />
            </Link>
          </p>
          <p className="auth-legal">
            By continuing, you acknowledge how Loupe handles your data.
            <br />
            <Link href="/docs#privacy">
              Read our privacy and security notes.
            </Link>
          </p>
        </div>
        <div className="auth-bottom">
          <LockKeyhole size={12} /> Your code. Your keys. Your control.
        </div>
      </div>
      <aside className="auth-aside">
        <div className="auth-aside-content">
          <div className="auth-lens">
            <ScanEye size={76} strokeWidth={1.1} />
          </div>
          <h2>
            Good code is
            <br />a team effort.
          </h2>
          <p>
            A thoughtful second opinion.
            <br />
            Right when you need it.
          </p>
          <div className="auth-benefits">
            {[
              "Catch issues before they reach production",
              "Real repository scans. Actionable findings.",
              "Open source, with nothing to hide",
            ].map((t) => (
              <span key={t}>
                <Check size={14} />
                {t}
              </span>
            ))}
          </div>
          <div className="auth-trust">
            <ShieldCheck size={19} />
            <span>
              Built for trust.
              <br />
              <b>Designed for the details.</b>
            </span>
          </div>
        </div>
        <span className="auth-aside-footer">A closer look. Better code.</span>
      </aside>
    </main>
  );
}
function ArrowUpIcon() {
  return <ArrowRight size={11} />;
}
