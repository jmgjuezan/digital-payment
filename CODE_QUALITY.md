# Code Quality Checks

Run these checks from the project root before submitting changes.

## Lint

Run ESLint across the project:

```bash
npm run lint
```

To apply fixes ESLint can safely make:

```bash
npm run lint -- --fix
```

Review the resulting changes; ESLint does not fix every issue automatically.

## Formatting

There is currently no formatter dependency, configuration, or npm format script in this project. Follow the style in `AGENTS.md` when editing files:

- Use single quotes.
- Do not use semicolons.
- Keep TypeScript types strict and follow the surrounding file's formatting.

Do not use `npm run format` until a formatter and script have been added to the project.

## Type checking

Run the TypeScript compiler without emitting files:

```bash
npm run typecheck
```

## Suggested order

```bash
npm run lint
npm run typecheck
```

See [`CODE_COVERAGE.md`](CODE_COVERAGE.md) to generate application coverage reports.
