"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Dark/light theme toggle. The actual theme lives on
 * `document.documentElement.dataset.theme` (set before first paint by the
 * bootstrap script in the root layout) and persists in localStorage under
 * "loupe-theme". The generated dark palette is in globals.css.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light" | undefined>(undefined);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("loupe-theme", next);
    } catch {
      // storage unavailable (private mode) — theme still applies for this visit
    }
  }

  // Render an inert placeholder until mounted so SSR markup never disagrees
  // with the client (the real theme is only known in the browser).
  return (
    <button
      type="button"
      className={`icon-button theme-toggle${className ? ` ${className}` : ""}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      disabled={theme === undefined}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
