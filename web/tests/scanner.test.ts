import { describe, it, expect } from "vitest";
import { parseRepository, inspectSource } from "../src/lib/scanner";
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
