// a separate generateText loop that generate_puzzle calls
// only its final summary goes back to the game master
import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, isStepCount, tool } from "ai";
import { z } from "zod";
import type { PuzzleKind } from "@/lib/types";
import { runTests } from "@/lib/runner";
import { logEvent } from "@/lib/server/events";
import { existingDescriptions } from "@/lib/server/puzzles";
import { checkDraft, draftSchemas, storePuzzle, type PuzzleDraft } from "./puzzle-draft";
import { loadPrompt } from "./prompts";
import { refuse, type Refusal } from "./refuse";

export interface PuzzleSpec { adventureId: string; kind: PuzzleKind; concept: string; difficulty: number; brief: string }
export type GeneratorResult =
  | { ok: true; id: string; title: string; description: string }
  | Refusal;

const MAX_REJECTIONS = 3;

export async function runGenerator(spec: PuzzleSpec, abortSignal?: AbortSignal): Promise<GeneratorResult> {
  const state = { accepted: null as PuzzleDraft | null, rejected: 0 };
  const existing = await existingDescriptions(spec);

  let result;
  try {
    result = await generateText({
      model: anthropic("claude-haiku-5-5"),
      instructions: await loadPrompt("generator"),
      prompt: [
        `Kind: ${spec.kind}. Concept: ${spec.concept}. Difficulty: ${spec.difficulty} of 5.`,
        `Brief from the game master:\n${spec.brief}`,
        `Existing puzzles for this concept (don't repeat them):\n${existing.length ? existing.join("\n") : "(none yet)"}`,
      ].join("\n\n"),
      tools: {
        run_tests: tool({
          description: "Run code against tests in the sandbox. Code puzzles only.",
          inputSchema: z.object({ code: z.string(), tests: z.array(z.object({ name: z.string(), code: z.string() })) }),
          execute: async ({ code, tests }) => runTests("javascript", code, tests),
        }),
        submit_puzzle: tool({
          description: "Submit the finished puzzle. The server checks it and tells you what to fix.",
          inputSchema: draftSchemas[spec.kind] as z.ZodType<PuzzleDraft>,
          execute: async (draft) => {
            // checks schema rules and runs code reference solutions on the server
            const problem = await checkDraft(spec, draft);
            if (problem) {
              state.rejected++;
              return { accepted: false, problem };
            }
            state.accepted = draft;
            return { accepted: true };
          },
        }),
      },
      stopWhen: [() => state.accepted !== null || state.rejected >= MAX_REJECTIONS, isStepCount(20)],
      abortSignal,
    });
  } catch (error) {
    // an AI error mid-generation is a failed generation too, but a player closing the tab isn't
    if (!abortSignal?.aborted) {
      await logEvent("puzzle_generation_failed", { ...spec, rejected: state.rejected, message: String(error) });
    }
    throw error;
  }

  if (!state.accepted) {
    await logEvent("puzzle_generation_failed", { ...spec, rejected: state.rejected });
    return refuse("The generator failed 3 times. Use the closest puzzle from list_puzzles.");
  }
  const id = await storePuzzle(spec, state.accepted, result.responseMessages);
  return { ok: true, id, title: state.accepted.title, description: state.accepted.description };
}
