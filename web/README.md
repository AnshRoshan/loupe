# Loupe web workspace

A redesigned product website and working repository-review workspace around [anshace/loupe](https://github.com/anshace/loupe).

## What is included

- Responsive landing page, interactive example (explicitly labeled), authentication, documentation, workspace, settings, reports, and error/empty/loading states.
- Real GitHub repository and pull-request scanning. Commit-pinned reads, bounded parallel fetching, streamed response caps, 26-second GitHub read budget, 48-second overall budget.
- Original Loupe secret detection and diff parser, plus the engine's full per-language dangerous-sink rule pack (eval, child processes, deserialization, SQL concatenation, ReDoS, and more) and deterministic GitHub Actions supply-chain checks (unpinned actions, pull_request_target, script injection).
- Optional OpenAI-compatible web AI review: opt-in, detected-secret redaction, JSON schema validation, exact supplied-line validation, conservative failure handling.
- PostgreSQL persistence with Drizzle, owner-scoped access, RLS to block public Data API access, persistent atomic rate limits.
- Supabase email/password, confirmation, GitHub OAuth, recovery, callback and session refresh support when configured.
- Secure standalone email/password accounts when Supabase is absent: salted scrypt passwords, random hashed session tokens, HTTP-only secure cookies, server-side identity validation.
- Searchable report history, severity filtering, repository summaries, JSON exports, and saved-review deletion.
- Local fonts, security headers, keyboard-accessible native dialogs, focus states, responsive layout and reduced-motion support.
- Dark mode (OS preference + persisted toggle) generated from the same palette; dev-mode CSP allows React's eval-based debugging while production stays strict.

## Start locally

1. Install Node.js 22+ and use an existing PostgreSQL database (local or hosted).
2. `npm install`
3. Copy `.env.example` to `.env`, set `DATABASE_URL` and `APP_URL`.
4. `npx drizzle-kit push`
5. `npm run dev`

No Docker, Redis, background queue, local model, or always-on worker is required. A PostgreSQL database is required for the web workspace.

## Deploy without managing a server

Use Vercel for Next.js and Supabase for PostgreSQL and optional managed auth. Supabase alone does not host a Next.js application.

1. Create a Supabase project and obtain its transaction-pooler PostgreSQL URL.
2. Import this project into Vercel with the Next.js preset, at the project root.
3. Add `DATABASE_URL` and `APP_URL` to Vercel. Optionally configure Supabase Auth and the web AI provider using `.env.example`.
4. Run `npx drizzle-kit push` once against the deployment database from a trusted terminal/CI job.
5. Configure Supabase Site URL and redirect allowlist. Enable GitHub OAuth in Supabase if desired.
6. Redeploy after changing public environment variables. Test `/api/health`, create an account, and run a scan.

See the `/docs` page for complete setup, redirect URL examples, environment variables, limitations, and troubleshooting. Free-tier availability and usage limits depend on each external provider; this project cannot provision accounts or guarantee zero hosting/provider costs.

## Original project

This web workspace lives at `web/` inside the main Loupe monorepo and imports the
SHARED engine directly (`../../packages/engine/src` — the same zero-dependency
library the GitHub Action and Workers adapters run). This web adapter does **not**
run the full original Action review/verifier/publisher pipeline. Automated inline
PR reviews continue to use the original GitHub Action, documented on
`/docs#github-action` and in the repository README.

For Action-only use, you do not need to deploy this website. Add the workflow shown in the docs to the target repository and configure your provider secret in GitHub.

## Validation

- `npx vitest run tests/scanner.test.ts` (web scanner) + the engine suite from the repo root (`nub run test`)
- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`
- `npx playwright test` (requires running production preview and `npx playwright install chromium`)

Full original engine suite: 743 tests in 51 files. Additional scanner tests validate parsing, unsafe inputs, secret non-disclosure, and static evidence. Browser/API tests cover navigation, real authentication and access isolation.

## Honest boundaries

- This is a bounded scanner, not a complete security audit. Repository scans inspect up to 18 eligible source files; PR scans cover added lines in up to 40 diff files. Detailed limits are in each report.
- Static findings require human review. AI findings are location-validated, not independently verified by the Action's full verifier.
- AI output quality, OAuth delivery, SMTP, private GitHub authorization and third-party quotas depend on configured external services. Without credentials those live integrations cannot be fully exercised.
- Standalone mode does not send recovery emails or support OAuth. Configure Supabase for those features.
- The web app does not post GitHub comments or automatically alter repositories. Use the original Action for inline reviews.
- Web requests are synchronous. Scans interrupted by a hosting timeout become failed on history reload after two minutes; no external queue/worker is required.
- There is no billing, team membership, GitHub App webhook installation, self-service account deletion, or continuous background scanning in this workspace.
- Production operators must configure backups, SMTP, access policies, retention and legal/privacy notices suitable for their deployment.

## Security notes

GitHub tokens are transient and never stored. Source is not saved in report rows. AI source sharing is explicitly opt-in and automated redaction is not exhaustive. The database uses RLS with no public policies; the server connects with a privileged database role and enforces owner-scoped access. Do not expose that connection string or a Supabase service-role key to clients.

The Next.js framework was updated from the starter version to address known advisories. Run `npm audit` regularly; development-tool transitive advisories may still require upstream fixes.
