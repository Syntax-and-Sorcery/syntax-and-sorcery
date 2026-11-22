// streams the game master conversation in AI SDK UI message format for GameChat
import { anthropic } from "@ai-sdk/anthropic";
import {
  APICallError, consumeStream, convertToModelMessages, createIdGenerator, createUIMessageStreamResponse, isStepCount,
  RetryError, streamText, toUIMessageStream, validateUIMessages,
} from "ai";
import { after } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { logEvent } from "@/lib/server/events";
import { bumpUsage } from "@/lib/server/usage";
import { saveRunMessages } from "@/lib/server/runs";
import { aiDown } from "@/lib/server/ai/judge";
import { gameMessageMetadataSchema, gameTools, type GameUIMessage } from "@/lib/server/ai/game-tools";
import { buildGameMasterInstructions, loadGameContext, RunNotFoundError } from "@/lib/server/ai/context";

// generate_puzzle can take 15 to 40s for a code puzzle
// 300s is Vercel Hobby's max
export const maxDuration = 300;

// DefaultChatTransport sends the run id as the chat id along with the full message list
const bodySchema = z.object({ id: z.string().uuid(), messages: z.array(z.unknown()) });

export async function POST(req: Request) {
  // mock mode has no game master, so the page falls back to no-AI mode with the mock offers
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "mock") return Response.json({ error: "ai_unavailable" }, { status: 503 });
  const user = await requireUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Expected { id, messages }" }, { status: 400 });
  const { id: runId, messages } = body.data;

  // 503 ai_unavailable and 429 ai_limit both switch the adventure page to no-AI mode
  // AI_DOWN=1 stands in for an outage, so it leaves the same ai_failure row a real one would
  if (aiDown()) {
    await logEvent("ai_failure", { route: "game", runId, message: "AI_DOWN=1" }, user.id);
    return Response.json({ error: "ai_unavailable" }, { status: 503 });
  }

  let context;
  try {
    context = await loadGameContext(user, runId); // loads as this player, so another user's run returns 404
  } catch (error) {
    if (error instanceof RunNotFoundError) return Response.json({ error: "No such run" }, { status: 404 });
    throw error;
  }
  const tools = gameTools(context);
  let validated: GameUIMessage[];
  try {
    validated = await validateUIMessages<GameUIMessage>({
      messages,
      tools,
      // assistant messages and plain user questions carry no metadata
      metadataSchema: gameMessageMetadataSchema.optional(),
    });
  } catch {
    return Response.json({ error: "The messages don't match the game's format" }, { status: 400 });
  }

  // count usage only after validation passes, right before calling the model
  if (!(await bumpUsage(user.id, "ai"))) return Response.json({ error: "ai_limit" }, { status: 429 });

  const last = validated.at(-1);
  const action = last?.role === "user" ? last.metadata : undefined;

  const result = streamText({
    model: anthropic("claude-haiku-5-5"),
    instructions: await buildGameMasterInstructions(context, { action, messages: validated }),
    messages: await convertToModelMessages(validated, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: isStepCount(8),
    // the system prompt changes every turn, which voids earlier thinking blocks
    // drop those instead of letting Anthropic reject the whole request
    providerOptions: { anthropic: { thinking: { type: "adaptive", blockBinding: { prefixMismatchBehavior: "drop_block" } } } },
    // log here rather than in the browser's stream, which stops seeing errors once the player leaves
    onError: ({ error }) => void logEvent("ai_failure", { route: "game", runId, message: String(error) }, user.id),
  });

  // the browser and the save each read their own copy of the stream, so the turn runs to the end even if the player leaves
  // both need the same message id, or the saved message wouldn't match the one the browser has
  const messageId = createIdGenerator({ prefix: "msg", size: 16 })();
  const streamOptions = {
    tools,
    originalMessages: validated,
    generateMessageId: () => messageId,
    // the chat drops to no-AI mode only on "ai_unavailable", so only a real outage gets that string
    onError: (error: unknown) => (isOutage(error) ? "ai_unavailable" : "game_error"),
    // keep tool error messages unredacted so the model can read them on the next step
    redactToolErrors: false,
  };

  const saveStream = toUIMessageStream<typeof tools, GameUIMessage>({
    ...streamOptions,
    stream: result.stream,
    onEnd: async ({ messages, outcome, finishReason }) => {
      // a mid-stream error still ends as "completed", so the finish reason has to be checked too
      // skipping a failed turn means a reload retries it, and a failed opening doesn't leave a blank chat that never restarts
      if (outcome.status !== "completed" || finishReason === "error") return;
      try {
        await saveRunMessages(context, messages); // only writer to adventure_runs.messages
      } catch (error) {
        console.error("Saving the conversation failed", error); // the browser still has it; the next turn saves again
      }
    },
  });
  after(consumeStream({ stream: saveStream })); // keeps the function alive on Vercel until the turn is done and saved

  return createUIMessageStreamResponse({
    stream: toUIMessageStream<typeof tools, GameUIMessage>({ ...streamOptions, stream: result.stream }),
  });
}

// overloaded, rate limited, a server error or no answer at all; anything else is our bug
function isOutage(error: unknown): boolean {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (!APICallError.isInstance(cause)) return false;
  return cause.statusCode === undefined || cause.statusCode === 429 || cause.statusCode >= 500;
}
