// run with npm run seed to load tracks, adventures, lessons, and puzzles into Supabase
// safe to re-run
// makes its own Supabase client since lib/server/admin.ts imports server-only, which throws outside Next
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import type { Concept } from "../lib/types";
import * as trackOutlines from "../content/javascript-track";
import { javascriptTrack, type TrackOutline } from "../content/javascript-track";
import { seedPuzzles } from "../content/seed-puzzles";
import type { SeedPuzzle } from "../content/seed-puzzles/types";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// collect every TrackOutline exported from content/javascript-track.ts, JavaScript first (T-07)
const isOutline = (value: unknown): value is TrackOutline =>
  typeof value === "object" && value !== null && "slug" in value && "adventures" in value;
const outlines: TrackOutline[] = [
  javascriptTrack,
  ...Object.values(trackOutlines).filter(isOutline).filter((t) => t !== javascriptTrack),
];

// throws if a concept has no lesson file, so a missing lesson stops the seed
function withLessons(concepts: Omit<Concept, "lesson">[]): Promise<Concept[]> {
  return Promise.all(
    concepts.map(async (c) => ({ ...c, lesson: await readFile(`content/lessons/${c.slug}.md`, "utf8") })),
  );
}

// splits a seed puzzle into the visible `content` and the hidden `answer` columns
function puzzleRow(p: SeedPuzzle, adventureId: string) {
  const base = {
    adventure_id: adventureId, concept: p.concept, kind: p.kind, difficulty: p.difficulty,
    theme: p.theme ?? "fantasy", title: p.title, description: p.description, status: "validated",
  };
  switch (p.kind) {
    case "mcq":
      return { ...base, content: { question: p.question, options: p.options },
               answer: { correctIndex: p.correctIndex, explanation: p.explanation } };
    case "short":
      return { ...base, content: { question: p.question, maxLength: p.maxLength ?? 200 },
               answer: { modelAnswer: p.modelAnswer, rubric: p.rubric } };
    case "code":
      return { ...base,
               content: { starterCode: p.starterCode, sampleTests: p.sampleTests, hiddenTestCount: p.hiddenTests.length },
               answer: { referenceSolution: p.referenceSolution, hiddenTests: p.hiddenTests } };
  }
}

function check<T>(result: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  if (result.data === null || result.data === undefined) throw new Error(`${what}: no data`);
  return result.data as NonNullable<T>;
}

// keep the existing status on tracks so dashboard changes, like disabling a track, don't get overwritten
async function seedTrack(outline: TrackOutline, sortOrder: number): Promise<string> {
  const fields = {
    slug: outline.slug, title: outline.title, language: outline.language,
    description: outline.description, sort_order: sortOrder,
  };
  const existing = check(await admin.from("tracks").select("id").eq("slug", outline.slug), `Track ${outline.slug}`);
  if (existing.length > 0) {
    check(await admin.from("tracks").update(fields).eq("id", existing[0].id).select("id"), `Track ${outline.slug}`);
    return existing[0].id as string;
  }
  const [row] = check(
    await admin.from("tracks").insert({ ...fields, status: outline.status }).select("id"),
    `Track ${outline.slug}`,
  );
  return row.id as string;
}

async function seedAdventures(outline: TrackOutline, trackId: string): Promise<Map<string, { id: string; concepts: string[] }>> {
  const rows = await Promise.all(
    outline.adventures.map(async (a, i) => ({
      track_id: trackId, slug: a.slug, title: a.title, summary: a.summary, sort_order: i + 1,
      concepts: await withLessons(a.concepts),
    })),
  );
  const bySlug = new Map<string, { id: string; concepts: string[] }>();
  if (rows.length === 0) return bySlug;
  const saved = check(
    await admin.from("adventures").upsert(rows, { onConflict: "track_id,slug" }).select("id, slug"),
    `Adventures of ${outline.slug}`,
  ) as { id: string; slug: string }[];
  for (const a of outline.adventures) {
    const id = saved.find((s) => s.slug === a.slug)!.id;
    bySlug.set(a.slug, { id, concepts: a.concepts.map((c) => c.slug) });
  }
  return bySlug;
}

// stored as validated because CI tests every seed puzzle's reference solution (T-08 to T-11)
async function seedPuzzlesOf(adventureSlug: string, adventure: { id: string; concepts: string[] }, puzzles: SeedPuzzle[]) {
  for (const p of puzzles) {
    const known = adventure.concepts.includes(p.concept) || (p.concept === "boss" && p.kind === "code");
    if (!known) {
      throw new Error(`Puzzle "${p.title}" in ${adventureSlug}: concept "${p.concept}" isn't one of the adventure's (or boss on a code puzzle)`);
    }
  }
  const existing = check(
    await admin.from("puzzles").select("title").eq("adventure_id", adventure.id),
    `Puzzles of ${adventureSlug}`,
  ) as { title: string }[];
  const titles = new Set(existing.map((r) => r.title));
  const fresh = puzzles.filter((p) => !titles.has(p.title));
  if (fresh.length > 0) {
    check(
      await admin.from("puzzles").insert(fresh.map((p) => puzzleRow(p, adventure.id))).select("id"),
      `Puzzles of ${adventureSlug}`,
    );
  }
  return { added: fresh.length, skipped: puzzles.length - fresh.length };
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  }

  for (const [i, outline] of outlines.entries()) {
    const trackId = await seedTrack(outline, i + 1);
    const adventures = await seedAdventures(outline, trackId);
    console.log(`Track ${outline.slug} (${outline.status}): ${adventures.size} adventures`);

    // seed puzzles are keyed by adventure slug, and all belong to the JavaScript track
    if (outline !== javascriptTrack) continue;
    for (const [slug, puzzles] of Object.entries(seedPuzzles)) {
      if (puzzles.length === 0) continue;
      const adventure = adventures.get(slug);
      if (!adventure) throw new Error(`Seed puzzles for "${slug}", which isn't an adventure in ${outline.slug}`);
      const { added, skipped } = await seedPuzzlesOf(slug, adventure, puzzles);
      console.log(`  ${slug}: ${added} puzzles added, ${skipped} already there`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
