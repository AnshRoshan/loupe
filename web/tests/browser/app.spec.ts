import { test, expect } from "@playwright/test";

test("landing examples, navigation, and mobile layout work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Great code deserves/ }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Find risks" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep user input out of the SQL query" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply suggestion" }).click();
  await expect(
    page.getByRole("button", { name: "Applied to example" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Reduce noise" }).click();
  await expect(page.getByText("No changes needed")).toBeVisible();
  await page
    .getByRole("button", { name: "Do I need to run a server?" })
    .click();
  await expect(
    page.getByText("Not for automated pull-request reviews.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/loupe-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: /Documentation/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A small setup. A thoughtful second opinion.",
    }),
  ).toBeVisible();
  await page.goto("/");
  await page.screenshot({ path: "/tmp/loupe-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("standalone authentication, validation, history isolation and logout", async ({
  page,
  request,
}) => {
  const config = await (await request.get("/api/auth")).json();
  test.skip(
    config.supabase,
    "Live Supabase requires external confirmation/provider credentials.",
  );
  const email = `loupe-e2e-${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Review Tester");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Test-only-Long-Password-482!");
  await page.getByRole("button", { name: "Create your account" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: /Let’s take a closer look/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New review", exact: true }).click();
  await page
    .getByLabel("GitHub repository or pull request")
    .fill("https://evil.example/repo");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.locator('.error-message[role="alert"]')).toContainText(
    "Enter a GitHub repository",
  );
  await page.getByRole("button", { name: "Close new review" }).click();
  const unauth = await request.get("/api/scans");
  expect(unauth.status()).toBe(401);
  const csrf = await request.post("/api/auth", {
    headers: { origin: "https://evil.example" },
    data: { action: "logout" },
  });
  expect(csrf.status()).toBe(403);
  await page.screenshot({ path: "/tmp/loupe-workspace.png", fullPage: true });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Incorrect-Password!");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page.locator('.error-message[role="alert"]')).toContainText(
    "incorrect",
  );
  await page
    .getByLabel("Password", { exact: true })
    .fill("Test-only-Long-Password-482!");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace settings" }),
  ).toBeVisible();
});
