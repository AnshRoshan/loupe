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
  it("uses a distinct salt for each password hash", async () => {
    expect(await hashPassword("A-long-password!")).not.toBe(
      await hashPassword("A-long-password!"),
    );
  });
  it("verifies only the correct password", async () => {
    const hash = await hashPassword("A-long-password!");
    expect(await verifyPassword("A-long-password!", hash)).toBe(true);
    expect(await verifyPassword("Not-the-password!", hash)).toBe(false);
    expect(hash).not.toContain("A-long-password!");
  });
  it("rejects corrupted or legacy-incompatible stored hashes instead of throwing", async () => {
    await expect(verifyPassword("x", "garbage")).resolves.toBe(false);
    await expect(verifyPassword("x", "")).resolves.toBe(false);
    await expect(verifyPassword("x", "salt-only-no-colon")).resolves.toBe(false);
  });
  it("still verifies a legacy-format (salt:hash) hash", async () => {
    const { randomBytes, scryptSync } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const legacy = `${salt}:${scryptSync("old-account-pass", salt, 64).toString("hex")}`;
    expect(await verifyPassword("old-account-pass", legacy)).toBe(true);
    expect(await verifyPassword("wrong", legacy)).toBe(false);
  });
});
