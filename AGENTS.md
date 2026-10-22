# Classfolio architecture

Read `PLAN.md` before continuing implementation.

- `src/routes/index.tsx`: fixture-backed overview, score sheet, report preview, filters, print, and CSV actions. Demonstration edits stay in memory and reset on refresh.
- `src/data/fixtures.ts`: fictional student records, senior workbook subjects, classes, terms, and initial demonstration scores.
- `src/data/curriculum.ts`: JSS and senior curricula and class defaults. Keep JSS 3 unconfigured until its subjects are provided.
- `src/data/workbook-calculations.ts` and `src/data/workbook-calculations.test.ts`: workbook-derived score rules and regression coverage.
- `src/data/schema.ts` and `netlify/database/migrations/`: tenant-aware persistent school records.
- `src/server/auth.ts`: Netlify Identity authentication and school-membership authorization.
- `src/server/school-actions.ts` and `src/server/score-actions.ts`: server-side school setup, staff, roster, assignment, and draft-score operations. Enforce administrator/teacher permissions and school ownership in every operation.
- `src/routes/signup.tsx`, `src/routes/school-setup.tsx`, and `src/routes/login.tsx`: email-confirmed school owner signup, school profile setup, and staff sign-in.
- `src/routes/school-data.tsx`: connected school administration and draft-score workspace.
- `src/styles.css`: sage and cream design system, responsive layouts, and print rules, including the junior report preview.
- `netlify.toml` and `vite.config.ts`: deployment and TanStack Start integration.

Treat every deployed database migration as immutable. Restore or reference the exact applied version from Git history; put schema changes in a new, sequentially numbered migration and never rewrite a deployed migration.

Preserve the senior workbook's intentional term- and subject-specific grade/remark thresholds, competition ranking (1, 1, 3; no rank for scores at or below zero), third-term three-term subject averaging rounded to one decimal, and thirteen-subject aggregate divided by ten. Do not normalize thresholds, correct the divisor, or treat these rules as defects. Test and examination score limits are 40 and 60.

The uploaded junior report template defines 17 subjects for JSS 1 and JSS 2. JSS 3 remains unconfigured for later setup. Do not invent junior grading, average, remark, or ranking formulas; ask for the approved rules before calculating those fields. Never reuse the template's sample-school identity as generic branding.

The fixture-backed preview is not persistent and must not be described as saved. It remains separate from tenant records until the roster, score-entry, calculation, and report flows are deliberately connected. Do not store school records in local files or browser storage. Keep real workbook student details out of demonstration fixtures. Use accessible labels and preserve mobile and print layouts.
