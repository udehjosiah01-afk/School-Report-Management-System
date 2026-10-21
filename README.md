# Classfolio

A school results workspace inspired by the supplied senior secondary report-card workbook. The overview, score sheet, and report-card preview show how teachers can replace manual term calculations with a connected workflow.

The interactive preview includes 48 demonstration students across SS 1–3, twelve subjects, three terms, editable scores, automatically derived grades and rankings, CSV downloads, and printing for an individual report. Records are illustrative and edits reset when the page refreshes. No real student records have been imported.

## Technology

TanStack Start, React 19, TypeScript, Lucide icons, and responsive CSS, deployed through the Netlify Vite adapter. Sample records live in `src/data/fixtures.ts`.

## Local development

Use Node 22.13+ and install dependencies with `pnpm install`. Run `netlify dev --port 8889` to use the app with Netlify’s local environment. The deployment pipeline runs the configured build.

## Next steps

See `PLAN.md` for the roadmap: saved records and workbook import, school-approved calculation rules, staff accounts, result approval, and annual reporting. The preview uses the workbook’s grade boundaries and competition ranking for ties. Test/exam limits of 40/60 and consistent grade-based remarks are preview assumptions requiring school confirmation before production computation.
