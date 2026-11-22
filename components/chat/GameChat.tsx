"use client";

// runs the game master chat and the adventure side panel
// if /api/game returns ai_unavailable or ai_limit, it drops to no-AI mode and uses stored enemies
// their encounter_end summaries get batched and sent once AI is back
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Sword } from "pixelarticons/react";
import { Spinner } from "@/components/ui/8bit/spinner";
import { AdventureScreen, type SidebarInfo } from "@/components/game/AdventureScreen";
import { EnemyChip } from "@/components/game/EnemyCard";
import { EncounterChoice } from "@/components/game/EncounterChoice";
import { InventoryPanel } from "@/components/game/InventoryPanel";
import { LessonView } from "@/components/game/LessonView";
import { NoAiPanel } from "@/components/game/NoAiPanel";
import { LessonChip, type PanelTab } from "@/components/game/SidePanel";
import { stateOf } from "@/components/game/rules";
import { PuzzleView, type FightState } from "@/components/puzzles/PuzzleView";
import { FightError } from "@/components/puzzles/parts";
import { Button } from "@/components/ui/8bit/button";
import { getGameApi } from "@/lib/api";
import { getGameData } from "@/lib/data";
import type { GameUIMessage } from "@/lib/server/ai/game-tools";
import type { Concept, Encounter, Enemy, InventoryEntry, StoredEnemy } from "@/lib/types";
import { ChatInput } from "./ChatInput";
import { Markdown } from "./Markdown";
import { EventLine, GmMessage, PlayerMessage } from "./messages";

type ActiveFight = { encounterId: string; puzzleId: string; enemy: Enemy };
type AiDown = "ai_unavailable" | "ai_limit";
const SCROLL = "scroll-of-remembering";

type Props = {
  runId: string;
  trackId: string;
  concepts: Concept[];
  initialMessages: GameUIMessage[];
  initialInventory: InventoryEntry[];
  initialEncounters: Encounter[];
  sidebar: Omit<SidebarInfo, "inventory" | "state">;
  /** called when XP changes so the page can reload the level bar */
  onProgress: () => void;
};

