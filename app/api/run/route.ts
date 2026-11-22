// runs a puzzle's sample tests, or a standalone lesson snippet when puzzleId is omitted
// saves nothing
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { logEvent } from "@/lib/server/events";
import { bumpUsage } from "@/lib/server/usage";
import { loadCodePuzzle } from "@/lib/server/puzzles";
import { runTests } from "@/lib/runner";

export const maxDuration = 30;

const bodySchema = z.object({
  puzzleId: z.string().uuid().nullish(),
  code: z.string().max(50_000),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Expected { puzzleId, code }" }, { status: 400 });
  const { puzzleId, code } = body.data;

  const puzzle = puzzleId ? await loadCodePuzzle(puzzleId) : null;
  if (puzzleId && !puzzle) return NextResponse.json({ error: "No such code puzzle" }, { status: 404 });
  if (!(await bumpUsage(user.id, "sandbox"))) return NextResponse.json({ error: "run_limit" }, { status: 429 });

  const result = await runTests(puzzle?.language ?? "javascript", code, puzzle?.content.sampleTests ?? []).catch(
    async (error: unknown) => {
      // a sandbox that throws is a failed run too, so log it before the 500
      await logEvent("sandbox_failure", { route: "run", puzzleId, message: String(error) }, user.id);
      throw error;
    },
  );
  if (result.status === "internal_error") await logEvent("sandbox_failure", { route: "run", puzzleId, message: result.message }, user.id);
  return NextResponse.json(result);
}
