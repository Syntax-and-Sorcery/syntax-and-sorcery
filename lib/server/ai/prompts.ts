// reads the Markdown prompt files in prompts/ (T-14)
// next.config.ts ships them to Vercel via outputFileTracingIncludes
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function loadPrompt(name: "game-master" | "judge" | "generator"): Promise<string> {
  return readFile(join(process.cwd(), "prompts", `${name}.md`), "utf8");
}
