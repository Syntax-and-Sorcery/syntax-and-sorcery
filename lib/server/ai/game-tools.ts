// game master tools
// ask_choice omits execute so the browser resolves it via addToolOutput
// tool inputs and outputs are sent to the browser and persisted, so never return answers or hidden tests
import "server-only";
import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";
import { SPRITE_SLUGS } from "@/content/sprites";
import { adventureState } from "@/lib/rules/adventure-state";
import { listPuzzles } from "@/lib/server/puzzles";
import { finishRun, getEncounterForModel, startEncounter } from "@/lib/server/runs";
import type { GameContext } from "./context";
import { runGenerator } from "./generator";
import { showLesson } from "./lessons";
import { refuse } from "./refuse";

const lastResultsSchema = z
  .object({
    source: z.enum(["run", "submit"]),
    // accept every RunStatus so limit or busy results don't fail validation
    status: z.enum(["ok", "syntax_error", "runtime_error", "timeout", "memory", "internal_error", "limit", "busy"]),
    sampleTests: z.array(z.object({ name: z.string(), passed: z.boolean(), error: z.string().optional() })).optional(),
    hiddenFailed: z.number().int().min(0).optional(), // count only, never names or errors
    message: z.string().max(500).optional(),
  })
  .nullable();
const fightState = { code: z.string().max(20_000).nullable(), lastResults: lastResultsSchema };

// what the server reads from a user message
// the model never sees metadata
export const gameMessageMetadataSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("basic_hint"), ...fightState }),
  z.object({ action: z.literal("scroll"), question: z.string().max(500), ...fightState }),
  // accepts multiple ids for batched no-AI mode summaries
  z.object({ action: z.literal("encounter_end"), encounterIds: z.array(z.string().uuid()).min(1), summary: z.string().max(600) }),
]);
export type GameMessageMetadata = z.infer<typeof gameMessageMetadataSchema>;

const kind = z.enum(["mcq", "short", "code"]);
const difficulty = z.number().int().min(1).max(5);
const enemyOption = z.object({
  puzzleId: z.string().uuid(),
  name: z.string().max(60),
  sprite: z.enum(SPRITE_SLUGS),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export function gameTools(ctx: GameContext) {
  const state = () => adventureState(ctx.concepts, ctx.encounters);
  const lockedReason = () =>
    `The boss is locked until every concept is cleared. Still to clear: ${state()
      .concepts.filter((c) => !c.cleared)
      .map((c) => c.slug)
      .join(", ")}.`;
  const isLockedBoss = (puzzleId: string) => ctx.bossPuzzleIds.has(puzzleId) && !state().bossUnlocked;
  const slugs = () => ctx.concepts.map((c) => c.slug);
  const unknownConcept = (concept: string) =>
    `"${concept}" isn't a concept of this adventure. Use one of: ${[...slugs(), "boss"].join(", ")}.`;

  return {
    list_puzzles: tool({
      description:
        'List up to 8 stored puzzles that fit this player: validated, from this adventure, not yet beaten, no MCQ seen before, closest to their target difficulty first. Use concept "boss" for the boss.',
      inputSchema: z.object({ concept: z.string().optional(), kind: kind.optional(), difficulty: difficulty.optional() }),
      // hide boss puzzles while locked so the model never learns a boss id early
      execute: async (input) => {
        if (input.concept === "boss" && !state().bossUnlocked) return refuse(lockedReason());
        if (input.concept && input.concept !== "boss" && !slugs().includes(input.concept)) return refuse(unknownConcept(input.concept));
        return { ok: true as const, ...(await listPuzzles(ctx, { ...input, includeBoss: state().bossUnlocked })) };
      },
    }),
    generate_puzzle: tool({
      description:
        "Write a new puzzle when list_puzzles has nothing that fits. Slow (15–40 s for code), so prefer stored puzzles.",
      inputSchema: z.object({ kind, concept: z.string(), difficulty, brief: z.string().max(800) }),
      execute: async (input, { abortSignal }) => {
        if (input.concept === "boss" && !state().bossUnlocked) return refuse(lockedReason());
        if (input.concept === "boss" && input.kind !== "code") {
          return refuse("A boss is always a code puzzle. Call generate_puzzle again with kind code.");
        }
        if (input.concept !== "boss" && !slugs().includes(input.concept)) return refuse(unknownConcept(input.concept));
        const result = await runGenerator({ ...input, adventureId: ctx.adventureId }, abortSignal);
        if (result.ok && input.concept === "boss") ctx.bossPuzzleIds.add(result.id);
        return result;
      },
    }),
    show_lesson: tool({
      description:
        "Show the lesson for a concept, before its first fight. The player sees it in a tab. Then invite a reply in the same turn.",
      inputSchema: z.object({ concept: z.string() }),
      execute: async ({ concept }) => showLesson(ctx.concepts, { concept }),
    }),
    get_encounter: tool({
      description: "Look up an earlier fight of this run by its encounter id, e.g. when the player asks about it.",
      inputSchema: z.object({ encounterId: z.string().uuid() }),
      execute: async ({ encounterId }) => getEncounterForModel(ctx, encounterId),
    }),
    ask_choice: tool({
      description: "Offer the player 2–4 enemies and wait for the pick. Never for graded questions.",
      // no execute lock check here; list_puzzles/generate_puzzle withhold locked boss ids and present_puzzle re-checks
      inputSchema: z.object({ prompt: z.string(), options: z.array(enemyOption).min(2).max(4) }),
      outputSchema: z.object({ puzzleId: z.string().uuid() }),
    }),
    present_puzzle: tool({
      description:
        "Start the fight the player picked. Returns at once; a later message reports how it ended. One fight at a time.",
      inputSchema: enemyOption,
      execute: async (input) => {
        if (isLockedBoss(input.puzzleId)) return refuse(lockedReason());
        return startEncounter(ctx, input);
      },
    }),
    finish_adventure: tool({
      description: "Call once, after the boss is defeated. Saves a short story summary for the next adventures.",
      inputSchema: z.object({ summary: z.string().max(1000) }),
      execute: async ({ summary }) =>
        state().bossDefeated
          ? finishRun(ctx, summary)
          : refuse("The boss isn't defeated yet. Offer the boss before finishing the adventure."),
    }),
  };
}

// client components must import this with "import type" because this file is server-only
export type GameUIMessage = UIMessage<GameMessageMetadata, never, InferUITools<ReturnType<typeof gameTools>>>;
