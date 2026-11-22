import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the server reads prompts/*.md at runtime
  // Vercel only ships files it can trace
  outputFileTracingIncludes: { "/api/*": ["./prompts/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
