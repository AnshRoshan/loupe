"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Github, Menu, X, Star } from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Brand />
        <nav
          className={open ? "nav-links is-open" : "nav-links"}
          aria-label="Main navigation"
        >
          <Link href="/#features" onClick={() => setOpen(false)}>
            Product
          </Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/docs" onClick={() => setOpen(false)}>
            Documentation <ArrowUpRight size={13} />
          </Link>
          <a
            href="https://github.com/anshace/loupe"
            target="_blank"
            rel="noreferrer"
            className="github-nav"
          >
            <Github size={17} /> Open source <Star size={13} />
          </a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Link href="/signup" className="button button-dark button-small">
            Get started <ArrowUpRight size={15} />
          </Link>
          <button
            className="mobile-toggle icon-button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
