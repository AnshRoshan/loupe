import "dotenv/config";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { db, pool } from "../src/db";
import { accounts, scans, rateLimits } from "../src/db/schema";
async function main() {
  if (process.env.ALLOW_TEST_CLEANUP !== "true")
    throw new Error("Set ALLOW_TEST_CLEANUP=true only on a test database.");
  const testAccounts = await db
    .select({ id: accounts.id, email: accounts.email })
    .from(accounts)
    .where(
      or(
        like(accounts.email, "loupe-e2e-%@example.com"),
        like(accounts.email, "loupe-smoke-%@example.com"),
      ),
    );
  if (testAccounts.length) {
    await db.transaction(async (tx) => {
      await tx.delete(scans).where(
        inArray(
          scans.ownerId,
          testAccounts.map((a) => a.id),
        ),
      );
      await tx.delete(accounts).where(
        inArray(
          accounts.id,
          testAccounts.map((a) => a.id),
        ),
      );
      await tx.delete(rateLimits).where(
        or(
          inArray(
            rateLimits.key,
            testAccounts.map((a) => "account:" + a.email),
          ),
          inArray(
            rateLimits.key,
            testAccounts.map((a) => "scan:" + a.id),
          ),
        ),
      );
    });
  }
  await db
    .delete(rateLimits)
    .where(
      or(
        eq(rateLimits.key, "auth:local"),
        eq(rateLimits.key, "auth:::1"),
        eq(rateLimits.key, "auth:127.0.0.1"),
      ),
    );
  console.log(
    `Removed ${testAccounts.length} synthetic test accounts and their review/session data.`,
  );
}
main().finally(() => pool.end());
