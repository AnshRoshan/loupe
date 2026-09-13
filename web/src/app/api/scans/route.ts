import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { getUser, rateLimit, sameOrigin } from "@/lib/auth";
import { parseRepository, scanRepository } from "@/lib/scanner";
export const maxDuration = 60;
export async function GET() {
  const user = await getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to view your reviews." },
      { status: 401 },
    );
  await db
    .update(scans)
    .set({
      status: "failed",
      error: "The scan was interrupted. Please run it again.",
    })
    .where(
      and(
        eq(scans.ownerId, user.id),
        eq(scans.status, "running"),
        lt(scans.createdAt, new Date(Date.now() - 120000)),
      ),
    );
  const data = await db
    .select()
    .from(scans)
    .where(eq(scans.ownerId, user.id))
    .orderBy(desc(scans.createdAt))
    .limit(50);
  return NextResponse.json(
    { scans: data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const user = await getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to start a repository scan." },
      { status: 401 },
    );
  let id: string | undefined;
  try {
    if (Number(req.headers.get("content-length") || 0) > 5000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const body = z
      .object({
        repository: z.string().min(3).max(250),
        token: z
          .string()
          .max(255)
          .regex(/^[a-zA-Z0-9_]*$/)
          .optional(),
        ai: z.boolean().default(false),
      })
      .parse(await req.json());
    const parsed = parseRepository(body.repository);
    if (!(await rateLimit(`scan:${user.id}`, 10, 3600000)))
      return NextResponse.json(
        {
          error: "You have reached 10 scans this hour. Please try again later.",
        },
        { status: 429 },
      );
    const [row] = await db
      .insert(scans)
      .values({ ownerId: user.id, repository: parsed.repository })
      .returning();
    id = row.id;
    const result = await scanRepository(
      body.repository,
      body.token || undefined,
      body.ai,
    );
    const [saved] = await db
      .update(scans)
      .set({ status: "completed", result })
      .where(eq(scans.id, id))
      .returning();
    return NextResponse.json({ scan: saved });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0].message
        : error instanceof Error
          ? error.message
          : "Unable to complete the scan.";
    if (id)
      await db
        .update(scans)
        .set({ status: "failed", error: message })
        .where(eq(scans.id, id));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
export async function DELETE(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });
  await db
    .delete(scans)
    .where(and(eq(scans.id, id), eq(scans.ownerId, user.id)));
  return NextResponse.json({ ok: true });
}
