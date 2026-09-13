import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import {
  createSession,
  getUser,
  hasSupabase,
  hashPassword,
  rateLimit,
  sameOrigin,
  signOut,
  supabaseServer,
  publicOrigin,
  verifyPassword,
} from "@/lib/auth";
export async function GET() {
  return NextResponse.json(
    { user: await getUser(), supabase: hasSupabase() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    if (Number(req.headers.get("content-length") || 0) > 8000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const body = await req.json();
    if (body.action === "logout") {
      await signOut();
      return NextResponse.json({ ok: true });
    }
    const input = z
      .object({
        action: z.enum(["login", "signup", "reset", "github"]),
        email: z.string().email().max(254).optional(),
        password: z.string().min(8).max(128).optional(),
        name: z.string().trim().min(2).max(80).optional(),
      })
      .parse(body);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if (!(await rateLimit(`auth:${ip}`, 20, 900000)))
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 15 minutes." },
        { status: 429 },
      );
    const origin = publicOrigin(req);
    if (hasSupabase()) {
      const client = await supabaseServer();
      if (input.action === "github") {
        const { data, error } = await client.auth.signInWithOAuth({
          provider: "github",
          options: { redirectTo: `${origin}/auth/callback` },
        });
        if (error) throw error;
        return NextResponse.json({ url: data.url });
      }
      if (!input.email)
        return NextResponse.json(
          { error: "Enter your email address." },
          { status: 400 },
        );
      if (input.action === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(input.email, {
          redirectTo: `${origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        return NextResponse.json({
          message: "Check your email for a password reset link.",
        });
      }
      if (!input.password)
        return NextResponse.json(
          { error: "A password of at least 8 characters is required." },
          { status: 400 },
        );
      const { data, error } =
        input.action === "signup"
          ? await client.auth.signUp({
              email: input.email,
              password: input.password,
              options: {
                data: { full_name: input.name },
                emailRedirectTo: `${origin}/auth/callback`,
              },
            })
          : await client.auth.signInWithPassword({
              email: input.email,
              password: input.password,
            });
      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({
        ok: true,
        message: !data.session
          ? "Check your email to confirm your account."
          : undefined,
      });
    }
    if (input.action === "github" || input.action === "reset")
      return NextResponse.json(
        {
          error:
            "This option requires Supabase. Email and password sign-in is available now.",
        },
        { status: 503 },
      );
    if (!input.email || !input.password)
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    const email = input.email.toLowerCase().trim();
    if (!(await rateLimit(`account:${email}`, 10, 900000)))
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    if (input.action === "signup") {
      const rows = await db
        .insert(accounts)
        .values({
          email,
          name: input.name || email.split("@")[0],
          passwordHash: await hashPassword(input.password),
        })
        .onConflictDoNothing()
        .returning();
      if (!rows.length)
        return NextResponse.json(
          { error: "Unable to create this account. Try signing in instead." },
          { status: 409 },
        );
      await createSession(rows[0].id);
    } else {
      const [user] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.email, email))
        .limit(1);
      const valid = await verifyPassword(
        input.password,
        user?.passwordHash ||
          "00000000000000000000000000000000:" + "00".repeat(64),
      );
      if (!user || !valid)
        return NextResponse.json(
          { error: "The email or password is incorrect." },
          { status: 401 },
        );
      await createSession(user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    console.error(
      "Authentication request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
