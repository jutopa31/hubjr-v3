# Repository Guidelines

## Project Structure & Module Organization
- App source lives in `src/`.
- Feature modules: `src/modules/` (e.g., `WardRounds.tsx`, `PendientesManager.tsx`).
- Reusable UI: `src/components/`.
- Hooks and shared logic: `src/shared/` (e.g., `useAuth.ts`).
- Data/types/config: `src/utils/`, `src/types/`, `src/contexts/`.
- Tooling: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start Vite dev server.
- `npm run build` — type‑check and create production build (`dist/`).
- `npm run preview` — serve the production build locally.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). React function components.
- Indentation: 2 spaces; keep lines focused and readable.
- Filenames: Components/contexts `PascalCase.tsx`; hooks `useCamelCase.ts`; utils/types `camelCase.ts` or `kebab-case.ts` as already used.
- Styling: TailwindCSS utility classes; prefer composable small components.
- Imports: use relative paths within `src/`; colocate module‑specific helpers with their module when reasonable.

## Testing Guidelines
- No automated tests are configured yet. If adding tests, prefer Vitest + React Testing Library.
- Suggested locations: alongside sources as `*.test.ts` or `*.test.tsx` under `src/`.
- Aim for fast unit tests around utils/hooks; keep supabase calls mocked.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`). Example: `feat(ward): add patient filters panel`.
- PRs should include: concise description, rationale, before/after notes or screenshots, and any config changes.
- Keep PRs scoped; prefer small, incremental changes.

## Security & Configuration Tips
- Supabase config reads from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `src/utils/supabase.ts`).
- Store secrets in a local `.env` (Vite requires `VITE_` prefix). Do not commit `.env*`.
- For manual QA without secrets, default public keys are used; verify `isSupabaseConfigured()` before relying on data.

## Agent‑Specific Notes
- Follow these conventions for all files under this repo.
- Avoid refactors that change public behavior unless requested; prefer minimal, focused patches.
