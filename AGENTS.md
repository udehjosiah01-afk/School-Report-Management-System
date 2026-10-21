# Classfolio architecture

Read `PLAN.md` before continuing implementation. The completed milestone is the visible product workspace; persistent data and authentication are subsequent milestones.

- `src/routes/index.tsx`: overview, score sheet, report preview, filters, print and CSV actions. Screens currently use local component state.
- `src/data/fixtures.ts`: all illustrative records, grade boundaries, remarks, and ordinal formatting. This is the replacement point for future real records.
- `src/routes/__root.tsx`: page metadata and document shell.
- `src/styles.css`: sage and cream design system, responsive layouts, print rules, and reduced-motion support.
- `netlify.toml` and `vite.config.ts`: deployment and TanStack Start integration.

Keep calculations derived from the selected class, term, subject, and score state. Rankings use competition ranking (1, 1, 3). Student report averages include all twelve sample subjects. Do not imply demo edits are persisted. The workbook contains inconsistent remark thresholds; preview remarks consistently follow grades. Confirm score weighting, blanks, grade rounding, annual aggregation, and subject registration rules before implementing production calculations.

Use Netlify Database with Drizzle for persistent school records and Netlify Identity for staff authentication in later milestones. Read the applicable platform skills before introducing these integrations. Do not persist records in local files or browser storage. Keep real workbook student details out of demonstration fixtures. Use accessible labels for controls and preserve mobile and print layouts.
