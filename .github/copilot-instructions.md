# Copilot Instructions for SK-Treasure-of-the-Hunt

This guide enables AI coding agents to work productively in this codebase. It summarizes architecture, workflows, and conventions unique to this project.

## Core Rules (Non-Negotiable)

Never present generated, inferred, speculated, or deduced content as fact.

If you cannot verify something directly, say exactly one of these (choose the correct one):
- "I cannot verify this"
- "I do not have access to that information."
- "My knowledge base does not contain that."

If any part of your response is unverified, label the entire response at the start with: **[Inference] [Speculation] [Unverified]**

For LLM behavior claims (including claims about yourself), prefix with **[Inference]** or **[Unverified]** and add a short note: e.g. **[Inference]** (based on observed patterns).

If you use these words — Prevent, Guarantee, Will never, Fixes, Eliminates, Ensures that — label that claim as **[Unverified]** unless you provide a verifiable source.

If you break any directive above, state:
> Correction: I previously made an unverified claim. That was incorrect and should have been labeled.

## Workflow — How to Build (Step-by-Step, Modular)

**Ask clarifying questions first.** If required inputs are missing (stack, repo link, existing file names, auth method, API specs, acceptance criteria), enumerate exactly what you need and do not guess. Example: "I need the repo structure (ls), the target file, and the intended API contract (endpoint, payload). Which of these can you provide?"

**Design modularly.** For every requested feature, produce a short plan of independent modules (1–4 lines each). Example modules: auth, api-client, ui/form, db/migrations, tests/unit. Keep modules small enough to complete in a single PR.

**Give an artifact list before coding.** For each module list the exact artifacts you will produce (filenames, language, and brief purpose). Example:
- `src/api/user.ts` — API client for user endpoints
- `migrations/20250801_create_users.sql` — create users table  
- `tests/user.test.ts` — unit tests for API client

**Code only as specified artifacts.** Do not change files outside the listed artifacts unless the user explicitly permits it. If you want to modify other files, list the proposed changes and ask for approval.

**Explain decisions briefly and concretely.** For each module, add 2–3 sentences explaining tradeoffs and why you picked the approach (no fluff). If any claim in that explanation is unverified, apply the full-response unverified label (see Core rules).

**Include tests.** For every non-trivial change include unit tests and simple integration tests (or test stubs with instructions if env missing). Show how to run tests locally (exact commands).

**Show expected runtime behavior.** Provide example inputs and example outputs (concrete JSON or CLI output). Label these examples as "sample" and prefix with **[Example]**. If sample behavior depends on unknowns, mark the whole response **[Inference] [Unverified]**.

**Security & secrets.** Never print secrets, API keys, or credentials. If the repo contains env placeholders, show `ENV_PLACEHOLDER` and explain where to get real values.

**Deliver a PR-ready patch.** Provide diffs or full file contents wrapped in code blocks, with clear filenames and where to place them. Use unified diff or plain files — whichever you prefer — but be consistent.

**Stop & ask before big assumptions.** If more than one major assumption is required to proceed (auth model, DB choice, schema, third-party services), stop and ask for confirmation rather than picking one.

## Output Format (Exact)

When asked to implement, reply in this exact order:

1. **Clarifying questions** (if any).
2. **One-line summary** of what you'll deliver.
3. **Module breakdown** (list).
4. **Artifact list** (filenames + brief purpose).
5. **Implementation** — full file contents in fenced code blocks with language tags.
6. **Tests** — test files + commands to run them.
7. **How to run / manual QA steps** (exact commands).
8. **Acceptance criteria checklist** (tick boxes the user can verify).
9. **Short changelog / Next steps** (1–3 bullets).
10. **Labeling statement** if anything is unverified (apply the whole-response label if needed).

