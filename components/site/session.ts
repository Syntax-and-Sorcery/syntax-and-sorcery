"use client";

// browser session state
// when NEXT_PUBLIC_DATA_SOURCE=mock, skips Supabase and signs in as "mira" in memory so auth flows still work
import { useEffect, useState, useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export const IS_MOCK = process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";

export interface SessionUser {
  username: string;
  email: string;
}
export type Session =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: SessionUser };

const MOCK_USER: SessionUser = { username: "mira", email: "mira.karim@example.com" };

let mockSession: Session = { status: "signed-in", user: MOCK_USER };
const listeners = new Set<() => void>();
function setMockSession(next: Session) {
  mockSession = next;
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const serverSnapshot: Session = { status: "signed-in", user: MOCK_USER };

function toSessionUser(user: User): SessionUser {
  // sign-up stores username in user metadata, and a DB trigger copies it into profiles
  const username = typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "";
  return { username: username || (user.email ?? "").split("@")[0], email: user.email ?? "" };
}

export function useSession(): Session {
  const mock = useSyncExternalStore(subscribe, () => mockSession, () => serverSnapshot);
  const [real, setReal] = useState<Session>({ status: "loading" });

  useEffect(() => {
    if (IS_MOCK) return;
    const supabase = createClient();
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setReal(data.user ? { status: "signed-in", user: toSessionUser(data.user) } : { status: "signed-out" });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setReal(session?.user ? { status: "signed-in", user: toSessionUser(session.user) } : { status: "signed-out" });
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return IS_MOCK ? mock : real;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (IS_MOCK) {
    setMockSession({ status: "signed-in", user: { ...MOCK_USER, email: email || MOCK_USER.email } });
    return null;
  }
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

// check the username first, since a duplicate makes the sign-up DB trigger fail with a vague error
export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ field: "username" | "form"; message: string } | null> {
  if (IS_MOCK) {
    setMockSession({ status: "signed-in", user: { username: input.username, email: input.email } });
    return null;
  }
  const supabase = createClient();
  const { data: free, error: rpcError } = await supabase.rpc("username_available", { p_username: input.username });
  if (rpcError) return { field: "form", message: rpcError.message };
  if (!free) return { field: "username", message: "That username is taken." };
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { username: input.username } },
  });
  return error ? { field: "form", message: error.message } : null;
}

export async function signOut(): Promise<void> {
  if (IS_MOCK) {
    setMockSession({ status: "signed-out" });
    return;
  }
  await createClient().auth.signOut({ scope: "local" }); // "global" would sign out every device
}
