export type Language = "javascript" | "python";
export type PuzzleKind = "mcq" | "short" | "code";

export type TrackStatus = "active" | "coming_soon" | "disabled";
export interface Track { id: string; slug: string; title: string; language: Language; description: string; status: TrackStatus }
// stored in adventures.concepts
// lesson is Markdown loaded from content/lessons/<slug>.md
export interface Concept { slug: string; name: string; description: string; lesson: string }
export interface Adventure {
  id: string; trackId: string; slug: string; title: string; summary: string;
  sortOrder: number; concepts: Concept[];
}
export type AdventureStatus = "locked" | "available" | "in_progress" | "completed";
export interface AdventureWithProgress extends Adventure { status: AdventureStatus }
export interface AdventureRun {
  id: string; adventureId: string; status: "in_progress" | "completed"; storySummary: string | null;
  messages: unknown[]; // the saved chat; GameChat treats it as GameUIMessage[]
}
export interface TrackProgress { trackId: string; xp: number } // level is derived via levelForXp(xp)

// name is at most 80 characters and describes the case without revealing the expected value
export interface TestCase { name: string; code: string }

// player-safe puzzle shape without answers or hidden tests
export type PlayerPuzzle =
  | { id: string; kind: "mcq"; title: string; difficulty: number; question: string; options: string[] }
  | { id: string; kind: "short"; title: string; difficulty: number; question: string; maxLength: number }
  | {
      id: string; kind: "code"; title: string; difficulty: number; language: Language; starterCode: string;
      sampleTests: TestCase[];
      hiddenTestCount: number; // also the enemy's max HP
    };

export interface TestResult { name: string; passed: boolean; error?: string }
// limit means daily runs exhausted; busy means the sandbox pool is full
export type RunStatus = "ok" | "syntax_error" | "runtime_error" | "timeout" | "memory" | "internal_error" | "limit" | "busy";
export interface RunResult { status: RunStatus; tests: TestResult[]; stdout: string; message?: string; durationMs: number }
export interface GradeResult {
  passed: boolean;
  feedback: string;
  // code puzzles only; hiddenTests holds pass/fail booleans without names or errors
  hiddenTests?: boolean[];
  status?: RunStatus;
  stdout?: string;
  message?: string;
  // MCQ only; shown after a wrong answer
  correctIndex?: number;
  explanation?: string;
}

// sprite is a slug from content/sprites.ts, with a fallback for unknown ones; color is "#RRGGBB"
export interface Enemy { name: string; sprite: string; color: string }
export interface EnemyOption extends Enemy { puzzleId: string }
export type EncounterStatus = "active" | "defeated" | "fled" | "lost";
export interface Encounter {
  id: string; runId: string; puzzleId: string;
  concept: string; kind: PuzzleKind; // boss puzzles use concept "boss"
  enemy: Enemy; isBoss: boolean; status: EncounterStatus;
  basicHints: number; xpAwarded: number;
}

// stored enemy offered in no-AI mode
export interface StoredEnemy extends EnemyOption {
  concept: string; kind: "mcq" | "code"; difficulty: number; title: string;
  hiddenTestCount: number; // 1 for an MCQ
  isBoss: boolean;
}

// plus and minus are the benefit and cost lines in the item popover
export interface Item { slug: string; name: string; plus: string[]; minus: string }
export interface InventoryEntry { item: Item; quantity: number }

export type Theme = "fantasy" | "scifi" | "pirates" | "cyberpunk" | "plain";
export type EditorTheme = "tokyo-night" | "dracula" | "github-dark" | "nord" | "github-light";
export interface Preferences {
  theme: Theme;
  story: "none" | "short" | "rich";
  difficulty: "gentle" | "normal" | "brutal";
  explanations: "short" | "step_by_step" | "analogies";
  note: string; // up to 300 characters
  editorTheme: EditorTheme; // UI only, never sent to the AI
}
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "fantasy", story: "short", difficulty: "normal", explanations: "short", note: "", editorTheme: "tokyo-night",
};

export type Trend = "up" | "down" | "flat";
export interface ProgressStats { // progress page (T-26)
  tracks: { trackId: string; title: string; xp: number; completedAdventures: number; totalAdventures: number }[];
  // trend is null under 10 fights
  concepts: { slug: string; name: string; fights: number; won: number; trend: Trend | null }[];
}
