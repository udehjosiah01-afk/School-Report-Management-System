# Classfolio

Classfolio is a school-results workspace built with TanStack Start, React, TypeScript, Netlify Identity, and Netlify Database (PostgreSQL) with Drizzle.

## Current capabilities

- Schools can create an account, verify their email through Netlify Identity, and register their own school profile.
- Each school has a separate workspace with its own classes, subject lists, staff roles, enrollments, and score records.
- New workspaces start with JSS 1–3 and SS 1–3. JSS 1 and JSS 2 use the 17 subjects transcribed from the supplied junior report-card design. JSS 3 is left unconfigured until its subjects are supplied. Senior classes use the existing 13-subject workbook curriculum.
- Administrators can configure subjects per class, enroll students, add staff who already have Identity accounts, manage school roles, and assign teachers to classes and subjects.
- Draft scores are stored in the database, restricted to unpublished terms, and validated against the workbook's 40-point test and 60-point examination limits.
- The visible overview and printable previews still use fictional, in-memory demonstration scores. They are not connected to school records and reset on refresh. Persistent report generation is not yet implemented.

The senior workbook calculation behavior remains intentionally unchanged: term- and subject-specific grade/remark thresholds, competition ranking, third-term averages rounded to one decimal place, and the thirteen-subject aggregate divided by ten. Regression tests cover these rules. Junior grade, average, and ranking calculations remain blank until the school confirms the intended rules. No real student details from the supplied workbook are included in fixtures.

## Local development and Netlify setup

Use Node 22.13+ and pnpm. Install dependencies with `pnpm install`. Link the project to a Netlify site, enable Netlify Identity with public signup and email confirmation, and enable Netlify Database. Run `netlify dev --port 8889` to use the linked Identity and Database services locally. Netlify applies SQL files in `netlify/database/migrations/` during deploys.

A new school administrator registers at `/signup`, confirms their email, signs in, and completes the school profile at `/school-setup`. Additional staff must first have Netlify Identity accounts; a school administrator can then add them to that school and choose their school-specific role. Teachers also need class/subject assignments before they can save draft scores. Role and tenant checks are enforced in server operations.

The deployment must be linked and configured before Identity or database-backed flows can be live-tested. Without that configuration, use the fixture-backed preview only.

## Development checks

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm peers check
```

See [PLAN.md](./PLAN.md) for the implementation roadmap and [AGENTS.md](./AGENTS.md) for architecture and calculation constraints.
