// grades without saving to the database so the client stays in charge of recording attempts and settling encounters
import { NextResponse } from "next/server";
import { z } from "zod";
import type { GradeResult, TestResult } from "@/lib/types";
import { runTests } from "@/lib/runner";
import { requireUser } from "@/lib/server/auth";
import { logEvent } from "@/lib/server/events";
import { bumpUsage } from "@/lib/server/usage";
import { loadPuzzle, type FullCodePuzzle } from "@/lib/server/puzzles";
import { AiUnavailableError, aiDown, explainFailure, judgeShortAnswer, plainCountFeedback } from "@/lib/server/ai/judge";
import { withDefaults } from "@/lib/server/ai/preferences";

export const maxDuration = 60;

type User = NonNullable<Awaited<ReturnType<typeof requireUser>>>;

// one string field for every kind: option index for MCQs, text for short answers, source code for code puzzles
const bodySchema = z.object({ puzzleId: z.string().uuid(), answer: z.string().max(50_000) });

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Expected { puzzleId, answer }" }, { status: 400 });
  const { puzzleId, answer } = body.data;

  // require an active fight for this puzzle so players can't probe MCQ answer keys ahead of time
  const { data: fight, error: fightError } = await user.supabase
    .from("encounters")
    .select("id")
    .eq("puzzle_id", puzzleId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (fightError) throw fightError;
  if (!fight) return NextResponse.json({ error: "No active fight with this puzzle" }, { status: 404 });

  const puzzle = await loadPuzzle(puzzleId); // uses the admin client since players can't read the answer column
  if (!puzzle) return NextResponse.json({ error: "No such puzzle" }, { status: 404 });

  switch (puzzle.kind) {
    case "mcq": {
      const passed = answer.trim() === String(puzzle.answer.correctIndex);
      const result: GradeResult = {
        passed,
        feedback: puzzle.answer.explanation,
        correctIndex: puzzle.answer.correctIndex,
        explanation: puzzle.answer.explanation,
      };
      return NextResponse.json(result);
    }

    case "short": {
      if (answer.length > puzzle.content.maxLength) {
        return NextResponse.json({ error: `The answer is longer than ${puzzle.content.maxLength} characters` }, { status: 400 });
      }
      if (!(await bumpUsage(user.id, "ai"))) return NextResponse.json({ error: "ai_limit" }, { status: 429 });
      const { data: profile, error } = await user.supabase.from("profiles").select("preferences").eq("id", user.id).single();
      if (error) throw error;
      try {
        const result = await judgeShortAnswer(
          { question: puzzle.content.question, ...puzzle.answer },
          answer,
          withDefaults(profile.preferences),
        );
        return NextResponse.json(result);
      } catch (e) {
        if (!(e instanceof AiUnavailableError)) throw e;
        await logEvent("ai_failure", { route: "grade", puzzleId, message: e.message }, user.id);
        // keep the fight active so the player can retry
        return NextResponse.json({ error: "judge_unavailable" }, { status: 503 });
      }
    }

    case "code": {
      if (!(await bumpUsage(user.id, "sandbox"))) return NextResponse.json({ error: "run_limit" }, { status: 429 });
      return NextResponse.json(await gradeCode(puzzle, answer, user));
    }
  }
}

// hidden tests decide pass or fail
// sample tests run too so failure feedback can name them
// return only booleans for hidden tests so the browser never sees their names or errors
async function gradeCode(puzzle: FullCodePuzzle, code: string, { id: userId, supabase }: User): Promise<GradeResult> {
  const sample = puzzle.content.sampleTests;
  const hidden = puzzle.answer.hiddenTests;
  const run = await runTests(puzzle.language, code, [...sample, ...hidden]).catch(async (error: unknown) => {
    // a sandbox that throws is a failed run too, so log it before the 500
    await logEvent("sandbox_failure", { route: "grade", puzzleId: puzzle.id, message: String(error) }, userId);
    throw error;
  });
  if (run.status === "internal_error") await logEvent("sandbox_failure", { route: "grade", puzzleId: puzzle.id, message: run.message }, userId);

  // the runner returns results in input order, so a shorter list means the code stopped before running every test
  const complete = run.status === "ok" && run.tests.length === sample.length + hidden.length;
  const sampleResults: TestResult[] = complete ? run.tests.slice(0, sample.length) : [];
  const hiddenTests = complete ? run.tests.slice(sample.length).map((t) => t.passed) : hidden.map(() => false);
  const passed = complete && hiddenTests.every(Boolean);
  const result: GradeResult = { passed, feedback: "", hiddenTests, status: run.status, stdout: run.stdout, message: run.message };

  if (run.status === "busy") return result; // code never ran, so skip AI feedback and save the player's turn
  if (run.status === "internal_error") return result; // runner error, not player code; status message asks to retry
  if (passed) return { ...result, feedback: plainCountFeedback(hiddenTests) }; // game master narrates wins

  // default to a plain test count so Submit still gives useful feedback if AI turns run out or the call fails
  let feedback = plainCountFeedback(hiddenTests);
  // check aiDown first so AI_DOWN=1 doesn't spend a turn, but still log it like a real outage
  if (aiDown()) {
    await logEvent("ai_failure", { route: "grade", puzzleId: puzzle.id, message: "AI_DOWN=1" }, userId);
  } else if (await bumpUsage(userId, "ai")) {
    // preferences only affect tone, so fall back to defaults instead of failing the Submit if the profile query fails
    const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
    try {
      feedback = await explainFailure({
        task: `${puzzle.title}: ${puzzle.description}\n\n${puzzle.content.starterCode}`,
        code,
        status: run.status,
        message: run.message,
        failedSampleTests: sampleResults.filter((t) => !t.passed),
        hiddenFailed: hiddenTests.filter((p) => !p).length,
        hiddenTotal: hiddenTests.length,
      }, withDefaults(profile?.preferences));
    } catch (e) {
      await logEvent("ai_failure", { route: "grade", puzzleId: puzzle.id, message: e instanceof Error ? e.message : String(e) }, userId);
    }
  }
  return { ...result, feedback };
}
