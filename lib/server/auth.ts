import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  return id ? { id, supabase } : null; // supabase here runs queries as this user, so RLS applies
}
