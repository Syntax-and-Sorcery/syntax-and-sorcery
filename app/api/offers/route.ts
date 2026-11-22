// no-AI mode's stored enemies for one run (T-22)
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { loadGameContext, RunNotFoundError } from "@/lib/server/ai/context";
import { storedEnemies } from "@/lib/server/puzzles";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const runId = z.string().uuid().safeParse(new URL(req.url).searchParams.get("runId"));
  if (!runId.success) return NextResponse.json({ error: "Expected ?runId=<uuid>" }, { status: 400 });

  try {
    // loads as this player, so someone else's run is a 404 too
    const context = await loadGameContext(user, runId.data);
    return NextResponse.json(await storedEnemies(context));
  } catch (error) {
    if (error instanceof RunNotFoundError) return NextResponse.json({ error: "No such run" }, { status: 404 });
    throw error;
  }
}
