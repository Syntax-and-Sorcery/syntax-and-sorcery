"use client";

// coordinates submit, flee, and report for all puzzle kinds, then passes a one-line encounter_end summary to onEnd
import { useRef, useState } from "react";
import { toast } from "@/components/ui/8bit/toast";
import { clearDraft } from "@/components/editor/useDraft";
import { lootFor, xpFor } from "@/components/game/rules";
import { levelForXp } from "@/lib/rules/levels";
import { getGameApi } from "@/lib/api";
import { getGameData } from "@/lib/data";
import type { Enemy, GradeResult, PlayerPuzzle, RunResult } from "@/lib/types";

// matches the server's lastResultsSchema; sent with hint and scroll requests
export type LastResults = {
  source: "run" | "submit";
  status: "ok" | "syntax_error" | "runtime_error" | "timeout" | "memory" | "internal_error";
  sampleTests?: { name: string; passed: boolean; error?: string }[];
  hiddenFailed?: number;
  message?: string;
} | null;
export type FightState = { code: string | null; lastResults: LastResults };

export type Outcome =
  | { type: "won"; xp: number; items: string[] }
  | { type: "lost"; chosen: string; correctIndex?: number; explanation?: string }
  | { type: "fled" };

export interface FightProps {
  encounterId: string;
  enemy: Enemy;
  trackId: string;
  onEnd: (summary: string, options?: { dismiss?: boolean }) => void;
  /** called when XP or inventory changes so the page can reload them */
  onRewards: () => void;
}

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "scroll-of-remembering" → "Scroll of Remembering" */
export function itemName(slug: string): string {
  return slug
    .split("-")
    .map((w) => (["of", "the", "and"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
function foundList(items: string[]): string {
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts].map(([slug, n]) => (n === 1 ? `a ${itemName(slug)}` : `${n} × ${itemName(slug)}`)).join(" and ");
}

export function lastResultsOf(source: "run" | "submit", r: RunResult | GradeResult): LastResults {
  // skip "limit" and "busy" because the code never ran
  if (!r.status || r.status === "limit" || r.status === "busy") return null;
  return {
    source,
    status: r.status,
    sampleTests: "tests" in r ? r.tests.map((t) => ({ name: t.name, passed: t.passed, error: t.error?.slice(0, 300) })) : undefined,
    hiddenFailed: "hiddenTests" in r && r.hiddenTests ? r.hiddenTests.filter((p) => !p).length : undefined,
    message: r.message?.slice(0, 500),
  };
}

export function useFight(puzzle: PlayerPuzzle, { encounterId, enemy, trackId, onEnd, onRewards }: FightProps) {
  const max = puzzle.kind === "code" ? puzzle.hiddenTestCount : 1;
  const [hp, setHp] = useState(max);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const submits = useRef(0);

  async function win(answer: string, result: GradeResult) {
    const data = getGameData();
    const encounter = await data.getEncounter(encounterId); // reload to get current hint count
    const before = (await data.getTrackProgress(trackId))?.xp ?? 0;
    const xp = xpFor({ kind: puzzle.kind, difficulty: puzzle.difficulty, isBoss: encounter.isBoss, basicHintsUsed: encounter.basicHints }) ?? 0;
    const items = lootFor({ isBoss: encounter.isBoss, difficulty: puzzle.difficulty }, before, before + xp);
    const settled = await data.settleEncounter({ encounterId, answer, result, xp, items });
    clearDraft(encounterId);
    setHp(0);
    setOutcome({ type: "won", xp: settled ? xp : 0, items: settled ? items : [] });
    if (settled) {
      const [from, to] = [levelForXp(before), levelForXp(before + xp)];
      if (to > from) {
        const scrolls = items.filter((i) => i === "scroll-of-remembering").length;
        toast(scrolls > 0 ? `Level ${to}! +${scrolls} Scroll${scrolls === 1 ? "" : "s"} of Remembering` : `Level ${to}!`);
      }
      onRewards();
    }
    const parts = [`Defeated ${enemy.name} on the ${ordinal(submits.current)} Submit`];
    if (encounter.basicHints > 0) parts.push(plural(encounter.basicHints, "basic hint"));
    if (settled && items.length > 0) parts.push(`found ${foundList(items)}`);
    onEnd(`${parts.join(", ")}. +${settled ? xp : 0} XP`);
  }

  /** returns the result, or throws without saving if the request fails */
  async function submit(answer: string): Promise<GradeResult> {
    setBusy(true);
    try {
      const result = await getGameApi().grade(puzzle.id, answer);
      // code never ran on limit or busy, so skip recording an attempt
      if (result.status === "limit" || result.status === "busy") return result;
      submits.current += 1;
      const data = getGameData();
      if (result.passed) {
        await win(answer, result);
      } else if (puzzle.kind === "mcq") {
        await data.recordAttempt({ encounterId, answer, result });
        await data.loseEncounter(encounterId);
        setOutcome({ type: "lost", chosen: answer, correctIndex: result.correctIndex, explanation: result.explanation });
        onEnd(`Lost to ${enemy.name}: wrong answer`);
      } else {
        await data.recordAttempt({ encounterId, answer, result });
        if (result.hiddenTests) {
          const failed = result.hiddenTests.filter((p) => !p).length;
          setHp((h) => Math.min(h, failed)); // enemy HP never heals
        }
      }
      return result;
    } finally {
      setBusy(false);
    }
  }

  async function flee() {
    setBusy(true);
    try {
      await getGameData().fleeEncounter(encounterId);
      clearDraft(encounterId);
      setOutcome({ type: "fled" });
      const n = submits.current;
      onEnd(n > 0 ? `Fled from ${enemy.name} after ${plural(n, "Submit")}` : `Fled from ${enemy.name}`, { dismiss: true });
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    await getGameData().reportPuzzle(puzzle.id); // reporting doesn't end the fight
  }

  return { hp, max, outcome, busy, submit, flee, report };
}
