# Standalone CBT service

The CBT service is a separate application subsystem. Its Express API uses only the dedicated Firebase project configured by `CBT_FIREBASE_PROJECT_ID`; it does not import, connect to, or write to Classfolio's Netlify Database or school records.

## Local setup

1. Create a Firebase project for CBT and enable Firestore.
2. Create a service account for that project. Keep its JSON key outside the repository. Copy `.env.example` to `.env` at the repository root and set:
   - `CBT_FIREBASE_PROJECT_ID` to the dedicated Firebase project ID.
   - `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of the service-account JSON file. On hosted infrastructure, use the platform's secret manager/Application Default Credentials instead.
   - `CBT_ADMIN_API_KEY` to a random secret of at least 32 characters.
3. In one terminal run `npm run cbt:dev`; in another run `npm run dev`. Vite proxies `/api` requests to the CBT API on port 3001.
4. Import the sample assessment with `npm --prefix cbt-secure-backend run import:sample`. This creates the SS1 Mathematics, First Term exam and its 30 fictional questions in the CBT Firebase project.

Student registration is administrator-only. Send `POST /api/students` with the `x-cbt-admin-key` header and a JSON body containing `fullName`, `admissionNumber`, and `classLevel`. The generated code is returned once and should be shared privately. Do not put the administrator key in frontend code or browser storage.

The student UI currently presents the sample SS1 Mathematics, First Term assessment. The API requires an active exam document, checks that the student's class matches, issues a time-limited attempt token, grades against server-side questions, and stores each result in the CBT project's `examResults` collection. An assessment can only be submitted once per student.

For deployment, host the CBT API separately from the Classfolio frontend, configure `CBT_ALLOWED_ORIGINS` with the exact deployed frontend origin(s), and set `VITE_CBT_API_URL` to the CBT API origin at frontend build time. Never deploy with a wildcard CORS origin or commit Firebase credentials.
