# Classfolio

Classfolio is a school-results workspace built with TanStack Start, React, TypeScript, Netlify Identity, and Netlify Database (PostgreSQL) with Drizzle.

## Current capabilities

- Schools can create an account, verify their email through Netlify Identity, and register their own school profile.
- Each school has a separate workspace with its own classes, subject lists, staff roles, enrollments, and score records.
- New workspaces start with JSS 1–3 and SS 1–3 and a school-owned subject catalogue seeded with the supplied JSS and senior subjects. Administrators select subjects from that catalogue for each class independently and can add custom subjects for a different curriculum. Class curricula must be configured before students are enrolled.
- Administrators can configure subjects per class, enroll students, add staff who already have Identity accounts, manage school roles, and assign teachers to classes and subjects.
- Draft scores are stored in the database, restricted to unpublished terms, and validated against the workbook's 40-point test and 60-point examination limits.
- The public workspace preview contains no student records, scores, or performance charts. Report-card layouts are blank templates; saved-result report generation is not yet connected.

The senior workbook calculation behavior remains intentionally unchanged: term- and subject-specific grade/remark thresholds, competition ranking, third-term averages rounded to one decimal place, and the thirteen-subject aggregate divided by ten. Regression tests cover these rules. Junior grade, average, and ranking calculations remain blank until the school confirms the intended rules. No real student details from the supplied workbook are included in fixtures.

## Local development and Netlify setup

Use Node 22.13+ and pnpm. Install dependencies with `pnpm install`. Link the project to a Netlify site, enable Netlify Identity with public signup and email confirmation, and enable Netlify Database. Run `netlify dev --port 8889` to use the linked Identity and Database services locally. Netlify applies SQL files in `netlify/database/migrations/` during deploys. Applied migration files are immutable: subsequent schema changes belong in a new numbered migration. Migration `0001_school_records.sql` must remain byte-for-byte identical to the version in Git commit `f76f5a1`, which includes the `system_settings` table. Migration `0002_school_tenancy.sql` moves existing records into a legacy school workspace without deleting them and creates the settings table if it is absent; historical staff memberships default to teacher access and should be reviewed before using that workspace. Migration `0003_school_branding_colors.sql` adds validated school-specific main and accent colours.

A new school administrator registers at `/signup`, confirms their email, signs in, and completes the school profile at `/school-setup`. The school name, address, contact details, motto, optional PNG/JPG/WebP logo (512 KB maximum), and main/accent colours are saved on that school’s tenant record; administrators can update them later in `/settings`. The default theme is red and sky blue. Text on coloured surfaces uses the higher-contrast white or dark foreground, and selections where neither reaches 4.5:1 contrast are flagged. The report template preview uses the saved school branding automatically. Logo image data is validated on the server and stored with the school profile in Netlify Database. Additional staff must first have Netlify Identity accounts; a school administrator can then add them to that school and choose their school-specific role. Teachers also need class/subject assignments before they can save draft scores. Role and tenant checks are enforced in server operations.

The deployment must be linked and configured before Identity or database-backed flows can be live-tested. Without that configuration, use the fixture-backed preview only.

## Development checks

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm peers check
```

See [PLAN.md](./PLAN.md) for the implementation roadmap and [AGENTS.md](./AGENTS.md) for architecture and calculation constraints.