export function GameChat({ runId, trackId, concepts, initialMessages, initialInventory, initialEncounters, sidebar, onProgress }: Props) {
  const [inventory, setInventory] = useState(initialInventory);
  const [encounters, setEncounters] = useState(initialEncounters);
  const [openLessons, setOpenLessons] = useState<string[]>(() => lessonsGiven(initialMessages)); // concept slugs
  const [scrollMode, setScrollMode] = useState(false);
  const [aiDown, setAiDown] = useState<AiDown | null>(null);
  const [turnFailed, setTurnFailed] = useState(false); // our own error, not an outage: offer a retry, stay online
  const [offers, setOffers] = useState<StoredEnemy[]>([]);
  // no-AI mode tracks browser-started fights and queues their summaries until AI returns
  const [offlineFight, setOfflineFight] = useState<ActiveFight | null>(null);
  const [pendingEnds, setPendingEnds] = useState<{ encounterId: string; summary: string }[]>([]);
  const [endedLocally, setEndedLocally] = useState<ReadonlySet<string>>(new Set());
  // a fight that just ended stays in its tab, showing the result, until the tab is closed or another fight starts
  const [recentlyEnded, setRecentlyEnded] = useState<ActiveFight | null>(null);
  const fight = useRef<FightState>({ code: null, lastResults: null }); // current code and results for hints
  const pendingHint = useRef<{ encounterId: string; kind: "basic" | "scroll" } | null>(null);
  const [transport] = useState(() => new DefaultChatTransport<GameUIMessage>({ api: "/api/game" }));

  function refreshInventory() {
    void getGameData().getInventory().then(setInventory).catch(() => {});
  }
  function refreshEncounters() {
    void getGameData().listEncounters(runId).then(setEncounters).catch(() => {});
  }
  function goOffline(reason: AiDown) {
    setAiDown(reason);
    setScrollMode(false);
    refreshEncounters();
    getGameApi()
      .offers(runId)
      .then(setOffers, () => setOffers([]));
  }

  const { messages, sendMessage, addToolOutput, status, regenerate } = useChat<GameUIMessage>({
    id: runId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // "ai_unavailable" comes from a stream error or a 503 body, "ai_limit" from a 429 body
    onError: (error) => {
      if (error.message.includes("ai_limit")) goOffline("ai_limit");
      else if (error.message.includes("ai_unavailable")) goOffline("ai_unavailable");
      else setTurnFailed(true);
    },
    onFinish: async ({ isError, isAbort, isDisconnect }) => {
      const hint = pendingHint.current;
      pendingHint.current = null;
      if (!hint || isError || isAbort || isDisconnect) return; // a failed turn doesn't spend the hint
      if (hint.kind === "basic") {
        await getGameData().recordHint(hint.encounterId);
      } else {
        await getGameData().consumeItem(SCROLL);
        setInventory((entries) => takeOne(entries, SCROLL));
      }
    },
  });

  // ask the game master to open a fresh run
  const started = useRef(false);
  useEffect(() => {
    if (initialMessages.length > 0 || started.current) return;
    started.current = true;
    void sendMessage({ text: "Begin the adventure.", metadata: { action: "start" } });
  }, [initialMessages.length, sendMessage]);

  const active = offlineFight ?? findActiveEncounter(messages, endedLocally);
  const shownFight = active ?? recentlyEnded;
  const latestLesson = findLatestLesson(messages);
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  const waitingForChoice =
    last?.role === "assistant" && last.parts.some((p) => p.type === "tool-ask_choice" && p.state === "input-available");

  // sync active tab during render so new fights and lessons open on the same frame
  const [activeTab, setActiveTab] = useState(() => (active ? "fight" : (latestLesson?.concept ?? "chat")));
  const [seenFight, setSeenFight] = useState(active?.encounterId ?? null);
  if ((active?.encounterId ?? null) !== seenFight) {
    setSeenFight(active?.encounterId ?? null);
    if (active) setActiveTab("fight");
  }
  const [seenLesson, setSeenLesson] = useState(latestLesson?.toolCallId ?? null);
  if (latestLesson && latestLesson.toolCallId !== seenLesson) {
    setSeenLesson(latestLesson.toolCallId);
    openLesson(latestLesson.concept);
  }

  function openLesson(slug: string) {
    setOpenLessons((tabs) => (tabs.includes(slug) ? tabs : [...tabs, slug]));
    setActiveTab(slug);
  }

  function closeTab(id: string) {
    if (id === "fight") setRecentlyEnded(null);
    const lessons = openLessons.filter((s) => s !== id);
    setOpenLessons(lessons);
    if (activeTab === id) setActiveTab(id !== "fight" && shownFight ? "fight" : (lessons.at(-1) ?? "chat"));
  }

  function askHint(kind: "basic" | "scroll", question = "") {
    if (!active || aiDown) return;
    pendingHint.current = { encounterId: active.encounterId, kind };
    const code = fight.current.code?.slice(0, 20_000) ?? null;
    const { lastResults } = fight.current; // attached for this turn only
    void sendMessage(
      kind === "basic"
        ? { text: "I'd like a hint.", metadata: { action: "basic_hint", code, lastResults } }
        : { text: question, metadata: { action: "scroll", question, code, lastResults } },
    );
  }

  function endFight(ended: ActiveFight, summary: string, dismiss = false) {
    fight.current = { code: null, lastResults: null };
    setEndedLocally((s) => new Set(s).add(ended.encounterId));
    setOfflineFight((f) => (f?.encounterId === ended.encounterId ? null : f));
    setRecentlyEnded(dismiss ? null : ended);
    refreshEncounters();
    const text = summary.slice(0, 600);
    if (aiDown) {
      setPendingEnds((ends) => [...ends, { encounterId: ended.encounterId, summary: text }]);
    } else {
      void sendMessage({ text, metadata: { action: "encounter_end", encounterIds: [ended.encounterId], summary: text } });
    }
  }

  // leave no-AI mode and flush any offline fight summaries in one encounter_end message
  function retry() {
    setAiDown(null);
    if (pendingEnds.length > 0) {
      const summary = `While you were away: ${pendingEnds.map((e) => e.summary.charAt(0).toLowerCase() + e.summary.slice(1)).join(", ")}`.slice(0, 600);
      const encounterIds = pendingEnds.map((e) => e.encounterId);
      setPendingEnds([]);
      void sendMessage({ text: summary, metadata: { action: "encounter_end", encounterIds, summary } });
    } else if (messages.at(-1)?.role === "user") {
      void regenerate(); // retry the failed request
    }
  }

  async function fightStored(enemy: StoredEnemy) {
    if (active) return;
    // without AI to call present_puzzle, create the encounter directly from the browser
    const encounter = await getGameData().startEncounter({
      runId,
      puzzleId: enemy.puzzleId,
      enemy: { name: enemy.name, sprite: enemy.sprite, color: enemy.color },
      isBoss: enemy.isBoss,
    });
    setOfflineFight({ encounterId: encounter.id, puzzleId: enemy.puzzleId, enemy: encounter.enemy });
    setOffers((list) => list.filter((o) => o.puzzleId !== enemy.puzzleId));
  }

  const conceptName = (slug: string) => concepts.find((c) => c.slug === slug)?.name ?? slug;
  const state = stateOf(concepts, encounters);

  const tabs: PanelTab[] = [
    ...(shownFight ? [{ id: "fight", label: "Fight", icon: <Sword width={14} height={14} />, closable: !active }] : []),
    ...openLessons.map((slug) => ({ id: slug, label: conceptName(slug), closable: true })),
  ];

  function renderTab(id: string): ReactNode {
    if (id === "fight" && shownFight) {
      const current = shownFight;
      return (
        <PuzzleView
          key={current.encounterId}
          encounterId={current.encounterId}
          puzzleId={current.puzzleId}
          enemy={current.enemy}
          trackId={trackId}
          live={active?.encounterId === current.encounterId}
          onFightState={(s) => (fight.current = s)}
          onEnd={(summary, options) => endFight(current, summary, options?.dismiss)}
          onRewards={() => {
            refreshInventory();
            onProgress();
          }}
        />
      );
    }
    const concept = concepts.find((c) => c.slug === id);
    return concept ? <LessonView key={concept.slug} concept={concept} /> : null;
  }

  const lastLessonPart = last?.role === "assistant" ? findLatestLesson([last]) : undefined;
  const placeholder = lastLessonPart && !active ? `Ask about ${conceptName(lastLessonPart.concept).toLowerCase()}…` : undefined;

  const chat = (
    <>
      <ChatLog messages={messages} working={busy} onOpenLesson={openLesson} onChoose={(toolCallId, puzzleId) => void addToolOutput({ tool: "ask_choice", toolCallId, output: { puzzleId } })} />
      {status === "submitted" && last?.role !== "assistant" && <GmMessage thinking />}
      {turnFailed && status === "error" && (
        <FightError>
          Something went wrong. Try again in a moment.{" "}
          <Button variant="outline" size="sm" className="ml-2 text-[9px]" onClick={() => { setTurnFailed(false); void regenerate(); }}>
            Try again
          </Button>
        </FightError>
      )}
      {aiDown && (
        <NoAiPanel
          reason={aiDown}
          lessons={concepts}
          enemies={offers}
          state={state}
          onOpenLesson={openLesson}
          onFight={(enemy) => void fightStored(enemy)}
          onRetry={retry}
        />
      )}
    </>
  );

  // chat input stays disabled during a fight unless using a Scroll of Remembering
  const composer = (
    <ChatInput
      disabled={busy || !!waitingForChoice || !!aiDown || (!!active && !scrollMode)}
      scrollMode={scrollMode ? { onCancel: () => setScrollMode(false) } : undefined}
      placeholder={placeholder}
      onSend={(text) => {
        if (scrollMode) {
          setScrollMode(false);
          askHint("scroll", text);
        } else {
          void sendMessage({ text });
        }
      }}
    />
  );

  return (
    <AdventureScreen
      sidebar={{
        ...sidebar,
        state,
        inventory: (
          <InventoryPanel
            entries={inventory}
            inFight={!!active && !busy}
            aiDown={!!aiDown}
            onUse={(slug) => (slug === "hint" ? askHint("basic") : setScrollMode(true))}
          />
        ),
      }}
      chat={chat}
      chatWidth={aiDown ? "max-w-[900px]" : undefined}
      composer={composer}
      scrollKey={`${messages.length}:${lastLength(messages)}:${status}:${aiDown}`}
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onCloseTab={closeTab}
      renderTab={renderTab}
    />
  );
}

