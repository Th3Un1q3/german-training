---
name: copilot-instructions
description: "Workspace instructions for AI assistants working on this Vite + React + TypeScript repo. Keep short, link-first, and action-oriented."
---

**Purpose**
- **Summary**: Help AI assistants be immediately productive with minimal noise.

**Quick Run**
- **Install**: `npm install`
- **Dev**: `npm run dev` (Vite dev server)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

**Where To Look**
- **Project README**: [README.md](README.md)
- **Scripts & deps**: [package.json](package.json)
- **Vite config / env**: [vite.config.ts](vite.config.ts)
- **TypeScript config**: [tsconfig.json](tsconfig.json)
- **Frontend entry**: [src/main.tsx](src/main.tsx) and [src/App.tsx](src/App.tsx)
- **AI integration**: [src/lib/gemini.ts](src/lib/gemini.ts)

**Architecture & Conventions**
- **Stack**: Vite + React + TypeScript.
- **Env keys**: GEMINI_API_KEY (see [README.md](README.md) and `.env.example`).
- **Paths**: TS path aliases configured in `tsconfig.json` and used across `src/`.
- **AI calls**: Schema-driven usage in [src/lib/gemini.ts](src/lib/gemini.ts); keep prompts compact and validate JSON shapes.

**What The Assistant Can Do**
- **Local tasks**: run `npm run dev`, modify frontend components, add small UI features, update types, and fix lint/TS errors.
- **AI-specific**: audit or extend `src/lib/gemini.ts`, add retry/backoff, and add small prompt schema changes.
- **Do not**: add or change secrets, modify production infra, or assume server-side components exist unless clearly present.

**Guidance for PRs**
- **Scope PRs**: Keep changes small and focused (one feature/bug per PR).
- **Testing**: There are no test frameworks by default — propose tests before adding large logic.

**Example Prompts**
- "Add a button to `src/App.tsx` that toggles dark mode, preserve existing styles." 
- "Refactor `src/lib/gemini.ts` to add exponential backoff and unitable retry logic; keep behavior identical when key missing." 
- "Explain how to run the app locally and where to place API keys." 

**Link, don't embed**
- Prefer linking to docs and files above; do not duplicate large sections of `README.md`.

**When to escalate to human**
- Any change involving secrets, billing, production infra, or broad CI changes.
