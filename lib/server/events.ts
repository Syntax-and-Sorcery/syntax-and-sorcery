// operational events for the admins, written with the admin client (T-31)
// logging must never break a request, so this never throws
import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { admin } from "./admin";

export async function logEvent(type: string, details: Record<string, unknown>, userId?: string | null): Promise<void> {
  try {
    const { error } = await admin()
      .from("events")
      .insert({ type, details: details as Json, user_id: userId ?? null });
    if (error) throw error;
  } catch (error) {
    console.error(`Logging the ${type} event failed`, error);
  }
}
