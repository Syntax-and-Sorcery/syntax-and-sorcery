"use client";

// caches player-safe puzzles per page load so enemy cards, chips, and fights share one fetch
import { useEffect, useState } from "react";
import { getGameData } from "@/lib/data";
import type { PlayerPuzzle } from "@/lib/types";

const cache = new Map<string, Promise<PlayerPuzzle>>();

export function loadPuzzle(puzzleId: string): Promise<PlayerPuzzle> {
  let found = cache.get(puzzleId);
  if (!found) {
    found = getGameData().getPuzzle(puzzleId);
    found.catch(() => cache.delete(puzzleId)); // drop failed loads so callers can retry
    cache.set(puzzleId, found);
  }
  return found;
}

export function usePuzzle(puzzleId: string): { puzzle: PlayerPuzzle | null; error: boolean } {
  const [state, setState] = useState<{ id: string; puzzle: PlayerPuzzle | null; error: boolean }>({
    id: puzzleId,
    puzzle: null,
    error: false,
  });
  useEffect(() => {
    let cancelled = false;
    loadPuzzle(puzzleId).then(
      (puzzle) => !cancelled && setState({ id: puzzleId, puzzle, error: false }),
      () => !cancelled && setState({ id: puzzleId, puzzle: null, error: true }),
    );
    return () => {
      cancelled = true;
    };
  }, [puzzleId]);
  return state.id === puzzleId ? state : { puzzle: null, error: false };
}

export function maxHp(puzzle: PlayerPuzzle): number {
  return puzzle.kind === "code" ? puzzle.hiddenTestCount : 1;
}

export const KIND_LABEL: Record<PlayerPuzzle["kind"], string> = {
  mcq: "Multiple choice",
  short: "Short answer",
  code: "Code",
};
