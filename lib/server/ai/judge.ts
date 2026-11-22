// runs short-answer grading and failing code feedback outside the main chat loop for T-29
import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { GradeResult, Preferences, RunStatus, TestResult } from "@/lib/types";
import { buildPreferenceString } from "./preferences";
import { loadPrompt } from "./prompts";

// lets /api/grade separate AI outages from real errors: short answers return 503, code uses plainCountFeedback
export class AiUnavailableError extends Error {}

// set AI_DOWN=1 to simulate an Anthropic outage
export const aiDown = () => process.env.AI_DOWN === "1";

// same persona and rules as the game master, minus the player's freeform note so it can't steer grading
async function judgeInstructions(preferences: Preferences): Promise<string> {
  return [
    await loadPrompt("game-master"),
    await loadPrompt("judge"),
    buildPreferenceString(preferences, { includeNote: false }),
  ].join("\n\n");
}

// no chat history, so earlier messages can't sway grading
export async function judgeShortAnswer(
  puzzle: { question: string; modelAnswer: string; rubric: string },
  playerAnswer: string,
  preferences: Preferences,
): Promise<GradeResult> {
  if (aiDown()) throw new AiUnavailableError("AI_DOWN=1");
  const instructions = await judgeInstructions(preferences);
  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-5-5"),
      instructions,
      output: Output.object({ schema: z.object({ correct: z.boolean(), feedback: z.string().max(300) }) }),
      prompt: `Question: ${puzzle.question}\nModel answer: ${puzzle.modelAnswer}\nRubric: ${puzzle.rubric}\nPlayer answer:\n<<<${playerAnswer}>>>`,
    });
    return { passed: output.correct, feedback: output.feedback };
  } catch (error) {
    throw new AiUnavailableError(error instanceof Error ? error.message : String(error), { cause: error });
  }
}

// keeps Submit working without an AI call when AI is down, the player hits the daily limit, or tests pass
export function plainCountFeedback(hiddenTests: boolean[]): string {
  return `${hiddenTests.filter(Boolean).length} of ${hiddenTests.length} hidden tests passed.`;
}

// leaves out chat history and hidden test details so chat can't sway feedback and hidden tests can't leak
export async function explainFailure(
  input: {
    task: string; // includes starter code so the model sees the expected function signature
    code: string;
    status: RunStatus;
    message?: string;
    failedSampleTests: TestResult[];
    hiddenFailed: number; // count only, so hidden test names and errors can't leak
    hiddenTotal: number;
  },
  preferences: Preferences,
): Promise<string> {
  if (aiDown()) throw new AiUnavailableError("AI_DOWN=1");
  const instructions = await judgeInstructions(preferences);
  const samples = input.failedSampleTests.map((t) => `- ${t.name}${t.error ? `: ${t.error}` : ""}`).join("\n") || "none";
  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-5-5"),
      instructions,
      output: Output.object({ schema: z.object({ feedback: z.string().max(300) }) }),
      prompt: `Task:\n${input.task}\n\nStatus: ${input.status}\nError: ${input.message || "none"}\nFailed sample tests:\n${samples}\nHidden tests failed: ${input.hiddenFailed} of ${input.hiddenTotal}\nPlayer code:\n<<<${input.code}>>>`,
    });
    return output.feedback;
  } catch (error) {
    throw new AiUnavailableError(error instanceof Error ? error.message : String(error), { cause: error });
  }
}
