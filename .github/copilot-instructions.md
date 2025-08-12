# Copilot Instructions for SK-Treasure-of-the-Hunt

This guide enables AI coding agents to work productively in this codebase. It summarizes architecture, workflows, and conventions unique to this project.

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

---
For unclear or missing conventions, ask the user for clarification or examples from the codebase.
