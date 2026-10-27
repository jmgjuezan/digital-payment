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

## Where to Find Requirements
- Global feature specifications live in the `/docs/specs/` folder.
- Follow active task instructions detailed in `REQUIREMENTS.md` at the project root.
