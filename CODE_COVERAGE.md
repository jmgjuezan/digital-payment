# Code Coverage

This project uses Vitest to measure coverage across application source files in `src/`. Test files and `__tests__` directories are excluded from the coverage denominator.

## Required minimum

Maintain at least **80% coverage** for statements, branches, functions, and lines across the included application source. Vitest enforces each threshold, so `npm run test:coverage` exits unsuccessfully if any metric falls below 80%. Add or update tests with code changes to keep the project above the minimum.

## Run coverage

Run the complete test suite and generate coverage reports:

```bash
npm run test:coverage
```

The command prints a text summary and creates HTML and LCOV reports under `coverage/`:

- `coverage/index.html` for an interactive local report
- `coverage/lcov.info` for CI and coverage services

Open `coverage/index.html` in a browser to inspect file, function, line, and branch coverage.

Latest measured unit coverage: 89.39% statements, 81.55% branches, 80.21% functions, and 90.67% lines. All four metrics currently meet the 80% minimum.
