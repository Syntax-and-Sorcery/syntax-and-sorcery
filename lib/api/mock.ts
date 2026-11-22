// in-memory mock GameApi for local UI testing
// code comments trigger outcomes: "// pass", "// loop", "// oops"
import { BOSS_ENEMY_SPRITE, DEFAULT_ENEMY_COLOR, STORED_ENEMY_SPRITES } from "@/content/sprites";
import type { GradeResult, PlayerPuzzle, RunResult, StoredEnemy, TestResult } from "@/lib/types";
import { LOOPS_PUZZLES, mockClearedConcepts, mockPuzzle, mockPuzzlesOf, mockRun } from "@/lib/data/mock";
import type { GameApi } from "./index";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const spriteName = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

type CodePuzzle = Extract<PlayerPuzzle, { kind: "code" }>;
type Outcome = "pass" | "timeout" | "syntax_error" | "partial";

function outcome(code: string): Outcome {
  if (code.includes("// pass")) return "pass";
  if (code.includes("// loop")) return "timeout";
  if (code.includes("// oops")) return "syntax_error";
  return "partial";
}

function codePuzzle(puzzleId: string): CodePuzzle {
  const found = mockPuzzle(puzzleId)?.puzzle;
  if (!found) throw new Error(`No puzzle ${puzzleId}`);
  if (found.kind !== "code") throw new Error(`Puzzle ${puzzleId} isn't a code puzzle`);
  return found;
}

// matches the harness failure format, e.g. "Expected 2, got undefined"
function failure(code: string): string {
  const expected = /\.to(?:Be|Equal)\((.*)\)\s*;\s*\}\s*\)\s*;?\s*$/.exec(code)?.[1] ?? "something else";
  return `Expected ${expected}, got undefined`;
}

const SYNTAX_ERROR = "SyntaxError: Unexpected token '}'";
const TIMEOUT = "The code was stopped after 5 seconds.";

export const mockGameApi: GameApi = {
  async run(puzzleId, code) {
    await delay(500);
    const durationMs = 640 + Math.round(Math.random() * 200);
    if (puzzleId === null) return { status: "ok", tests: [], stdout: "Hello from the lesson", durationMs };

    const puzzle = codePuzzle(puzzleId);
    const result = outcome(code);
    if (result === "timeout") return { status: "timeout", tests: [], stdout: "", message: TIMEOUT, durationMs: 5000 };
    if (result === "syntax_error") return { status: "syntax_error", tests: [], stdout: "", message: SYNTAX_ERROR, durationMs };
    const tests = puzzle.sampleTests.map(
      (t, i): TestResult =>
        result === "pass" || i > 0 ? { name: t.name, passed: true } : { name: t.name, passed: false, error: failure(t.code) },
    );
    return { status: "ok", tests, stdout: "", durationMs } satisfies RunResult;
  },

  async grade(puzzleId, answer) {
    await delay(700);
    const found = mockPuzzle(puzzleId)?.puzzle;
    if (!found) throw new Error(`No puzzle ${puzzleId}`);

    if (found.kind === "mcq") {
      const passed = answer.trim() === "1";
      return {
        passed,
        feedback: passed ? "Right answer." : "Not this time.",
        correctIndex: 1,
        explanation: `"${found.options[1]}" is right. Read the code one round at a time to see why.`,
      } satisfies GradeResult;
    }

    if (found.kind === "short") {
      const passed = answer.trim().length > 20;
      return {
        passed,
        feedback: passed
          ? "That's it: the total has to survive from one round to the next."
          : "Say a little more: what happens to the total each round?",
      };
    }

    const n = found.hiddenTestCount;
    const result = outcome(answer);
    if (result === "pass") {
      return { passed: true, feedback: `All ${n} hidden tests passed.`, hiddenTests: Array(n).fill(true), status: "ok", stdout: "" };
    }
    if (result === "timeout" || result === "syntax_error") {
      return {
        passed: false,
        feedback: `0 of ${n} hidden tests passed.`,
        hiddenTests: Array(n).fill(false),
        status: result,
        stdout: "",
        message: result === "timeout" ? TIMEOUT : SYNTAX_ERROR,
      };
    }
    // fail the second hidden test to exercise partial-failure UI
    const hiddenTests = Array.from({ length: n }, (_, i) => i !== 1);
    const feedback =
      puzzleId === LOOPS_PUZZLES.kraken
        ? "Your count comes out one short when the very first chest is rich." // simulates explainFailure
        : `${n - 1} of ${n} hidden tests passed.`; // plain count fallback when AI is unavailable
    return { passed: false, feedback, hiddenTests, status: "ok", stdout: "" };
  },

  async offers(runId) {
    await delay(300);
    const run = mockRun(runId);
    if (!run) throw new Error(`No run ${runId}`);
    const all = mockPuzzlesOf(run.adventureId);
    const conceptSlugs = [...new Set(all.map((p) => p.concept).filter((c) => c !== "boss"))];
    const cleared = mockClearedConcepts(runId);

    const picked = conceptSlugs.flatMap((concept) =>
      (["mcq", "code"] as const).flatMap((kind) => {
        const p = all.find((x) => x.concept === concept && x.puzzle.kind === kind);
        return p ? [p] : [];
      }),
    );
    if (conceptSlugs.every((c) => cleared.has(c))) {
      const boss = all.find((p) => p.concept === "boss");
      if (boss) picked.push(boss);
    }

    return picked.map(({ puzzle, concept }, i): StoredEnemy => {
      const isBoss = concept === "boss";
      const sprite = isBoss ? BOSS_ENEMY_SPRITE : STORED_ENEMY_SPRITES[i % STORED_ENEMY_SPRITES.length];
      return {
        puzzleId: puzzle.id,
        name: spriteName(sprite),
        sprite,
        color: DEFAULT_ENEMY_COLOR,
        concept,
        kind: puzzle.kind as "mcq" | "code",
        difficulty: puzzle.difficulty,
        title: puzzle.title,
        hiddenTestCount: puzzle.kind === "code" ? puzzle.hiddenTestCount : 1,
        isBoss,
      };
    });
  },
};
