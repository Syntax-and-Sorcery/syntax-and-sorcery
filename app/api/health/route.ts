import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { error } = await supabase.from("tracks").select("id", { head: true, count: "exact" });
  return Response.json({ ok: !error }, { status: error ? 503 : 200 });
}
