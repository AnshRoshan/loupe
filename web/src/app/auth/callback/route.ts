import { NextResponse } from "next/server";
import { hasSupabase, publicOrigin, supabaseServer } from "@/lib/auth";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = publicOrigin(req);
  if (code && hasSupabase()) {
    const { error } = await (
      await supabaseServer()
    ).auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          url.searchParams.get("next") === "/reset-password"
            ? "/reset-password"
            : "/dashboard",
          origin,
        ),
      );
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
