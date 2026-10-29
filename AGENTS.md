# AGENTS.md

## Project Context
- **Description**: Digital Payment application is a small software that records payments or transfer either GCash, Maya or via Bank depending on what device is used.
- **Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Supabase, Vercel.

## Core Commands
- **Install**: `npm install`
- **Dev**: `npm dev`
- **Build**: `npm build`
- **Test**: `npm test`

## Requirements Execution Guardrails
- **Code Style**: Functional programming patterns, strict TypeScript mode, single quotes, no semicolons.
- **Testing**: Write unit tests using Vitest *before* completing the feature logic.
- **Scope Limits**: Keep Git diffs tightly contained to the requested feature. Do not refactor unrelated files.
- **Safety**: Do not install new third-party packages or update `package.json` without asking first.

## UI: Mobile-first
Design and implement every screen for phones first (320px–430px), then scale up. This app is used on the device that owns the wallet (GCash, Maya, or bank).
- Default layout is a single column. Use `md:` / `lg:` only after the mobile layout works.
- Touch targets at least 44px. Prefer full-width primary actions stacked at the bottom of forms.
- Avoid horizontal overflow: wrap text, allow tables/lists to stack or scroll inside the page, never clip inputs or buttons off-screen.
- Spacing and type should stay readable on small screens (comfortable padding, no dense multi-column grids).
- Verify UI changes on a mobile viewport (and desktop if layout also changes there) before considering the work done.

## Where to Find Requirements
- Global feature specifications live in the `/docs/specs/` folder.
- Follow active task instructions detailed in `REQUIREMENTS.md` at the project root.
