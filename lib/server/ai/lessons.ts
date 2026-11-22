import "server-only";
import type { Concept } from "@/lib/types";
import { refuse, type Refusal } from "./refuse";

export type ShowLessonResult = { ok: true; concept: string; name: string; lesson: string };

// what the show_lesson tool runs
// unknown slugs get a refusal listing the real ones, so the model can retry
export function showLesson(concepts: Concept[], input: { concept: string }): ShowLessonResult | Refusal {
  const found = concepts.find((c) => c.slug === input.concept);
  if (!found) {
    return refuse(`"${input.concept}" isn't a concept of this adventure. Use one of: ${concepts.map((c) => c.slug).join(", ")}.`);
  }
  return { ok: true, concept: found.slug, name: found.name, lesson: found.lesson };
}
