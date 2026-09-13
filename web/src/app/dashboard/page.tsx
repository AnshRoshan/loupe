import { getUser, hasSupabase } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
export const metadata = { title: "Your workspace" };
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await getUser();
  return (
    <Dashboard
      user={user}
      config={{
        supabase: hasSupabase(),
        ai: Boolean(process.env.OPENAI_API_KEY || process.env.LLM_API_KEY),
        model: process.env.LLM_MODEL || "gpt-4o-mini",
      }}
    />
  );
}
