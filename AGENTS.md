# Classfolio architecture

Read `PLAN.md` before continuing implementation. The completed milestone is the visible product workspace; persistent data and authentication are subsequent milestones.

- `src/routes/index.tsx`: overview, score sheet, report preview, filters, print and CSV actions. Screens currently use local component state.
- `src/data/fixtures.ts`: illustrative records, workbook subjects, classes, terms, and initial scores. This is the replacement point for future real records.
- `src/data/workbook-calculations.ts`: workbook-derived score validation limits and term-specific grade, remark, average, and ranking helpers.
- `src/data/workbook-calculations.test.ts`: regression tests for the intentional workbook calculation rules.
- `src/data/schema.ts`: Drizzle schema for persistent school records.
- `src/server/auth.ts`: Netlify Identity staff authorization helpers.
- `src/server/school-actions.ts` and `src/server/score-actions.ts`: role-guarded server data operations.
- `src/routes/login.tsx` and `src/routes/school-data.tsx`: invite-based staff sign-in and connected school records workspace.
- `netlify/database/migrations/`: Netlify Database SQL migrations.
- `src/routes/__root.tsx`: page metadata and document shell.
- `src/styles.css`: sage and cream design system, responsive layouts, print rules, and reduced-motion support.
- `netlify.toml` and `vite.config.ts`: deployment and TanStack Start integration.

Keep calculations derived from the selected class, term, subject, and score state. Test and examination score limits are 40 and 60. Preserve the supplied workbook's intentional term- and subject-specific grade/remark thresholds, competition ranking (1, 1, 3; no rank for scores at or below zero), third-term three-term subject averaging rounded to one decimal, and thirteen-subject aggregate divided by ten. Keep regression tests for these formulas; do not normalize thresholds, silently correct the divisor, or treat the workbook's calculation quirks as defects. Demo score edits remain in memory and reset on refresh; never imply they are persisted.

Use Netlify Database with Drizzle for persistent school records and Netlify Identity for staff authentication. The first migration and server-guarded draft-score operation are foundations only; the visible workspace remains fixture-backed until its roster/setup and score-entry flows are connected to the database. Keep administrator and teacher permissions enforced in every server operation, not only in the interface. Do not persist school records in local files or browser storage. Keep real workbook student details out of demonstration fixtures. Use accessible labels for controls and preserve mobile and print layouts.
