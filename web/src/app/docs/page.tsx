import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Github,
  LockKeyhole,
  Rocket,
  ScanEye,
  Settings2,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { workflow } from "@/lib/workflow";
export const metadata = { title: "Documentation" };
const variables = [
  [
    "DATABASE_URL",
    "Required. PostgreSQL connection string. For Supabase on Vercel, use the transaction pooler on port 6543.",
  ],
  [
    "APP_URL",
    "Your full deployed URL, for example https://your-loupe.vercel.app. Used for authentication redirects.",
  ],
  [
    "NEXT_PUBLIC_SUPABASE_URL",
    "Optional. Your Supabase project URL. Configure with a public key to enable Supabase Auth.",
  ],
  [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "Optional. Supabase public/publishable key. The legacy NEXT_PUBLIC_SUPABASE_ANON_KEY is also supported. Never put a service-role key here.",
  ],
  [
    "OPENAI_API_KEY or LLM_API_KEY",
    "Optional. Server-only key for the web scanner’s AI provider. Without it, static scans still work.",
  ],
  [
    "LLM_BASE_URL",
    "Optional. OpenAI-compatible HTTPS endpoint, including /v1 when required. Defaults to https://api.openai.com/v1.",
  ],
  [
    "LLM_MODEL",
    "Optional. Chat-completions model with JSON mode support. Defaults to gpt-4o-mini.",
  ],
];
export default function Docs() {
  return (
    <>
      <SiteNav />
      <main id="main" className="container docs-layout">
        <aside className="docs-nav">
          <span>THE LOUPE HANDBOOK</span>
          {[
            { id: "getting-started", label: "Getting started", icon: BookOpen },
            { id: "github-action", label: "GitHub Action", icon: Github },
            { id: "web-scanning", label: "Repository scanning", icon: ScanEye },
            { id: "deployment", label: "Deploy your workspace", icon: Rocket },
            {
              id: "environment",
              label: "Environment variables",
              icon: Settings2,
            },
            {
              id: "authentication",
              label: "Authentication",
              icon: LockKeyhole,
            },
            { id: "privacy", label: "Privacy & security", icon: ShieldCheck },
            { id: "troubleshooting", label: "Troubleshooting", icon: Terminal },
          ].map((x) => (
            <a key={x.id} href={`#${x.id}`}>
              <x.icon size={13} />
              {x.label}
            </a>
          ))}
        </aside>
        <article className="docs-content">
          <header>
            <span className="eyebrow">LET’S GET YOU A CLEARER PICTURE.</span>
            <h1>
              A small setup.
              <br />A thoughtful second opinion.
            </h1>
            <p>
              Everything you need to review your code with Loupe, from your
              first repository scan to automated pull-request reviews.
            </p>
          </header>
          <section id="getting-started">
            <h2>Two ways to take a closer look.</h2>
            <p>
              Loupe’s original engine is preserved in{" "}
              <code>upstream/loupe</code>. This project adds a Next.js workspace
              and a bounded serverless scanner using the engine’s secret
              detector and diff parser. The web scanner is not a replacement for
              the full contextual Action pipeline.
            </p>
            <div className="docs-cards">
              <div className="docs-card">
                <Github size={24} />
                <h3>Automated PR reviews</h3>
                <p>
                  The original GitHub Action reviews pull requests and posts
                  inline comments. No web server, Docker, or database needed.
                </p>
                <a
                  className="button button-white button-small"
                  href="#github-action"
                >
                  Set up the Action <ArrowUpRight size={12} />
                </a>
              </div>
              <div className="docs-card">
                <ScanEye size={24} />
                <h3>Your web workspace</h3>
                <p>
                  Run on-demand source scans, explore findings, and keep a
                  private history. Hosted with Next.js and PostgreSQL.
                </p>
                <Link
                  className="button button-white button-small"
                  href="/dashboard"
                >
                  Open your workspace <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </section>
          <section id="github-action">
            <h2>Reviews where you already work.</h2>
            <p>
              Add this file to <code>.github/workflows/loupe.yml</code> in the
              repository you want reviewed. Add your AI provider key to GitHub
              Actions secrets as <code>LLM_API_KEY</code>.
            </p>
            <pre>
              <code>{workflow}</code>
            </pre>
            <p>
              The Action supports OpenAI-compatible endpoints, Anthropic, and
              Gemini. Provider configuration, custom house rules, incremental
              review, and inline suggestions are documented in the{" "}
              <a
                href="https://github.com/anshace/loupe"
                target="_blank"
                rel="noreferrer"
              >
                original repository
              </a>
              . For production supply-chain control, replace the version tag
              with a reviewed commit SHA.
            </p>
            <div className="info-message">
              Do not use pull_request_target to review arbitrary untrusted code
              with write credentials. Fork pull requests do not receive
              repository secrets by default; skipped or restricted reviews are
              expected in that case.
            </div>
          </section>
          <section id="web-scanning">
            <h2>A real look at your repository.</h2>
            <ol>
              <li>
                Create an account, then choose <strong>New review</strong> in
                your workspace.
              </li>
              <li>
                Paste <code>owner/repo</code>, a GitHub repository URL, or a
                full pull-request URL.
              </li>
              <li>
                For private repositories, add a fine-grained token with contents
                read access and pull-request read access when scanning PRs.
                Tokens are never persisted.
              </li>
              <li>
                Optionally enable AI review. Source is sent to the configured
                provider, after detected secrets are redacted.
              </li>
              <li>
                Open the saved report, filter findings by severity, follow
                commit-pinned source links, or export the report as JSON.
              </li>
            </ol>
            <h3>Know the scope</h3>
            <p>
              Repository scans inspect up to 18 eligible source files,
              prioritizing auth, security, API, server, and workflow paths.
              Files over 80 KB, binary files, generated directories, lockfiles,
              and fixtures are skipped. Each selected file is limited to 1,500
              lines. PR scans cover added lines in up to 40 files from the
              GitHub diff. The report discloses excluded scope and read
              failures.
            </p>
            <p>
              Static findings are pattern-based review prompts, not proven
              exploits. Web AI findings are schema-validated and checked against
              supplied file/line locations, but do not run the Action’s full
              multi-stage verifier. No result is a guarantee of security. Human
              review, tests, and specialist tooling remain essential.
            </p>
          </section>
          <section id="deployment">
            <h2>No container. No always-on server.</h2>
            <p>
              The recommended web deployment is{" "}
              <strong>Vercel + Supabase</strong>. Supabase provides PostgreSQL
              and optional managed authentication; it does not host the Next.js
              frontend by itself. Both services offer entry-level plans, subject
              to their current limits.
            </p>
            <ol>
              <li>
                Create a Supabase project. Copy the transaction pooler
                connection string from its Connect dialog. Use the real database
                password in <code>DATABASE_URL</code>.
              </li>
              <li>
                Push this project to your GitHub account and import it into
                Vercel. Select the Next.js preset and the project root, not{" "}
                <code>upstream/loupe</code>.
              </li>
              <li>
                Add the environment variables below in Vercel. Set{" "}
                <code>APP_URL</code> to your deployed domain. Add Supabase
                public keys if you want managed auth.
              </li>
              <li>
                Apply the schema once using a trusted local or CI terminal:{" "}
                <code>npx drizzle-kit push</code>. This requires the same{" "}
                <code>DATABASE_URL</code>. Do not expose schema management
                publicly.
              </li>
              <li>
                Configure Supabase authentication URLs as described below, then
                redeploy after changing public environment variables.
              </li>
              <li>
                Visit <code>/api/health</code>, create an account, and test a
                public-repository scan before sharing the deployment.
              </li>
            </ol>
            <p>
              Requests run synchronously with a 60-second serverless duration
              setting. Hosting plan limits still apply. Larger repositories
              should be reviewed using a targeted pull-request scan or the
              original GitHub Action. Interrupted web scans are marked failed
              when history is loaded again after two minutes.
            </p>
            <h3>Local development</h3>
            <pre>
              <code>
                {
                  "npm install\n# Copy .env.example to .env and set DATABASE_URL\nnpx drizzle-kit push\nnpm run dev"
                }
              </code>
            </pre>
            <p>
              A PostgreSQL database is required for accounts, rate limits, and
              saved reviews. No Redis, queue, Docker image, or local AI runtime
              is required.
            </p>
          </section>
          <section id="environment">
            <h2>Configuration, without guesswork.</h2>
            <p>
              Use the included <code>.env.example</code>. Keep secrets on the
              server and never commit <code>.env</code> files.
            </p>
            <table className="env-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {variables.map(([name, description]) => (
                  <tr key={name}>
                    <td>
                      <code>{name}</code>
                    </td>
                    <td>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section id="authentication">
            <h2>A workspace that stays yours.</h2>
            <h3>Supabase authentication</h3>
            <p>
              Set the Supabase URL and publishable key together. Enable Email in
              Supabase Auth, then set the Site URL to your deployed{" "}
              <code>APP_URL</code>. Allow{" "}
              <code>https://your-domain/auth/callback</code> and{" "}
              <code>
                https://your-domain/auth/callback?next=/reset-password
              </code>{" "}
              in Redirect URLs, plus localhost equivalents during development.
            </p>
            <p>
              For GitHub sign-in, create a GitHub OAuth app with Supabase’s
              callback URL,{" "}
              <code>https://PROJECT.supabase.co/auth/v1/callback</code>. Put the
              OAuth client ID and secret in Supabase’s GitHub provider settings.
              Loupe never needs your OAuth client secret in the browser.
            </p>
            <p>
              Confirmation emails, password recovery, GitHub OAuth, session
              refresh, and authenticated password updates are supported. For
              production email delivery, configure your own SMTP provider in
              Supabase and verify its sending limits.
            </p>
            <h3>Standalone authentication</h3>
            <p>
              If Supabase is not configured, email/password registration and
              sign-in work directly with PostgreSQL. Passwords use salted scrypt
              hashes. Sessions use random, hashed, HTTP-only cookies with a
              seven-day lifetime. Recovery email and GitHub OAuth require
              Supabase; these options return a clear configuration message
              rather than pretending to work.
            </p>
          </section>
          <section id="privacy">
            <h2>Your code, your control.</h2>
            <ul>
              <li>
                <strong>Stored:</strong> account details, hashed standalone
                passwords and sessions, scan metadata, findings, coverage
                warnings, and rate-limit counters. No raw repository files or
                submitted GitHub tokens are saved in scan records.
              </li>
              <li>
                <strong>GitHub:</strong> all repository reads use the fixed
                GitHub API host. Private access uses only the token supplied for
                that scan. There is no shared server token that could expose
                someone else’s repositories.
              </li>
              <li>
                <strong>AI:</strong> disabled by default for each scan. When
                selected, source snippets are sent to your server-configured
                model provider. Detected credentials are redacted, but automated
                secret detection is not exhaustive. Check the provider’s data
                handling policy.
              </li>
              <li>
                <strong>Isolation:</strong> server-verified user identity scopes
                every saved-review read and delete. Database tables have
                row-level security enabled to block public Data API access; the
                server uses the privileged database connection.
              </li>
              <li>
                <strong>Deletion:</strong> delete individual reports from the
                review list. Account removal and complete data erasure are
                administrator-operated using your hosting/database provider.
                There is no self-service account-deletion workflow yet.
              </li>
              <li>
                <strong>Safety:</strong> no repository code is executed. No
                automatic code changes or GitHub comments are posted by the web
                scanner. Reports are escaped text, not rendered untrusted HTML.
              </li>
            </ul>
            <p>
              There are no third-party analytics or advertising scripts in this
              app. A self-hosted font is used for the interface. Operators are
              responsible for their deployment’s legal policies, backups, access
              controls, and retention requirements.
            </p>
          </section>
          <section id="troubleshooting">
            <h2>When something needs another look.</h2>
            <h3>GitHub says “not found”</h3>
            <p>
              Check the repository URL. Private repositories also return 404
              without an authorized token. Verify that your fine-grained token
              is approved for that repository and has the required read
              permissions.
            </p>
            <h3>Rate limit reached</h3>
            <p>
              GitHub permits fewer requests without a token. Use your own token
              or wait for GitHub’s limit to reset. Loupe also allows 10 scans
              per account per hour and throttles authentication attempts in the
              database.
            </p>
            <h3>No findings</h3>
            <p>
              Read the coverage disclosure. A zero-finding report means no
              configured check matched within the inspected scope, not that
              every file was audited. Empty repositories and unreadable files
              are reported explicitly.
            </p>
            <h3>AI review unavailable</h3>
            <p>
              Check the server’s API key, HTTPS base URL, and model. Use an
              OpenAI-compatible model with JSON mode. Provider failures preserve
              static results with a warning. Anthropic and Gemini protocols are
              supported by the original Action, not by this web adapter.
            </p>
            <h3>Deployment will not connect to PostgreSQL</h3>
            <p>
              Use Supabase’s transaction pooler rather than an IPv6-only direct
              connection if your host requires IPv4. Check the database password
              and SSL connection options. Apply the schema before serving user
              traffic.
            </p>
          </section>
          <footer className="docs-footer">
            Keep exploring.{" "}
            <a
              href="https://github.com/anshace/loupe"
              target="_blank"
              rel="noreferrer"
            >
              Read the source <ArrowUpRight size={12} />
            </a>
          </footer>
        </article>
      </main>
    </>
  );
}
