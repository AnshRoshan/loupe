import { NextResponse } from "next/server";
import { getUser, hasSupabase, sameOrigin, supabaseServer } from "@/lib/auth";
import { z } from "zod";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!hasSupabase() || !(await getUser()))
    return NextResponse.json(
      { error: "Open a valid recovery link to reset your password." },
      { status: 401 },
    );
  try {
    const { password } = z
      .object({ password: z.string().min(8).max(128) })
      .parse(await req.json());
    const { error } = await (
      await supabaseServer()
    ).auth.updateUser({ password });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Choose a password between 8 and 128 characters." },
      { status: 400 },
    );
  }
}
