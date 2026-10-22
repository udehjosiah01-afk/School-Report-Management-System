# Classfolio

A school results workspace inspired by the supplied senior secondary report-card workbook. The overview, score sheet, and report-card preview show how teachers can replace manual term calculations with a connected workflow.

The interactive preview includes 48 fictional students across SS 1–3, thirteen workbook subjects, three terms, editable test and examination scores, term-specific grades and remarks, CSV downloads, and printable individual report previews. Test scores are limited to 40 and examination scores to 60. Third-term subject results average the totals from all three terms and round to one decimal; workbook averages divide the thirteen subject results by ten. The calculation helpers are covered by regression tests. Score edits in the visible workspace remain illustrative, held in browser memory, and reset when the page refreshes. No real student records have been imported.

## Application foundation

TanStack Start, React 19, TypeScript, Netlify Database (PostgreSQL) with Drizzle, and Netlify Identity. The first database migration creates school records, yearly enrollments, terms, assignments, draft scores with database-enforced 40/60 limits, and an audit log. The server-side draft-score operation requires a Netlify Identity `admin` or assigned `teacher` role. Real records are not yet connected to the visible workspace; use `src/data/fixtures.ts` only for the clearly labelled preview.

## Local development

Use Node 22.13+ and install dependencies with `pnpm install`. Link the project to a Netlify site, enable Netlify Database and Identity, and disable public sign-up in Identity settings. Invite the first administrator from the Netlify Identity dashboard, then set the server environment variable `CLASSFOLIO_INITIAL_ADMIN_EMAIL` to that exact email before the first sign-in. The signed-in matching account can claim the one-time administrator bootstrap; the database records the claim and refuses a second bootstrap. Remove the environment variable after setup. Run `netlify dev --port 8889` with the linked site to use local Identity and Database services. Netlify automatically applies files in `netlify/database/migrations/` during deploys. The administrator can invite additional staff in the Identity dashboard, grant each account the `teacher` or `admin` role in the app’s Staff accounts section, and assign teachers to classes and subjects. A role change takes effect after the staff member signs in again.

## Next steps

See `PLAN.md` for the roadmap. The connected school-data route now provides staff sign-in, initial administrator setup, roster and subject registration, class/term setup, teacher assignments, and persistent draft score entry. The overview and report-card preview remain fixture-backed, and their demo score edits are not saved. Workbook import, calculating persisted results, review, and publication are outstanding. The supplied workbook's term- and subject-specific formula differences are intentional and are covered by tests; see `src/data/workbook-calculations.ts`. Test/exam limits are 40/60. The workbook formulas have not been validated against the actual spreadsheet calculation engine.
