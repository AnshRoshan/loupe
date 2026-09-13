import "dotenv/config";
import { describe, it, expect } from "vitest";
import {
  sameOrigin,
  publicOrigin,
  hashPassword,
  verifyPassword,
} from "../src/lib/auth";
describe("deployment-safe request origins", () => {
  it("allows same-origin local requests", () => {
    expect(
      sameOrigin(
        new Request("http://localhost:3000/api/auth", {
          headers: { origin: "http://localhost:3000", host: "localhost:3000" },
        }),
      ),
    ).toBe(true);
  });
  it("allows HTTPS behind a reverse proxy with matching request host", () => {
    expect(
      sameOrigin(
        new Request("http://localhost:3000/api/auth", {
          headers: { origin: "https://loupe.example", host: "loupe.example" },
        }),
      ),
    ).toBe(true);
  });
  it("rejects unrelated websites", () => {
    expect(
      sameOrigin(
        new Request("https://loupe.example/api/auth", {
          headers: { origin: "https://evil.example", host: "loupe.example" },
        }),
      ),
    ).toBe(false);
  });
  it("rejects opaque and non-HTTP origins", () => {
    expect(
      sameOrigin(
        new Request("https://loupe.example/api/auth", {
          headers: { origin: "null" },
        }),
      ),
    ).toBe(false);
    expect(
      sameOrigin(
        new Request("https://loupe.example/api/auth", {
          headers: { origin: "file://loupe.example" },
        }),
      ),
    ).toBe(false);
  });
  it("preserves a valid public origin for callbacks when APP_URL is absent", () => {
    if (!process.env.APP_URL)
      expect(
        publicOrigin(
          new Request("http://localhost:3000/api/auth", {
            headers: { origin: "https://loupe.example", host: "loupe.example" },
          }),
        ),
      ).toBe("https://loupe.example");
  });
});
describe("standalone password protection", () => {
  it("uses a distinct salt for each password hash", () => {
    expect(hashPassword("A-long-password!")).not.toBe(
      hashPassword("A-long-password!"),
    );
  });
  it("verifies only the correct password", () => {
    const hash = hashPassword("A-long-password!");
    expect(verifyPassword("A-long-password!", hash)).toBe(true);
    expect(verifyPassword("Not-the-password!", hash)).toBe(false);
    expect(hash).not.toContain("A-long-password!");
  });
});
