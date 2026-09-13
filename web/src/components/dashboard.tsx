"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Download,
  FileCode2,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Github,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  ScanEye,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import type { ScanResult } from "@/db/schema";
type Scan = {
  id: string;
  repository: string;
  status: string;
  result: ScanResult | null;
  error: string | null;
  createdAt: string;
};
type User = { id: string; email: string; name: string } | null;
export function Dashboard({
  user,
  config,
}: {
  user: User;
  config: { supabase: boolean; ai: boolean; model: string };
}) {
  const [tab, setTab] = useState("overview");
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<Scan | null>(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [mobile, setMobile] = useState(false);
  const [repoValue, setRepoValue] = useState("");
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (user) load();
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (
      requested &&
      ["overview", "repositories", "reviews", "settings"].includes(requested)
    )
      setTab(requested);
  }, []);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      setTimeout(() => input.current?.focus(), 50);
    } else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scans");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScans(data.scans);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your reviews.");
    } finally {
      setLoading(false);
    }
  }
  function navigate(next: string) {
    setTab(next);
    setSelected(null);
    setQuery("");
    setMobile(false);
    window.history.replaceState(null, "", `/dashboard?tab=${next}`);
  }
  function newScan(repository = "") {
    dialog.current?.querySelector("form")?.reset();
    setRepoValue(repository);
    setError("");
    setModal(true);
  }
  async function scan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      window.location.assign("/signup");
      return;
    }
    setError("");
    setScanning(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: form.get("repository"),
          token: form.get("token") || undefined,
          ai: form.get("ai") === "on",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScans((prev) => [data.scan, ...prev]);
      setSelected(data.scan);
      setTab("reviews");
      setModal(false);
      setToast("Review complete. Your report has been saved.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The scan could not complete. Please retry.",
      );
      if (user) await loadAfterFailure();
    } finally {
      setScanning(false);
    }
  }
  async function loadAfterFailure() {
    try {
      const r = await fetch("/api/scans");
      const d = await r.json();
      if (r.ok) setScans(d.scans);
    } catch {}
  }
  async function remove(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/scans?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete this review.");
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) setSelected(null);
      setToast("Review deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete.");
    } finally {
      setDeleting(null);
    }
  }
  async function logout() {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    if (res.ok) window.location.assign("/");
    else setError("Could not sign out. Please try again.");
  }
  function download(scan: Scan) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(scan, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `loupe-${scan.repository.replace("/", "-")}-${scan.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Report exported as JSON.");
  }
  const completed = scans.filter((s) => s.status === "completed");
  const repos = [...new Set(scans.map((s) => s.repository))];
  const totalFindings = completed.reduce(
    (n, s) => n + (s.result?.findings.length || 0),
    0,
  );
  const filtered = scans.filter((s) =>
    s.repository.toLowerCase().includes(query.toLowerCase()),
  );
  const selectedFindings =
    selected?.result?.findings.filter(
      (f) =>
        (severity === "all" || f.severity === severity) &&
        `${f.title} ${f.file}`.toLowerCase().includes(query.toLowerCase()),
    ) || [];
  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${mobile ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <ThemeToggle />
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-chip">
          <span>{user?.name?.slice(0, 1).toUpperCase() || "Y"}</span>
          <div>
            <b>
              {user
                ? `${user.name.split(" ")[0]}’s workspace`
                : "Your workspace"}
            </b>
            <small>Personal workspace</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav className="sidebar-nav">
          {[
            { key: "overview", name: "Overview", icon: LayoutDashboard },
            { key: "repositories", name: "Repositories", icon: FolderGit2 },
            { key: "reviews", name: "Reviews", icon: GitPullRequest },
            { key: "settings", name: "Settings", icon: Settings2 },
          ].map((n) => (
            <button
              key={n.key}
              onClick={() => navigate(n.key)}
              className={tab === n.key ? "active" : ""}
            >
              <n.icon size={17} />
              {n.name}
              {n.key === "reviews" && scans.length > 0 && (
                <span>{scans.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ScanEye size={23} />
          <h4>A closer look, on autopilot.</h4>
          <p>Add Loupe to GitHub Actions for reviews on every pull request.</p>
          <Link href="/docs#github-action">
            Set up the Action <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link href="/docs">
            <BookOpen size={16} /> Documentation <ArrowUpRight size={12} />
          </Link>
          <a
            href="https://github.com/anshace/loupe"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> View source <ArrowUpRight size={12} />
          </a>
          <div className="sidebar-user">
            <span className="user-avatar">
              {user?.name?.slice(0, 2).toUpperCase() || "LP"}
            </span>
            <div>
              <b>{user?.name || "Welcome to Loupe"}</b>
              <small>{user?.email || "Make yourself at home"}</small>
            </div>
            {user ? (
              <button
                className="icon-button"
                onClick={logout}
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <Link href="/login">
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-overlay"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="icon-button dashboard-menu"
            onClick={() => setMobile(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <b>
              {selected
                ? "Review details"
                : tab[0].toUpperCase() + tab.slice(1)}
            </b>
          </div>
          <a
            href="https://github.com/anshace/loupe"
            target="_blank"
            rel="noreferrer"
            className="workspace-open-source"
          >
            <Github size={13} /> Built in the open <ArrowUpRight size={12} />
          </a>
          <Link href="/" className="icon-button" aria-label="Back to website">
            <ScanEye size={19} />
          </Link>
        </header>
        <main id="main" className="dashboard-content">
          {!user && (
            <div className="guest-banner">
              <LockKeyhole size={17} />
              <span>
                Your next great review starts here. Create an account to scan
                repositories and save findings.
              </span>
              <Link href="/signup">
                Create account <ArrowRight size={13} />
              </Link>
            </div>
          )}
          {error && !modal && (
            <div role="alert" className="error-message">
              {error} <button onClick={load}>Try again</button>
            </div>
          )}
          {selected ? (
            <>
              <div className="dashboard-heading">
                <div>
                  <button
                    className="back-link"
                    onClick={() => {
                      setSelected(null);
                      setQuery("");
                    }}
                  >
                    <ArrowLeft size={13} /> All reviews
                  </button>
                  <h1>{selected.repository}</h1>
                  <p>
                    Reviewed {new Date(selected.createdAt).toLocaleString()}{" "}
                    {selected.result?.pullNumber
                      ? ` · Pull request #${selected.result.pullNumber}`
                      : ""}
                  </p>
                </div>
                <div className="heading-actions">
                  <button
                    className="button button-white button-small"
                    onClick={() => download(selected)}
                  >
                    <Download size={14} /> Export
                  </button>
                  <button
                    className="button button-primary button-small"
                    onClick={() =>
                      newScan(
                        selected.repository +
                          (selected.result?.pullNumber
                            ? `/pull/${selected.result.pullNumber}`
                            : ""),
                      )
                    }
                  >
                    <RefreshCw size={14} /> Review again
                  </button>
                </div>
              </div>
              {selected.result ? (
                <>
                  <div className="report-summary">
                    <div className="report-summary-icon">
                      <ShieldCheck size={29} />
                    </div>
                    <div>
                      <h3>
                        {selected.result.findings.length
                          ? `${selected.result.findings.length} things worth a closer look`
                          : "No matching issues in the scanned scope"}
                      </h3>
                      <p>
                        {selected.result.filesScanned} files inspected ·{" "}
                        {(selected.result.duration / 1000).toFixed(1)}s ·{" "}
                        {selected.result.ai
                          ? "Static + AI review"
                          : "Static analysis"}
                      </p>
                    </div>
                    <a
                      href={`https://github.com/${selected.repository}/tree/${selected.result.sha}`}
                      target="_blank"
                      rel="noreferrer"
                      className="badge"
                    >
                      <GitBranch size={12} />
                      {selected.result.sha.slice(0, 7)}
                      <ArrowUpRight size={11} />
                    </a>
                  </div>
                  <details className="scan-coverage">
                    <summary>
                      <CircleAlert size={14} /> Scan coverage and limitations{" "}
                      <ChevronRight size={13} />
                    </summary>
                    <ul>
                      {selected.result.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </details>
                  <div className="list-toolbar">
                    <h3>
                      Findings <span>{selected.result.findings.length}</span>
                    </h3>
                    <div className="filter-actions">
                      <div className="search-field">
                        <Search size={14} />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search findings…"
                          aria-label="Search findings"
                        />
                      </div>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        aria-label="Filter severity"
                      >
                        <option value="all">All severities</option>
                        <option value="high">High priority</option>
                        <option value="medium">Medium priority</option>
                        <option value="low">Low priority</option>
                      </select>
                    </div>
                  </div>
                  <div className="findings-list">
                    {selectedFindings.length ? (
                      selectedFindings.map((f, i) => (
                        <article
                          className="finding-card"
                          key={`${f.file}-${f.line}-${i}`}
                        >
                          <div className="finding-top">
                            <span className={`badge ${f.severity}`}>
                              {f.severity === "high" ? (
                                <CircleAlert size={11} />
                              ) : (
                                <ShieldCheck size={11} />
                              )}{" "}
                              {f.severity} priority
                            </span>
                            <span className="finding-source">
                              {f.source === "ai" ? (
                                <Sparkles size={12} />
                              ) : (
                                <Code2 size={12} />
                              )}{" "}
                              {f.source === "ai" ? "AI review" : "Static check"}
                            </span>
                            <a
                              href={`https://github.com/${selected.repository}/blob/${selected.result!.sha}/${f.file.split("/").map(encodeURIComponent).join("/")}#L${f.line}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileCode2 size={12} />
                              {f.file}:{f.line}
                              <ArrowUpRight size={11} />
                            </a>
                          </div>
                          <h3>{f.title}</h3>
                          <p>{f.description}</p>
                        </article>
                      ))
                    ) : (
                      <div className="empty-state">
                        <CheckCheck size={38} />
                        <h3>
                          {query || severity !== "all"
                            ? "No matching findings"
                            : "A clearer picture."}
                        </h3>
                        <p>
                          {query || severity !== "all"
                            ? "Try another search or severity filter."
                            : "No matching issues were detected in the scanned files. This does not guarantee that the repository is free of vulnerabilities."}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="error-message">
                  {selected.error || "This review has not completed."}
                </div>
              )}
            </>
          ) : tab === "settings" ? (
            <>
              <div className="dashboard-heading">
                <div>
                  <span className="eyebrow">MAKE YOURSELF AT HOME.</span>
                  <h1>Workspace settings</h1>
                  <p>Your account, your tools, your control.</p>
                </div>
              </div>
              <section className="settings-panel">
                <div className="settings-title">
                  <LockKeyhole size={20} />
                  <div>
                    <h3>Your account</h3>
                    <p>
                      Account details are verified by your authentication
                      provider.
                    </p>
                  </div>
                </div>
                <div className="settings-row">
                  <span>Display name</span>
                  <b>{user?.name || "Not signed in"}</b>
                </div>
                <div className="settings-row">
                  <span>Email address</span>
                  <b>{user?.email || "Create an account to get started"}</b>
                </div>
                <div className="settings-row">
                  <span>Authentication</span>
                  <span className="badge">
                    {config.supabase
                      ? "Supabase Auth"
                      : "Database-backed authentication"}
                  </span>
                </div>
                {user && config.supabase && (
                  <Link className="text-link" href="/forgot-password">
                    Reset your password <ArrowRight size={13} />
                  </Link>
                )}
              </section>
              <section className="settings-panel">
                <div className="settings-title">
                  <Settings2 size={20} />
                  <div>
                    <h3>Your review engine</h3>
                    <p>
                      Server configuration is managed through environment
                      variables, never browser storage.
                    </p>
                  </div>
                </div>
                <div className="settings-row">
                  <span>Static analysis</span>
                  <span className="badge">
                    <Check size={11} /> Ready to review
                  </span>
                </div>
                <div className="settings-row">
                  <span>AI provider</span>
                  <span className={`badge ${config.ai ? "" : "medium"}`}>
                    {config.ai
                      ? `Configured · ${config.model}`
                      : "Not configured"}
                  </span>
                </div>
                <div className="settings-row">
                  <span>GitHub access</span>
                  <b>Public by default. Optional per-scan token.</b>
                </div>
                <div className="settings-row">
                  <span>Scan allowance</span>
                  <b>10 scans per account, per hour</b>
                </div>
                <Link href="/docs#environment" className="text-link">
                  Configure your deployment <ArrowUpRight size={13} />
                </Link>
              </section>
              <section className="settings-panel">
                <div className="settings-title">
                  <ShieldCheck size={20} />
                  <div>
                    <h3>Privacy by design</h3>
                    <p>
                      GitHub tokens are not saved. Raw source is not stored in
                      reports. AI review is always opt-in.
                    </p>
                  </div>
                </div>
                <Link href="/docs#privacy" className="text-link">
                  Read the privacy notes <ArrowUpRight size={13} />
                </Link>
              </section>
            </>
          ) : (
            <>
              <div className="dashboard-heading">
                <div>
                  <span className="eyebrow">
                    {tab === "overview"
                      ? "A LITTLE MORE CONFIDENCE."
                      : tab === "repositories"
                        ? "KNOW YOUR CODEBASE."
                        : "EVERY DETAIL COUNTS."}
                  </span>
                  <h1>
                    {tab === "overview"
                      ? `Let’s take a closer look${user ? `, ${user.name.split(" ")[0]}` : ""}.`
                      : tab === "repositories"
                        ? "Your repositories"
                        : "Review history"}
                  </h1>
                  <p>
                    {tab === "overview"
                      ? "A clear view of your code. A thoughtful second opinion."
                      : tab === "repositories"
                        ? "Every repository you’ve brought into focus."
                        : "Real findings, useful context, and a record of every scan."}
                  </p>
                </div>
                <button
                  className="button button-primary button-small"
                  onClick={() => newScan()}
                >
                  <Plus size={16} /> New review
                </button>
              </div>
              {tab === "overview" && (
                <>
                  <div className="dashboard-stats">
                    {[
                      {
                        label: "Repositories reviewed",
                        value: repos.length,
                        icon: FolderGit2,
                        sub: "Your code, in focus",
                      },
                      {
                        label: "Reviews completed",
                        value: completed.length,
                        icon: GitPullRequest,
                        sub: "A little more peace of mind",
                      },
                      {
                        label: "Findings to explore",
                        value: totalFindings,
                        icon: ShieldCheck,
                        sub: "Across completed reviews",
                      },
                    ].map((s) => (
                      <div key={s.label} className="stat-card">
                        <div>
                          <span>{s.label}</span>
                          <s.icon size={17} />
                        </div>
                        <strong>{s.value}</strong>
                        <small>{s.sub}</small>
                      </div>
                    ))}
                  </div>
                  <div className="workspace-hero">
                    <div>
                      <span className="workspace-hero-label">
                        <ScanEye size={15} /> YOUR NEXT FRESH PERSPECTIVE
                      </span>
                      <h2>
                        Good code deserves
                        <br />a second look.
                      </h2>
                      <p>
                        Paste a GitHub repository or pull request.
                        <br />
                        We’ll help you spot the details that matter.
                      </p>
                      <button
                        className="button button-dark button-small"
                        onClick={() => newScan()}
                      >
                        <Github size={15} /> Review a repository{" "}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="workspace-lens">
                      <div>
                        <ScanEye size={70} strokeWidth={1} />
                      </div>
                      <span>
                        <Check size={12} /> Context over comments.
                      </span>
                    </div>
                  </div>
                </>
              )}
              {tab === "repositories" ? (
                <>
                  <div className="list-toolbar">
                    <h3>
                      Repositories <span>{repos.length}</span>
                    </h3>
                    <div className="search-field">
                      <Search size={14} />
                      <input
                        aria-label="Search repositories"
                        placeholder="Find a repository…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  {loading ? (
                    <div className="skeleton" />
                  ) : repos.filter((r) =>
                      r.toLowerCase().includes(query.toLowerCase()),
                    ).length ? (
                    <div className="repository-grid">
                      {repos
                        .filter((r) =>
                          r.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((repo) => {
                          const latest = scans.find(
                            (s) => s.repository === repo,
                          )!;
                          return (
                            <article className="repository-card" key={repo}>
                              <span className="repo-card-icon">
                                <FolderGit2 size={22} />
                              </span>
                              <h3>{repo}</h3>
                              <p>
                                {latest.result?.description ||
                                  "Your repository, ready for a closer look."}
                              </p>
                              <div>
                                <span className="badge">
                                  {latest.result?.language || "Source code"}
                                </span>
                                <span>
                                  {
                                    scans.filter((s) => s.repository === repo)
                                      .length
                                  }{" "}
                                  reviews
                                </span>
                              </div>
                              <footer>
                                <button
                                  className="text-link"
                                  onClick={() => {
                                    setSelected(latest);
                                    setQuery("");
                                  }}
                                >
                                  Latest review <ArrowRight size={13} />
                                </button>
                                <button
                                  className="icon-button"
                                  onClick={() => newScan(repo)}
                                  aria-label={`Scan ${repo}`}
                                >
                                  <RefreshCw size={14} />
                                </button>
                              </footer>
                            </article>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FolderGit2 size={38} />
                      <h3>
                        {query
                          ? "No repositories found"
                          : "Meet your next repository."}
                      </h3>
                      <p>
                        {query
                          ? "Try a different search."
                          : "Run a real scan and your repository will appear here. No installation needed for public repositories."}
                      </p>
                      {!query && (
                        <button
                          className="button button-primary button-small"
                          onClick={() => newScan()}
                        >
                          Add your first repository <Plus size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="list-toolbar">
                    <h3>
                      {tab === "overview" ? "Recent reviews" : "All reviews"}{" "}
                      <span>{scans.length}</span>
                    </h3>
                    <div className="filter-actions">
                      <div className="search-field">
                        <Search size={14} />
                        <input
                          aria-label="Search reviews"
                          placeholder="Search repositories…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                      <button
                        className="icon-button"
                        onClick={load}
                        disabled={loading || !user}
                        aria-label="Refresh reviews"
                      >
                        <RefreshCw
                          size={15}
                          className={loading ? "loading-spinner" : ""}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="review-list">
                    {loading ? (
                      <>
                        <div className="skeleton" />
                        <div className="skeleton" />
                      </>
                    ) : filtered.length ? (
                      (tab === "overview"
                        ? filtered.slice(0, 5)
                        : filtered
                      ).map((s) => (
                        <div className="review-row" key={s.id}>
                          <span className="review-row-icon">
                            <GitPullRequest size={18} />
                          </span>
                          <button
                            onClick={() => {
                              setSelected(s);
                              setQuery("");
                              setSeverity("all");
                            }}
                            className="review-row-name"
                          >
                            <b>
                              {s.repository}
                              {s.result?.pullNumber && (
                                <small> #{s.result.pullNumber}</small>
                              )}
                            </b>
                            <span>
                              {s.result?.branch || "Repository review"} ·{" "}
                              {new Date(s.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </button>
                          <span
                            className={`badge ${s.status === "failed" ? "high" : ""}`}
                          >
                            {s.status === "completed" ? (
                              <Check size={11} />
                            ) : s.status === "failed" ? (
                              <CircleAlert size={11} />
                            ) : (
                              <Clock3 size={11} />
                            )}{" "}
                            {s.status}
                          </span>
                          <span className="review-finding-count">
                            {s.result
                              ? `${s.result.findings.length} findings`
                              : "None yet"}
                          </span>
                          <button
                            className="icon-button delete-review"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this saved review? This cannot be undone.",
                                )
                              )
                                remove(s.id);
                            }}
                            disabled={deleting === s.id}
                            aria-label={`Delete review of ${s.repository}`}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            className="icon-button"
                            onClick={() => {
                              setSelected(s);
                              setQuery("");
                            }}
                            aria-label={`Open review of ${s.repository}`}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <GitPullRequest size={35} />
                        <h3>
                          {query
                            ? "No matching reviews"
                            : "Your first review is a fresh start."}
                        </h3>
                        <p>
                          {query
                            ? "Try a different repository name."
                            : "No made-up metrics. No sample reviews. Just your code, ready for a closer look."}
                        </p>
                        {!query && (
                          <button
                            className="text-link"
                            onClick={() => newScan()}
                          >
                            Start your first review <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              {tab === "overview" && (
                <div className="workspace-footer-note">
                  <LockKeyhole size={13} /> GitHub tokens are never stored. You
                  decide when to enable AI review.
                  <Link href="/docs#privacy">
                    Learn more <ArrowUpRight size={11} />
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
        <footer className="dashboard-footer">
          <span>Made for the details.</span>
          <Link href="/docs">
            Need a hand? Read the docs <ArrowUpRight size={11} />
          </Link>
        </footer>
      </div>
      <dialog
        ref={dialog}
        className="scan-dialog"
        onCancel={(e) => {
          if (scanning) e.preventDefault();
          else setModal(false);
        }}
      >
        <div className="scan-dialog-header">
          <span className="auth-symbol">
            <ScanEye size={23} />
          </span>
          <button
            className="icon-button"
            disabled={scanning}
            aria-label="Close new review"
            onClick={() => setModal(false)}
          >
            <X size={19} />
          </button>
        </div>
        <h2>A closer look starts here.</h2>
        <p>Bring a repository. We’ll bring a fresh perspective.</p>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <form className="auth-form" onSubmit={scan}>
          <label>
            GitHub repository or pull request
            <input
              ref={input}
              required
              name="repository"
              placeholder="https://github.com/owner/repository"
              value={repoValue}
              onChange={(e) => setRepoValue(e.target.value)}
              maxLength={250}
              disabled={scanning}
            />
            <small>Use owner/repo, a repository URL, or a /pull/123 URL.</small>
          </label>
          <details className="private-repo-details">
            <summary>
              <LockKeyhole size={13} /> Private repository or GitHub rate
              limits?
              <ChevronRight size={12} />
            </summary>
            <label>
              Fine-grained GitHub token
              <input
                name="token"
                type="password"
                autoComplete="off"
                placeholder="github_pat_…"
                maxLength={255}
                disabled={scanning}
              />
              <small>
                Read-only contents access. Used once and never saved.
              </small>
            </label>
          </details>
          <label className="checkbox-label">
            <input
              name="ai"
              type="checkbox"
              disabled={!config.ai || scanning}
            />
            <span>
              <b>
                Add an AI second opinion {config.ai && <Sparkles size={12} />}
              </b>
              <small>
                {config.ai
                  ? "Send scanned source to your configured AI provider. Detected secrets are redacted."
                  : "Static checks are ready. Configure an AI provider in deployment settings to enable this."}
              </small>
            </span>
          </label>
          <div className="scan-scope-note">
            <ShieldCheck size={15} />
            <p>
              Repository scans inspect up to 18 source files, prioritizing
              sensitive paths. Reports show coverage and limitations. No
              repository code is executed.
            </p>
          </div>
          <button className="button button-primary" disabled={scanning}>
            {scanning ? (
              <>
                <LoaderCircle size={16} className="loading-spinner" /> Reading
                and reviewing your repository…
              </>
            ) : (
              <>
                {user ? "Start review" : "Create an account to review"}{" "}
                <ArrowRight size={15} />
              </>
            )}
          </button>
          {scanning && (
            <p className="scan-loading-note" role="status">
              Fetching source from GitHub and running checks. Keep this window
              open; your report will appear when complete.
            </p>
          )}
        </form>
      </dialog>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={16} />
          {toast}
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
