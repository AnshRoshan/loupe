import { describe, it, expect } from "vitest";
import { parseRepository, inspectSource, sinkFindings } from "../src/lib/scanner";
describe("repository input validation", () => {
  it("accepts repository slugs and canonical URLs", () => {
    expect(parseRepository("anshace/loupe")).toEqual({
      repository: "anshace/loupe",
      pullNumber: undefined,
    });
    expect(parseRepository("https://github.com/anshace/loupe.git")).toEqual({
      repository: "anshace/loupe",
      pullNumber: undefined,
    });
  });
  it("accepts a pull-request URL", () => {
    expect(parseRepository("https://github.com/anshace/loupe/pull/42")).toEqual(
      { repository: "anshace/loupe", pullNumber: 42 },
    );
  });
  it.each([
    "https://evil.com/a/b",
    "http://169.254.169.254/latest",
    "https://github.com/a/../b",
    "a/..",
    "a/.",
    "owner/repo?token=x",
    "https://github.com@evil.com/a/b",
    "owner/repo/pull/0",
    "owner/repo/issues/1",
    "",
  ])("rejects unsafe or unsupported input: %s", (value) => {
    expect(() => parseRepository(value)).toThrow();
  });
});
describe("static source analysis", () => {
  it("finds named secrets without putting values in reports", () => {
    const secret = "ghp_" + "0123456789abcdefghijklmnopqrstuvwxyz";
    const findings = inspectSource({
      path: "src/config.ts",
      lines: [{ number: 7, text: `const token = "${secret}";` }],
    });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].line).toBe(7);
    expect(JSON.stringify(findings)).not.toContain(secret);
  });
  it("ignores environment lookups and obvious placeholders", () => {
    expect(
      inspectSource({
        path: "src/config.ts",
        lines: [
          { number: 1, text: "const apiKey = process.env.API_KEY;" },
          { number: 2, text: 'const password = "your_password_here";' },
        ],
      }),
    ).toEqual([]);
  });
  it("reports TLS bypass and dynamic execution", () => {
    const findings = inspectSource({
      path: "src/api.ts",
      lines: [
        { number: 1, text: "eval(req.body.code)" },
        { number: 2, text: "const options = { rejectUnauthorized: false };" },
      ],
    });
    expect(findings.map((f) => f.title)).toContain("Dynamic code execution");
    expect(findings.map((f) => f.title)).toContain(
      "TLS verification is disabled",
    );
  });
  it("does not flag commented-out execution examples", () => {
    expect(
      inspectSource({
        path: "src/api.ts",
        lines: [{ number: 1, text: "// eval(req.body.code)" }],
      }),
    ).toEqual([]);
  });
  it("keeps file and line evidence intact", () => {
    const [finding] = inspectSource({
      path: "src/components/page.tsx",
      lines: [{ number: 95, text: "element.innerHTML = value" }],
    });
    expect(finding).toMatchObject({
      file: "src/components/page.tsx",
      line: 95,
      severity: "medium",
      source: "static",
    });
  });
});

describe("repository input normalization (back-end hardening)", () => {
  it("strips .git before a pull-request path", () => {
    expect(parseRepository("https://github.com/anshace/loupe.git/pull/7")).toEqual(
      { repository: "anshace/loupe", pullNumber: 7 },
    );
  });
  it("tolerates a trailing slash after the pull number", () => {
    expect(parseRepository("https://github.com/anshace/loupe/pull/7/")).toEqual(
      { repository: "anshace/loupe", pullNumber: 7 },
    );
  });
  it("keeps rejecting path traversal inside the repo segment", () => {
    expect(() => parseRepository("a/../b")).toThrow();
  });
});

describe("engine sink rule pack (deterministic, per-language)", () => {
  it("flags Python deserialization sinks at high severity", () => {
    const findings = sinkFindings([
      {
        path: "jobs/loader.py",
        lines: [
          { number: 3, text: "data = pickle.loads(blob)" },
          { number: 4, text: "cfg = yaml.load(blob)" },
        ],
      },
    ]);
    expect(findings.map((f) => f.severity)).toEqual(["high", "high"]);
    expect(findings[0].file).toBe("jobs/loader.py");
    expect(findings[0].line).toBe(3);
    expect(findings[0].title).toContain("pickle");
  });

  it("flags sinks the hand-written rules miss (new Function) and skips already-flagged lines", () => {
    const findings = sinkFindings([
      {
        path: "src/app.ts",
        lines: [
          { number: 10, text: "eval(userInput);" },
          { number: 11, text: "const fn = new Function(userCode); fn();" },
          { number: 12, text: 'query = "SELECT * FROM users WHERE id = " + id;' },
        ],
      },
    ]);
    const lines = findings.map((f) => f.line).sort();
    expect(lines).toEqual([11, 12]);
    expect(findings.find((f) => f.line === 11)?.severity).toBe("high");
    expect(findings.find((f) => f.line === 12)?.severity).toBe("medium");
    expect(findings.every((f) => f.source === "static")).toBe(true);
  });

  it("does not flag safe code", () => {
    expect(
      sinkFindings([
        {
          path: "src/util.ts",
          lines: [
            { number: 1, text: "const total = parts.reduce(sum, 0);" },
            { number: 2, text: "return JSON.stringify(total);" },
          ],
        },
      ]),
    ).toEqual([]);
  });
});
