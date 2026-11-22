// deletes the signed-in player's login user (T-27)
// their rows cascade away, and their events rows stay with a null user_id
import { NextResponse } from "next/server";
import { admin } from "@/lib/server/admin";
import { requireUser } from "@/lib/server/auth";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Deleting the account failed", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // the access token stays valid until it expires, so clear the session cookies here too
  // local scope drops the cookies before the logout call, so it doesn't matter if that call fails for a deleted user
  await user.supabase.auth.signOut({ scope: "local" }).catch(() => {});
  return NextResponse.json({ ok: true });
}
