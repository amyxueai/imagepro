# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, with `layout.tsx` hosting shared UI chrome, `page.tsx` as the splash feature, and `globals.css` for cross-page tokens. Static images, icons, and robots metadata belong in `public/`. Runtime artifacts (`.next/`) and installed packages (`node_modules/`) are generated; never edit them manually. Configuration roots - `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, and `postcss.config.mjs` - should be updated in lockstep when framework upgrades are made.

## Build, Test, and Development Commands
Use `npm run dev` for hot-reload development at http://localhost:3000. `npm run build` creates a production bundle and catches blocking type issues. `npm run start` serves the optimized build, mirroring Vercel. `npm run lint` runs ESLint with the Next.js ruleset; run it before every commit to keep CI quiet.

## Coding Style & Naming Conventions
Stick to TypeScript with strict typings and prefer functional React components. Components and files exporting JSX should use PascalCase (e.g., `HeroPanel.tsx`), hooks should be prefixed with `use`, and utilities stay camelCase. Keep imports absolute from `@/` only after adding an alias in `tsconfig.json`; today we rely on relative paths. Two-space indentation and single quotes keep diffs consistent. Update `app/globals.css` sparingly - feature-specific styles should sit next to their component.

## Testing Guidelines
Automated tests have not been scaffolded yet, so new features must land with `*.test.tsx` or `*.spec.ts` files colocated within the relevant `app/` segment, using React Testing Library or Vitest. Keep tests deterministic, stub network calls, and favor screen-level assertions over implementation detail. Until `npm test` is added, run `npm run lint` plus any bespoke scripts you add and call out coverage expectations inside the PR description.

## Commit & Pull Request Guidelines
Commits should follow the short, imperative style already present (`Initial commit`) and stay under 72 characters; include an issue or ticket ID like `feat: add gallery #42` when applicable. Every PR needs: summary of intent, before/after notes or screenshots for UI work, testing instructions, and confirmation that `npm run lint` and `npm run build` succeed. Draft PRs are encouraged for early feedback - convert to ready only after reviews are addressed.

## Security & Configuration Tips
Secrets such as API keys belong in `.env.local`, which is gitignored; never check them into version control. Document any required env vars inside the PR and README. When adding external services, describe failure states and guard API calls on the client to avoid leaking tokens.