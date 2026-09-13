"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  Code2,
  Copy,
  FileCode2,
  GitBranch,
  Github,
  GitPullRequest,
  Layers3,
  LockKeyhole,
  ScanEye,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { SiteNav } from "./site-nav";
import { Brand } from "./brand";
import { ReviewPreview } from "./review-preview";
import { workflow } from "@/lib/workflow";
const faqs = [
  [
    "What does Loupe actually review?",
    "The GitHub Action reviews pull-request diffs with the original Loupe engine, including contextual AI review, verification, and inline comments. The web workspace offers on-demand, bounded repository and PR scans, with static security checks and optional AI findings. Every web report shows exactly how much was scanned.",
  ],
  [
    "Do I need to run a server?",
    "Not for automated pull-request reviews. The Loupe GitHub Action runs directly in your repository’s workflows. To host this website and workspace, deploy the Next.js app to Vercel and connect a Supabase PostgreSQL database. No Docker or always-on worker is required for web scans.",
  ],
  [
    "Can I use my own AI model?",
    "Yes. The original Action supports OpenAI-compatible providers, Anthropic, and Gemini. The web scanner supports an OpenAI-compatible HTTPS endpoint configured with LLM_BASE_URL, LLM_MODEL, and LLM_API_KEY. Static web checks also work without any AI key.",
  ],
  [
    "Can Loupe scan private repositories?",
    "Yes, in the web workspace you can supply your own fine-grained GitHub token with read-only contents access to the selected repository. Tokens are used only for that request and are not saved. AI review is opt-in because source code is sent to your configured provider.",
  ],
  [
    "Is it really free and open source?",
    "Loupe’s source is available on GitHub. There is no Loupe subscription in this app. Your hosting, GitHub Actions usage, database, and chosen AI provider may have their own limits or costs. Review their free-tier terms before deploying.",
  ],
];
export function Landing() {
  const [faq, setFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <a
                href="https://github.com/anshace/loupe"
                target="_blank"
                rel="noreferrer"
                className="hero-eyebrow"
              >
                <span className="eyebrow-icon">
                  <ScanEye size={13} />
                </span>{" "}
                OPEN SOURCE. A SHARPER PERSPECTIVE. <ArrowUpRight size={13} />
              </a>
              <h1>
                Great code deserves
                <br />a second <span>look.</span>
                <span className="headline-star">✳</span>
              </h1>
              <p className="hero-description">
                Your thoughtful AI code reviewer. Catch bugs, understand the
                context, and merge with confidence.
                <br className="desktop-break" /> Less noise. Better code.
              </p>
              <div className="hero-buttons">
                <Link href="/signup" className="button button-primary">
                  <Github size={18} /> Start reviewing for free{" "}
                  <ArrowUpRight size={16} />
                </Link>
                <a href="#how-it-works" className="button button-white">
                  See how it works <ArrowRight size={16} />
                </a>
              </div>
              <div className="hero-notes">
                <span>
                  <Check size={13} /> Your code, your control
                </span>
                <span>
                  <Check size={13} /> No credit card required
                </span>
              </div>
              <div className="hero-credit">
                <div className="mini-avatars">
                  <span>AR</span>
                  <span>JS</span>
                  <span>
                    <Code2 size={16} />
                  </span>
                </div>
                <div>
                  Built by a developer.
                  <br />
                  <b>For the way developers work.</b>
                </div>
              </div>
            </div>
            <ReviewPreview />
          </div>
        </section>
        <section className="integrations-strip">
          <div className="container">
            <p>FITS RIGHT INTO YOUR STACK. STAYS OUT OF YOUR WAY.</p>
            <div className="integration-logos">
              <span>
                <Github />
                GitHub
              </span>
              <span className="openai-word">
                <Sparkles />
                OpenAI
              </span>
              <span className="anthropic-word">ANTHROPIC</span>
              <span className="gemini-word">
                <Sparkles />
                Gemini
              </span>
              <span>
                <Zap className="supabase-logo" />
                supabase
              </span>
              <span className="actions-word">
                <GitPullRequest />
                GitHub Actions
              </span>
            </div>
          </div>
        </section>
        <section id="features" className="features-section section-pad">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">A CLOSER LOOK. A BETTER REVIEW.</span>
              <h2>
                More signal.
                <br />
                <span>Way less noise.</span>
              </h2>
              <p>
                Not another bot in your comments. A careful reviewer
                <br className="desktop-break" /> that helps you focus on what
                actually matters.
              </p>
            </div>
            <div className="feature-grid">
              <article className="feature-card context-card">
                <span className="feature-icon">
                  <Layers3 size={21} />
                </span>
                <h3>
                  The whole picture.
                  <br />
                  Not just the diff.
                </h3>
                <p>
                  The Action follows context across your codebase to understand
                  what changed, and why it matters.
                </p>
                <div className="file-tree">
                  <div className="tree-root">
                    <Github size={15} /> your-repository{" "}
                    <span>
                      main <GitBranch size={12} />
                    </span>
                  </div>
                  <div className="tree-branch">
                    <span>
                      <FileCode2 size={14} /> src/api/users.ts
                    </span>
                    <b>changed</b>
                  </div>
                  <div className="tree-branch active">
                    <span>
                      <ScanEye size={14} /> src/lib/auth.ts
                    </span>
                    <b>context</b>
                  </div>
                  <div className="tree-branch">
                    <span>
                      <FileCode2 size={14} /> tests/users.test.ts
                    </span>
                    <Check size={13} />
                  </div>
                  <div className="tree-insight">
                    <Sparkles size={13} /> Connected context. Better
                    suggestions.
                  </div>
                </div>
              </article>
              <article className="feature-card security-card">
                <span className="feature-icon">
                  <ShieldCheck size={21} />
                </span>
                <h3>
                  Find the bugs.
                  <br />
                  Before your users do.
                </h3>
                <p>
                  Spot exposed credentials, risky patterns, and actionable
                  issues before they reach production.
                </p>
                <div className="security-visual">
                  <div className="shield-orbit">
                    <ShieldCheck size={49} strokeWidth={1.4} />
                  </div>
                  <span className="security-tag tag-one">
                    <Check size={12} /> Secret detection
                  </span>
                  <span className="security-tag tag-two">
                    <Check size={12} /> Security checks
                  </span>
                  <span className="security-tag tag-three">
                    <Check size={12} /> Safer changes
                  </span>
                </div>
              </article>
              <article className="feature-card control-card">
                <span className="feature-icon">
                  <Settings2 size={21} />
                </span>
                <h3>
                  Your workflow.
                  <br />
                  Your rules.
                </h3>
                <p>
                  Bring your model. Set your standards. Keep the final say.
                  Loupe meets your team where it is.
                </p>
                <div className="config-visual">
                  <div>
                    <span />
                    <span />
                    <span />
                    <code>.aireview.toml</code>
                  </div>
                  <pre>
                    <span># A review that feels like your team</span>
                    {"\n"}min_severity <i>=</i> <b>"medium"</b>
                    {"\n"}ignore <i>=</i> [<b>"dist/**"</b>]{"\n"}
                    {"\n"}
                    <span># Keep sensitive values private</span>
                    {"\n"}secret_allow_paths <i>=</i> []
                  </pre>
                </div>
              </article>
              <article className="feature-wide">
                <div>
                  <span className="feature-icon">
                    <LockKeyhole size={20} />
                  </span>
                  <h3>Your code isn’t our business model.</h3>
                  <p>
                    Open source. Your own API keys. No mystery infrastructure.
                    <br />
                    Built for people who like to know what’s under the hood.
                  </p>
                  <Link href="/docs#privacy" className="text-link">
                    A look at privacy <ArrowUpRight size={15} />
                  </Link>
                </div>
                <div className="privacy-flow">
                  <span>
                    <Github size={28} />
                    <b>Your repo</b>
                  </span>
                  <i />
                  <span className="flow-loupe">
                    <ScanEye size={30} />
                    <b>Loupe</b>
                  </span>
                  <i />
                  <span>
                    <Sparkles size={28} />
                    <b>Your model</b>
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="workflow-section section-pad">
          <div className="container workflow-grid">
            <div>
              <span className="eyebrow">SMALL SETUP. BIG PEACE OF MIND.</span>
              <h2>
                From pull request
                <br />
                to a clearer picture.
              </h2>
              <p className="section-description">
                No new habits. No extra tabs.
                <br />A better review, right where you already work.
              </p>
              <div className="steps">
                <div>
                  <span>
                    <Github size={19} />
                  </span>
                  <section>
                    <h4>Connect your repository</h4>
                    <p>
                      Scan a repository in the workspace, or add the Action to
                      your GitHub workflow.
                    </p>
                  </section>
                </div>
                <div>
                  <span>
                    <Settings2 size={19} />
                  </span>
                  <section>
                    <h4>Make it yours</h4>
                    <p>
                      Choose a model and add your API key as a repository
                      secret. Your keys stay yours.
                    </p>
                  </section>
                </div>
                <div>
                  <span>
                    <GitPullRequest size={19} />
                  </span>
                  <section>
                    <h4>Open a PR. Get a thoughtful review.</h4>
                    <p>
                      Useful context, inline findings, and practical
                      suggestions. You decide what to merge.
                    </p>
                  </section>
                </div>
              </div>
              <Link href="/docs" className="text-link">
                Read the setup guide <ArrowRight size={15} />
              </Link>
            </div>
            <div className="workflow-code">
              <div className="workflow-code-header">
                <span>
                  <Terminal size={16} /> .github/workflows/loupe.yml
                </span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(workflow);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      setCopied(false);
                    }
                  }}
                  aria-label="Copy GitHub Action workflow"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre>
                {workflow.split("\n").map((line, i) => (
                  <div key={i}>
                    <span className="code-ln">{i + 1}</span>
                    <code
                      className={
                        line.includes("anshace") ? "code-highlight" : ""
                      }
                    >
                      {line}
                    </code>
                  </div>
                ))}
              </pre>
              <div className="workflow-code-footer">
                <CheckCheck size={15} /> Runs on GitHub Actions. No server
                required.
              </div>
            </div>
          </div>
        </section>
        <section className="faq-section section-pad">
          <div className="container faq-grid">
            <div>
              <span className="eyebrow">GOOD QUESTIONS.</span>
              <h2>
                A little more
                <br />
                clarity.
              </h2>
              <p>Still curious? It’s all out in the open.</p>
              <a
                href="https://github.com/anshace/loupe/discussions"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Join the conversation <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="faq-list">
              {faqs.map(([q, a], i) => (
                <div
                  className={`faq-item ${faq === i ? "expanded" : ""}`}
                  key={q}
                >
                  <button
                    onClick={() => setFaq(faq === i ? null : i)}
                    aria-expanded={faq === i}
                  >
                    {q}
                    <ChevronDown size={17} />
                  </button>
                  {faq === i && <p>{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bottom-cta">
          <div className="container">
            <ScanEye size={38} strokeWidth={1.6} />
            <h2>
              Give your next PR
              <br />a fresh pair of eyes.
            </h2>
            <p>Good code is a team effort. Let Loupe take a look.</p>
            <Link href="/signup" className="button button-primary">
              <Github size={18} /> Start reviewing for free{" "}
              <ArrowUpRight size={16} />
            </Link>
            <span className="cta-note">
              Open source. Thoughtfully built. Yours to explore.
            </span>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-main">
          <div>
            <Brand />
            <p>A closer look. Better code.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/#features">Product</Link>
            <Link href="/docs">Documentation</Link>
            <a
              href="https://github.com/anshace/loupe"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowUpRight size={12} />
            </a>
            <Link href="/docs#privacy">Privacy</Link>
          </nav>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} Loupe. Built with care, by Ansh Roshan.
          </span>
          <span>
            Made for the details. <ScanEye size={13} />
          </span>
        </div>
      </footer>
    </>
  );
}
