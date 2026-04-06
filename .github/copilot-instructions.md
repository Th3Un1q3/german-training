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
- **Validate**: `npm run lint && npm run build` — run after every change.

**Where To Look**
- **Project README**: [README.md](README.md)
- **Scripts & deps**: [package.json](package.json)
- **Vite config / env**: [vite.config.ts](vite.config.ts)
- **TypeScript config**: [tsconfig.json](tsconfig.json)
- **App orchestrator**: [src/App.tsx](src/App.tsx) — session lifecycle, screen routing
- **Components**: `src/components/` — one component per file, named by responsibility
- **Exercise modes**: `src/components/modes/` — SpeechMode, ScrambleMode, OneByOneMode
- **AI integration**: [src/lib/gemini.ts](src/lib/gemini.ts) — all Gemini API calls
- **Hooks**: `src/hooks/` — custom React hooks (e.g., `useRecentTopics`)
- **Types**: [src/types.ts](src/types.ts)

**Architecture & Conventions**
- **Stack**: Vite + React 19 + TypeScript + Tailwind CSS v4.
- **No server**: This is a client-only SPA. Do not assume or add server-side components.
- **State**: User-configurable settings (API key, model, base URL) go in `localStorage`. Session/exercise state lives in React `useState`.
- **State reset**: When leaving or completing a session, reset all related state — not just `sessionConfig`. Use a dedicated reset function.
- **Component structure**: Break components by responsibility. Keep `App.tsx` as a slim orchestrator; UI-heavy logic belongs in child components. Exercise modes are separate components under `components/modes/`.
- **Styling**: Dark theme. Use hex color tokens consistently (`#0F0F0F`, `#1A1A1A`, `#141414`, `#2A2A2A`, `#E5E5E0`, `#9A9A80`, `#8A8A60`). Use `cn()` from `lib/utils.ts` for conditional classes.
- **Fonts**: DM Sans (sans), JetBrains Mono (mono) — configured in `src/index.css`.

**AI Prompts & Post-Processing**
- **Keep prompts minimal**: Do not add rules to AI prompts that can be enforced programmatically. Prefer post-processing (stripping, deduplication, padding, validation) over bloating the prompt.
- **Sanitize AI output**: Always post-process structured data from Gemini (strip punctuation, validate array lengths, deduplicate, provide fallbacks). Do not trust the model to follow formatting rules perfectly.
- **Schema-driven**: Use `responseSchema` with `Type` enum for structured JSON output. Validate shapes after parsing.
- **Validation anchoring**: When validating user answers, pass the expected answer to the validation call — don't let the AI invent alternative correct answers.

**What The Assistant Can Do**
- **Local tasks**: Modify components, add UI features, update types, fix lint/TS errors.
- **AI-specific**: Audit or extend `src/lib/gemini.ts`, adjust prompts, improve post-processing.
- **Always validate**: Run `npm run lint && npm run build` after every code change. Do not mark work as done until both pass.
- **Dev container updates**: To update global tools (Node, npm, etc.), modify `.devcontainer/devcontainer.json` (e.g. `postCreateCommand`). Do **not** run `npm install -g` interactively — those changes are lost on container rebuild.
- **Do not**: Add or change secrets, modify production infra, or add server-side components.

**CI / GitHub Actions**
- **Devcontainer in CI**: Always use the `devcontainers/ci@v0.3` action to run commands inside the devcontainer. Never reference the devcontainer image directly via the `container:` key — that skips `devcontainer.json` (including `postCreateCommand`) and defeats the purpose of a devcontainer.
- **Correct pattern**:
  ```yaml
  - uses: actions/checkout@v6
  - uses: devcontainers/ci@v0.3
    with:
      runCmd: npm ci && npm run lint && npm run build
  ```
- **Passing env vars into the container**: use both the job-level `env:` block and the action's `env:` input (list the variable names to forward), e.g. `env: BASE_PATH`.
- **Post-build host steps** (e.g. `actions/upload-pages-artifact`, `actions/deploy-pages`) run normally outside the container after the `devcontainers/ci` step.

**Guidance for PRs**
- **Scope PRs**: Keep changes small and focused (one feature/bug per PR).
- **Testing**: There are no test frameworks — validate with `npm run lint && npm run build`.

**Link, don't embed**
- Prefer linking to docs and files above; do not duplicate large sections of `README.md`.

**When to escalate to human**
- Any change involving secrets, billing, production infra, or broad CI changes.
