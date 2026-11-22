// formats profiles.preferences for prompts
// game master includes the note; judge omits it; generator omits preferences
import "server-only";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/types";

const LABELS = {
  theme: { fantasy: "fantasy", scifi: "sci-fi", pirates: "pirates", cyberpunk: "cyberpunk", plain: "plain (no theme)" },
  story: { none: "none", short: "short", rich: "rich" },
  difficulty: { gentle: "gentle", normal: "normal", brutal: "brutal" },
  explanations: { short: "short", step_by_step: "step by step", analogies: "with analogies" },
} as const;

// editorTheme only affects the UI and is never sent to the model
export function buildPreferenceString(p: Preferences, { includeNote }: { includeNote: boolean }): string {
  const parts = [
    `Theme: ${LABELS.theme[p.theme]}.`,
    `Story: ${LABELS.story[p.story]}.`,
    `Difficulty: ${LABELS.difficulty[p.difficulty]}.`,
    `Explanations: ${LABELS.explanations[p.explanations]}.`,
  ];
  const note = p.note.trim().slice(0, 300);
  if (includeNote && note) parts.push(`Note from the player: ${note}`);
  return parts.join(" ");
}

// profiles.preferences starts as {}, so fill missing or invalid keys from DEFAULT_PREFERENCES
export function withDefaults(raw: unknown): Preferences {
  const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pick = <K extends keyof typeof LABELS>(key: K): Preferences[K] =>
    typeof p[key] === "string" && p[key] in LABELS[key] ? (p[key] as Preferences[K]) : DEFAULT_PREFERENCES[key];
  return {
    theme: pick("theme"),
    story: pick("story"),
    difficulty: pick("difficulty"),
    explanations: pick("explanations"),
    note: typeof p.note === "string" ? p.note : DEFAULT_PREFERENCES.note,
    editorTheme: typeof p.editorTheme === "string" ? (p.editorTheme as Preferences["editorTheme"]) : DEFAULT_PREFERENCES.editorTheme,
  };
}
