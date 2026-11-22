import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // `server-only` throws outside Next; this lets tests import the runner and other server files
    alias: { "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
    coverage: {
      provider: "v8",
      reporter: [["text", { skipFull: false }], "text-summary"],
      // the app's logic: rules, runner, grading, puzzle checks, prompt building and the client API layer
      include: ["lib/**/*.ts", "components/game/rules.ts", "components/game/splitLesson.ts"],
      // left out: code whose job is to talk to Supabase, Anthropic or Vercel Sandbox, generated types, and dev-only fixtures
      exclude: [
        "**/*.test.ts",
        "lib/supabase/**",
        "lib/data/supabase.ts",
        "lib/data/mock.ts",
        "lib/api/mock.ts",
        "lib/server/admin.ts",
        "lib/server/auth.ts",
        "lib/server/events.ts",
        "lib/server/usage.ts",
        "lib/server/runs.ts",
        "lib/server/ai/generator.ts",
        "lib/runner/backends/sandbox.ts",
      ],
      thresholds: { lines: 70, statements: 70 },
    },
  },
});