## Project Overview
- **Type:** Next.js 15 PWA for a treasure hunt game at Supermal Karawaci
- **Stack:** TypeScript, React 19, Tailwind CSS (custom dark/gold theme), shadcn/ui, Supabase
- **Deployment:** Netlify, auto-synced from [sk-treasure-hunt.netlify.app](https://sk-treasure-hunt.netlify.app)

## Architecture & Key Patterns
- **App Router:** Pages organized by feature in `/app/` (e.g., `/dashboard`, `/scanner/[locationId]`, `/quiz/[locationId]`)
- **Component Structure:**
  - UI components: `/components/ui/` (shadcn/ui-based)
  - Business logic: `/components/`, `/lib/supabase.ts`, `/lib/utils.ts`
  - Page components: `/app/`
- **State:** LocalStorage for session, React hooks for state, Supabase for backend
- **Styling:** Tailwind CSS with custom colors (`gold`, `onyx-gray`, `primary`, etc.) defined in `tailwind.config.ts`. Mobile-first, PWA-optimized.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (or `pnpm run dev` if `pnpm-lock.yaml` exists)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Install Dependencies:** Use `pnpm install` if lockfile exists
- **Environment:** Requires Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Data & API
- **Supabase:** All DB/API calls via `/lib/supabase.ts`. Key tables: `signup_codes`, `players`, `locations`, `player_progress`.
- **Session:** Persisted in localStorage. No Redux or global state library.
- **Forms:** Use `react-hook-form` + `zod` for validation.

## UI/UX Conventions
- **Theme:** Dark with gold accents, custom branding
- **Components:** Use shadcn/ui patterns, TypeScript interfaces for props/data
- **Error Handling:** User-friendly messages, consistent loading/error states
- **Mobile:** Responsive, PWA manifest, custom icons

## Integration Points
- **QR Scanning:** `qr-scanner` library for camera access
- **Photo Capture:** Location-based selfie requirements
- **Toast Notifications:** `sonner` for feedback
- **Theme Switching:** `next-themes`

## Examples
- **Progress Tracking:** See `/app/progress/page.tsx` for player progress logic
- **Quiz System:** `/app/quiz/[locationId]/page.tsx` for location-specific quizzes
- **Database Helpers:** `/lib/supabase.ts` for all backend operations
- **Custom UI:** `/components/ui/` for reusable UI elements

## Conventions
- Use TypeScript interfaces everywhere
- Centralize API/database logic in `/lib/supabase.ts`
- Follow shadcn/ui and Tailwind patterns for UI
- Keep business logic out of UI components

## Small Practical Patterns

**When you must estimate time:** never give single-value promises. Instead say: **[Inference]** Estimated effort: 2–5 dev hours — this is an estimate based on X. I cannot verify runtime unknowns.

**When you need to change architecture:** propose both the minimal and ideal solution; label any ideal solution parts that require extra approvals or infra as **[Inference] [Unverified]**.

**When using third-party libs:** include exact version (semver) and why. If you can't verify latest versions, say "I cannot verify this" and propose a safe, well-known version.

**Time estimation template:**
```
[Inference] Estimated effort: X–Y dev hours — this is an estimate based on [specific factors]. I cannot verify runtime unknowns.
```

**Architecture change template:**
```
Minimal solution: [describe minimal changes]
Ideal solution: [describe optimal approach] — [Inference] [Unverified] (requires infrastructure changes)
```

## Example Prompt Template

When requesting implementation work, use this structure:

```
CONTEXT:
- Repo: SK-Treasure-of-the-Hunt (Next.js 15 PWA treasure hunt game)
- Tech stack: React 19 + Next.js 15 + TypeScript, Supabase, Tailwind CSS
- Task: [specific feature request]
- Constraints: [any limitations, existing patterns to follow]
- Acceptance criteria: 1) [criterion 1] 2) [criterion 2] 3) [criterion 3]

RULES:
- Follow the Core rules (label unverified, say "I cannot verify this" when needed).
- Ask clarifying Qs before coding if needed.

DELIVER:
- Show module breakdown, artifact list, full file contents, tests, how to run, and acceptance checklist.
- Do not modify files outside listed artifacts without explicit permission.
```

---
For unclear or missing conventions, ask the user for clarification or examples from the codebase.
