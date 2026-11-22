import type {
  AdventureRun, AdventureWithProgress, Encounter, Enemy, GradeResult, InventoryEntry, PlayerPuzzle, Preferences,
  ProgressStats, Track, TrackProgress,
} from "@/lib/types";
import { mockGameData } from "./mock";
import { supabaseGameData } from "./supabase";

export interface GameData {
  listTracks(): Promise<Track[]>;
  listAdventures(trackId: string): Promise<AdventureWithProgress[]>;
  getTrackProgress(trackId: string): Promise<TrackProgress | null>; // null: not enrolled in this track
  enroll(trackId: string): Promise<TrackProgress>;
  getOrStartRun(adventureId: string): Promise<AdventureRun>;
  listEncounters(runId: string): Promise<Encounter[]>;
  getEncounter(encounterId: string): Promise<Encounter>;
  startEncounter(input: { runId: string; puzzleId: string; enemy: Enemy; isBoss: boolean }): Promise<Encounter>;
  getPuzzle(puzzleId: string): Promise<PlayerPuzzle>;
  getInventory(): Promise<InventoryEntry[]>;
  recordAttempt(input: { encounterId: string; answer: string; result: GradeResult }): Promise<void>;
  recordHint(encounterId: string): Promise<void>;
  settleEncounter(input: {
    encounterId: string; answer: string; result: GradeResult; xp: number; items: string[];
  }): Promise<boolean>;
  fleeEncounter(encounterId: string): Promise<boolean>;
  loseEncounter(encounterId: string): Promise<boolean>;
  consumeItem(itemSlug: string): Promise<void>;
  getProgressStats(trackId: string): Promise<ProgressStats>;
  reportPuzzle(puzzleId: string): Promise<boolean>;
  getPreferences(): Promise<Preferences>;
  updatePreferences(preferences: Preferences): Promise<void>;
}

// NEXT_PUBLIC_DATA_SOURCE is inlined at build time
export function getGameData(): GameData {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "mock" ? mockGameData : supabaseGameData;
}
