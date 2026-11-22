// validation schemas, sandbox checks, and persistence for AI-generated puzzle drafts
import "server-only";
import type { ModelMessage } from "ai";
import { z } from "zod";
import type { PuzzleKind } from "@/lib/types";
import { runTests } from "@/lib/runner";
import { admin } from "@/lib/server/admin";
import type { PuzzleSpec } from "./generator";

const testCase = z.object({
  // short description of what the test checks without revealing the expected value
  name: z.string().min(1).max(80),
  code: z.string().min(1).max(2_000),
});
const base = {
  theme: z.enum(["fantasy", "scifi", "pirates", "cyberpunk", "plain"]),
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(250), // one sentence stating the task and what tests check
};

// Anthropic needs an object at the root of a tool input schema, so submit_puzzle takes one kind's schema, not a union
export const draftSchemas = {
  mcq: z.object({
    kind: z.literal("mcq"),
    ...base,
    question: z.string().min(1).max(1_000),
    options: z.array(z.string().min(1).max(300)).min(2).max(5),
    correctIndex: z.number().int().min(0),
    explanation: z.string().min(1).max(600),
  }),
  short: z.object({
    kind: z.literal("short"),
    ...base,
    question: z.string().min(1).max(1_000),
    modelAnswer: z.string().min(1).max(1_000),
    rubric: z.string().min(1).max(1_000),
    maxLength: z.number().int().min(50).max(1_000).optional(),
  }),
  code: z.object({
    kind: z.literal("code"),
    ...base,
    starterCode: z.string().min(1).max(4_000), // the task as comments at the top, then the function to fill in
    referenceSolution: z.string().min(1).max(8_000),
    sampleTests: z.array(testCase).min(1).max(2),
    hiddenTests: z.array(testCase).min(3).max(5),
  }),
} satisfies Record<PuzzleKind, z.ZodType>;

export const puzzleDraftSchema = z.discriminatedUnion("kind", [draftSchemas.mcq, draftSchemas.short, draftSchemas.code]);
export type PuzzleDraft = z.infer<typeof puzzleDraftSchema>;

// extra checks beyond Zod; returns an error message for the generator or null if valid
export async function checkDraft(spec: PuzzleSpec, draft: PuzzleDraft): Promise<string | null> {
  if (draft.kind !== spec.kind) return `This puzzle must be of kind ${spec.kind}.`;
  if (/[\r\n]/.test(draft.description)) return "The description must be one sentence on one line.";

  switch (draft.kind) {
    case "mcq": {
      if (draft.correctIndex >= draft.options.length) return "correctIndex must point at one of the options.";
      const unique = new Set(draft.options.map((o) => o.trim().toLowerCase()));
      if (unique.size !== draft.options.length) return "Every option must be different, so exactly one is correct.";
      return null;
    }
    case "short":
      return null;
    case "code": {
      const tests = [...draft.sampleTests, ...draft.hiddenTests];
      const names = new Set(tests.map((t) => t.name));
      if (names.size !== tests.length) return "Every test needs its own name.";
      // run the reference solution on the server rather than trusting the model's claim
      const result = await runTests("javascript", draft.referenceSolution, tests);
      if (result.status !== "ok") {
        return `The reference solution didn't run: ${result.status}${result.message ? ` (${result.message})` : ""}.`;
      }
      if (result.tests.length !== tests.length) {
        return `Expected ${tests.length} test results, got ${result.tests.length}. Each test case must call test() exactly once.`;
      }
      const failed = result.tests.filter((t) => !t.passed);
      if (failed.length) {
        return `The reference solution fails: ${failed.map((t) => `"${t.name}"${t.error ? ` (${t.error})` : ""}`).join("; ")}.`;
      }
      return null;
    }
  }
}

// splits a draft into visible content and server-only answer columns
function columns(draft: PuzzleDraft) {
  switch (draft.kind) {
    case "mcq":
      return {
        content: { question: draft.question, options: draft.options },
        answer: { correctIndex: draft.correctIndex, explanation: draft.explanation },
      };
    case "short":
      return {
        content: { question: draft.question, maxLength: draft.maxLength ?? 200 },
        answer: { modelAnswer: draft.modelAnswer, rubric: draft.rubric },
      };
    case "code":
      return {
        content: { starterCode: draft.starterCode, sampleTests: draft.sampleTests, hiddenTestCount: draft.hiddenTests.length },
        answer: { referenceSolution: draft.referenceSolution, hiddenTests: draft.hiddenTests },
      };
  }
}

export async function storePuzzle(spec: PuzzleSpec, draft: PuzzleDraft, responseMessages: ModelMessage[]): Promise<string> {
  const { content, answer } = columns(draft);
  const { data, error } = await admin()
    .from("puzzles")
    .insert({
      adventure_id: spec.adventureId,
      concept: spec.concept,
      kind: spec.kind,
      difficulty: spec.difficulty,
      theme: draft.theme,
      title: draft.title,
      description: draft.description,
      content,
      answer,
      status: "validated",
      generation_log: JSON.parse(JSON.stringify({ brief: spec.brief, messages: responseMessages })),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
