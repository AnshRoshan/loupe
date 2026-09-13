import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, rateLimits } from "@/db/schema";
import { createServerClient } from "@supabase/ssr";

export const hasSupabase = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (entries) => {
          try {
            entries.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Read-only server component; proxy handles refresh. */
          }
        },
      },
    },
  );
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await db.insert(sessions).values({ id: digest(token), userId, expiresAt });
  (await cookies()).set("loupe_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function getUser() {
  if (hasSupabase()) {
    const {
      data: { user },
    } = await (await supabaseServer()).auth.getUser();
    return user
      ? {
          id: user.id,
          email: user.email || "",
          name:
            typeof user.user_metadata.full_name === "string"
              ? user.user_metadata.full_name.slice(0, 80)
              : user.email?.split("@")[0] || "Developer",
        }
      : null;
  }
  const token = (await cookies()).get("loupe_session")?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: accounts.id, email: accounts.email, name: accounts.name })
    .from(sessions)
    .innerJoin(accounts, eq(sessions.userId, accounts.id))
    .where(
      and(eq(sessions.id, digest(token)), gt(sessions.expiresAt, new Date())),
    )
    .limit(1);
  return row || null;
}
export async function signOut() {
  if (hasSupabase()) await (await supabaseServer()).auth.signOut();
  const jar = await cookies();
  const token = jar.get("loupe_session")?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, digest(token)));
  jar.delete("loupe_session");
}
export async function rateLimit(key: string, max: number, windowMs: number) {
  const now = new Date();
  const reset = new Date(Date.now() + windowMs);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: reset })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} < ${now.toISOString()}::timestamptz THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < ${now.toISOString()}::timestamptz THEN ${reset.toISOString()}::timestamptz ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning();
  return row.count <= max;
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (process.env.APP_URL && origin === new URL(process.env.APP_URL).origin)
      return true;
    return (
      origin === new URL(req.url).origin ||
      parsed.host === req.headers.get("host")
    );
  } catch {
    return false;
  }
}
export function publicOrigin(req: Request) {
  if (process.env.APP_URL) return new URL(process.env.APP_URL).origin;
  const origin = req.headers.get("origin");
  if (origin && sameOrigin(req)) return new URL(origin).origin;
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const protocol =
    req.headers.get("x-forwarded-proto") === "https" ? "https:" : url.protocol;
  return `${protocol}//${host}`;
}