// ask_choice options don't say which enemy is the boss
// earlier list_puzzles and generate_puzzle results carry each puzzle's concept, so read it from there
function bossPuzzleIds(messages: GameUIMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === "tool-list_puzzles" && p.state === "output-available" && p.output.ok) {
        for (const puzzle of p.output.puzzles) if (puzzle.concept === "boss") ids.add(puzzle.id);
      }
      if (p.type === "tool-generate_puzzle" && p.state === "output-available" && p.output.ok && p.input.concept === "boss") {
        ids.add(p.output.id);
      }
    }
  }
  return ids;
}

/** omit onChoose for read-only mode on completed adventures */
export function ChatLog({
  messages,
  working = false,
  onOpenLesson,
  onChoose,
}: {
  messages: GameUIMessage[];
  working?: boolean;
  onOpenLesson?: (slug: string) => void;
  onChoose?: (toolCallId: string, puzzleId: string) => void;
}) {
  const bossIds = bossPuzzleIds(messages);
  return (
    <>
      {messages.map((m, index) => {
        if (m.role === "user") {
          const meta = m.metadata;
          if (meta?.action === "start") return null;
          if (meta?.action === "encounter_end") {
            const good = /^(defeated|while you were away)/i.test(meta.summary);
            return (
              <EventLine key={m.id} tone={good ? "ok" : "muted"}>
                {meta.summary}
              </EventLine>
            );
          }
          if (meta?.action === "basic_hint") return <PlayerMessage key={m.id}>Used a hint</PlayerMessage>;
          const text = m.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("\n");
          return text ? <PlayerMessage key={m.id}>{text}</PlayerMessage> : null;
        }
        if (m.role !== "assistant") return null;
        const items = m.parts.map((part, i): ReactNode => {
          switch (part.type) {
            case "text":
              return part.text.trim() ? <Markdown key={i}>{part.text}</Markdown> : null;
            case "tool-generate_puzzle":
              return part.state === "input-streaming" || part.state === "input-available" ? (
                <p key={part.toolCallId} className="retro flex items-center gap-3 text-[10px] text-muted-foreground">
                  <Spinner variant="diamond" className="size-4 text-primary" />
                  The dungeon shifts…
                </p>
              ) : null;
            case "tool-show_lesson":
              return part.state === "output-available" && part.output.ok ? (
                <LessonChip
                  key={part.toolCallId}
                  name={part.output.name}
                  onOpen={onOpenLesson && (() => onOpenLesson(part.output.ok ? part.output.concept : ""))}
                />
              ) : null;
            case "tool-ask_choice":
              return part.state === "input-available" && onChoose ? (
                <EncounterChoice
                  key={part.toolCallId}
                  prompt={part.input.prompt}
                  options={part.input.options}
                  bossIds={bossIds}
                  onChoose={(puzzleId) => onChoose(part.toolCallId, puzzleId)}
                />
              ) : null;
            case "tool-present_puzzle":
              return part.state === "output-available" && part.output.ok ? (
                <EnemyChip key={part.toolCallId} enemy={part.input} puzzleId={part.input.puzzleId} />
              ) : null;
            default:
              return null;
          }
        });
        // keep the live reply mounted so the game master doesn't vanish while thinking or calling tools
        const live = working && index === messages.length - 1;
        if (!items.some(Boolean) && !live) return null;
        // "The dungeon shifts…" already has its own spinner
        const generating = m.parts.some((p) => p.type === "tool-generate_puzzle" && (p.state === "input-streaming" || p.state === "input-available"));
        return <GmMessage key={m.id} thinking={live && !generating}>{items}</GmMessage>;
      })}
    </>
  );
}

