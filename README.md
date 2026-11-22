# Syntax & Sorcery

**Learn programming through a text-based RPG adventure.** Fight enemies by solving programming puzzles, get guidance from an AI game master, and earn XP and loot as you progress.

- **Play:** https://syntax.quest
- **Service status:** https://stats.uptimerobot.com/p4BzWGe833

## Team

Syntax & Sorcery is a collaborative software engineering project. For the full, up-to-date development history and contributors, see the [commit history](../../commits/main) and [pull requests](../../pulls).

Documented implementation contributions include:
- **CodeVoyager811:** XP reward calculation (T2, [PR #4](../../pull/4)) and loot drop / level-up reward rules (T3, [PR #5](../../pull/5)), with unit tests.

Other team contributions are recorded in GitHub history. Specific team roles can be added here once confirmed by the team.

## Problem

Beginners can struggle to stay engaged when learning programming from isolated exercises and tutorials. Syntax & Sorcery connects coding practice with short adventures, puzzles, enemies, and feedback. Instead of learning a concept only in theory, players apply it to make progress in the game.

## Key features

- **Adventure-based learning:** Work through programming concepts and enemy encounters in an RPG-style interface.
- **Interactive puzzles:** Answer multiple-choice and short-answer questions or write code to defeat enemies.
- **AI game master and hints:** AI-assisted storytelling and guided explanations support learning during adventures.
- **Code editor and grading:** Write code in the browser and receive results from the configured code runner.
- **XP and levels:** Earn experience for victories, with rewards adjusted for puzzle difficulty, bosses, and basic hints.
- **Loot rewards:** Receive Scrolls of Remembering from random enemy drops, boss fights, and level-ups.
- **Progress tracking:** View adventure completion, XP, and performance by programming concept.
- **Accounts and preferences:** Sign up, sign in, and customize available game settings.

**Track availability:** The application supports track statuses such as active and coming soon. Only tracks marked active are playable; other tracks may still be in development.

## Technologies

- **Application:** Next.js, React, TypeScript
- **Interface:** Tailwind CSS, shadcn/ui, 8bitcn, CodeMirror
- **Data and authentication:** Supabase (with a mock data mode for development)
- **AI:** AI SDK with Claude via Anthropic
- **Code execution:** Local runner or Vercel Sandbox, depending on configuration
- **Testing:** Vitest, ESLint, TypeScript

## Prerequisites

- Node.js 24 (24.15 or newer) or Node.js 26
- npm

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Syntax-and-Sorcery/syntax-and-sorcery.git
cd syntax-and-sorcery
npm ci
```

## Configuration

Copy `.env.example` to `.env.local`.

For local development with mock data:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=mock
CODE_RUNNER=local
```

For Supabase, AI, or sandbox-backed functionality, consult `.env.example` and supply the relevant credentials and settings. **Never commit `.env.local` or API keys.**

## Run locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Testing and checks

```bash
npm run lint
npm run typecheck
npm run test:ci
```

The test suite includes tests for the XP and loot reward rules in `lib/rules/xp.test.ts` and `lib/rules/loot.test.ts`.

To run Vitest in watch mode:

```bash
npm test
```

## Project structure

| Path | Purpose |
| --- | --- |
| `app/` | Pages, authentication routes, and API handlers |
| `components/` | Adventure, editor, puzzle, and progress interfaces |
| `content/` | Learning material and track content |
| `lib/rules/` | XP, loot, leveling, difficulty, and progress rules |
| `lib/data/` | Data access implementations |
| `lib/runner/` | Code execution interfaces and backends |
| `supabase/` | Database configuration and migrations |

## Contributions

Use feature branches and pull requests for changes so implementation, tests, and reviews are visible in GitHub history. Keep each commit focused and explain what it changes.
