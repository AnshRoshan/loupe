import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const run = Date.now();
async function account(suffix: string) {
  const response = await fetch(`${base}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signup",
      email: `loupe-smoke-${run}-${suffix}@example.com`,
      name: `Loupe Test ${suffix}`,
      password: "Testing-only-Long-Password-123!",
    }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.equal(data.ok, true);
  const cookie = response.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  assert.ok(cookie.includes("loupe_session="));
  return cookie;
}
async function request(
  path: string,
  cookie: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(base + path, {
    method,
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
const config = await (await fetch(base + "/api/auth")).json();
if (config.supabase) {
  console.log(
    "SKIPPED standalone smoke test: Supabase mode needs live provider credentials.",
  );
  process.exit(0);
}
const a = await account("a");
const b = await account("b");
assert.equal((await request("/api/auth", a)).data.user.name, "Loupe Test a");
assert.equal((await request("/api/scans", "")).status, 401);
assert.equal(
  (
    await request("/api/scans", a, "POST", {
      repository: "http://169.254.169.254/latest",
    })
  ).status,
  400,
);
console.log(
  "PASS real signup, cookie session, unauthenticated access denial, SSRF input rejection",
);
const scan = await request("/api/scans", a, "POST", {
  repository: "anshace/loupe",
  ai: false,
});
assert.equal(scan.status, 200, JSON.stringify(scan.data));
assert.equal(scan.data.scan.status, "completed");
assert.ok(scan.data.scan.result.filesScanned > 0);
assert.match(scan.data.scan.result.sha, /^[a-f0-9]{40}$/);
console.log(
  `PASS real GitHub scan: ${scan.data.scan.result.filesScanned} files, ${scan.data.scan.result.findings.length} findings, ${scan.data.scan.result.duration}ms`,
);
const id = scan.data.scan.id;
assert.equal((await request("/api/scans", b)).data.scans.length, 0);
await request("/api/scans?id=" + id, b, "DELETE");
assert.ok(
  (await request("/api/scans", a)).data.scans.some(
    (s: { id: string }) => s.id === id,
  ),
);
console.log("PASS cross-account history isolation and delete authorization");
await request("/api/scans?id=" + id, a, "DELETE");
assert.equal((await request("/api/scans", a)).data.scans.length, 0);
await request("/api/auth", a, "POST", { action: "logout" });
assert.equal((await request("/api/scans", a)).status, 401);
console.log("PASS own-report deletion and server-side session revocation");
const origin = await fetch(base + "/api/auth", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "https://malicious.example",
  },
  body: JSON.stringify({ action: "logout" }),
});
assert.equal(origin.status, 403);
console.log("PASS cross-origin request rejection");
