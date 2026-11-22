// seed puzzles indexed by adventure slug for scripts/seed.ts (T-08 to T-11)
import type { SeedPuzzle } from "./types";
import { arrays } from "./arrays";
import { basics } from "./basics";
import { closures } from "./closures";
import { conditionals } from "./conditionals";
import { functions } from "./functions";
import { loops } from "./loops";
import { objects } from "./objects";

export const seedPuzzles: Record<string, SeedPuzzle[]> = {
  basics,
  conditionals,
  loops,
  functions,
  arrays,
  objects,
  closures,
};