// the newest started encounter, unless an encounter_end message came later or it already ended locally
function findActiveEncounter(messages: GameUIMessage[], endedLocally: ReadonlySet<string>): ActiveFight | null {
  const ended = new Set(messages.flatMap((m) => (m.metadata?.action === "encounter_end" ? m.metadata.encounterIds : [])));
  for (const m of [...messages].reverse()) {
    for (const p of [...m.parts].reverse()) {
      if (p.type === "tool-present_puzzle" && p.state === "output-available" && p.output.ok) {
        const id = p.output.encounterId;
        if (ended.has(id) || endedLocally.has(id)) return null;
        const { puzzleId, name, sprite, color } = p.input;
        return { encounterId: id, puzzleId, enemy: { name, sprite, color } };
      }
    }
  }
  return null;
}

function showLessonResults(messages: GameUIMessage[]) {
  return messages.flatMap((m) =>
    m.parts.flatMap((p) =>
      p.type === "tool-show_lesson" && p.state === "output-available" && p.output.ok
        ? [{ toolCallId: p.toolCallId, concept: p.output.concept }]
        : [],
    ),
  );
}
const lessonsGiven = (messages: GameUIMessage[]) => [...new Set(showLessonResults(messages).map((r) => r.concept))];
const findLatestLesson = (messages: GameUIMessage[]) => showLessonResults(messages).at(-1);

function lastLength(messages: GameUIMessage[]): number {
  const last = messages.at(-1);
  return last ? last.parts.reduce((n, p) => n + (p.type === "text" ? p.text.length : 1), 0) : 0;
}

function takeOne(entries: InventoryEntry[], slug: string): InventoryEntry[] {
  return entries.map((e) => (e.item.slug === slug ? { ...e, quantity: e.quantity - 1 } : e)).filter((e) => e.quantity > 0);
}
