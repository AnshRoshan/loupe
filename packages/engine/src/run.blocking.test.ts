/**
 * Integration test for the blocking vs advisory tier: with
 * `blockingSeverities` configured, a run whose published findings meet the
 * floor submits its batched review as REQUEST_CHANGES; otherwise COMMENT.
 */
import { describe, expect, it } from "vitest";
import type { ExistingComments } from "./dedupe";
import type { FetchLike } from "./diff";
import { MockProvider } from "./model";
import { runReview } from "./run";
import type { RunDeps } from "./run";
import type { AuthToken, EngineConfig, PrIdentity, ReviewPayload } from "./types";

const pr = { owner: "anshace", repo: "demo", prNumber: 9 };
const NO_COMMENTS: ExistingComments = { reviewComments: [], issueComments: [] };

function diffFetch(diff: string): FetchLike {
  return async () => ({ ok: true, status: 200, text: async () => diff });
}

function newFileDiff(path: string, lines: readonly string[]): string {
  return [
    `diff --git a/${path} b/${path}`,
    "new file mode 100644",
    "index 0000000..2222222 100644",
    "--- /dev/null",
    `+++ b/${path}`,
    `@@ -0,0 +1,${lines.length} @@`,
    lines.map((l) => `+${l}`).join("\n"),
  ].join("\n");
}

function deps(): RunDeps {
  return {
    post: async (_pr: PrIdentity, _auth: AuthToken, _payload: ReviewPayload) => {},
    upsertSummary: async (_pr, _auth, _body) => {},
    repoFiles: {},
    existingComments: NO_COMMENTS,
    headFiles: {},
  };
}

const base: EngineConfig = { event: { headSha: "abc123" }, minSeverity: "low", escalation: false };

const DIFF = newFileDiff("src/app.ts", ["const x = 1;", "throw new Error('boom');"]);
const FINDINGS = JSON.stringify([
  {
    severity: "high",
    category: "bug",
    file: "src/app.ts",
    line: 1,
    title: "Unused variable",
    body: "x is assigned but never used.",
  },
]);

describe("runReview — blocking tier", () => {
  it("submits REQUEST_CHANGES when a published finding meets the floor", async () => {
    const result = await runReview(pr, "tok", { ...base, blockingSeverities: ["high"] }, {
      ...deps(),
      fetchImpl: diffFetch(DIFF),
      model: new MockProvider(FINDINGS),
    });
    expect(result.payload.event).toBe("REQUEST_CHANGES");
  });

  it("stays COMMENT when no finding meets the floor", async () => {
    const low = FINDINGS.replace('"high"', '"nit"');
    const result = await runReview(pr, "tok", { ...base, blockingSeverities: ["high"] }, {
      ...deps(),
      fetchImpl: diffFetch(DIFF),
      model: new MockProvider(low),
    });
    expect(result.payload.event).toBe("COMMENT");
  });

  it("defaults to COMMENT when blockingSeverities is unset", async () => {
    const result = await runReview(pr, "tok", base, {
      ...deps(),
      fetchImpl: diffFetch(DIFF),
      model: new MockProvider(FINDINGS),
    });
    expect(result.payload.event).toBe("COMMENT");
  });
});
