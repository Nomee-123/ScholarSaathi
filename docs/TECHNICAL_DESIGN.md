# Technical design

This document describes the implementation currently present in the repository. It is not a roadmap or a claim that planned integrations are complete.

## Application structure

- `src/main.tsx` mounts the React application and registers `public/sw.js` when the browser supports service workers.
- `src/App.tsx` owns the top-level view, language, preparation progress, Finder data, online state, and optional Supabase authentication state. It selects the page component directly; the application does not use a routing library.
- `src/pages/` contains the home, scholarship Finder, scholarship guidance, preparation wizard, summary, and authentication views.
- `src/types/index.ts` defines the application data types, including `Scholarship`, Finder criteria, profile data, and preparation progress.
- `src/data/scholarships.ts` is the runtime scholarship catalogue. It exports a typed in-code array and helper-generated common guide/document records.
- `src/services/finder.ts`, `eligibility.ts`, and `preparation.ts` implement listing matching and filtering, the conservative preparation eligibility result, and preparation progress calculations.
- `src/services/storage.ts` reads and writes local application data using IndexedDB.
- `src/services/auth.ts`, `supabaseConfig.ts`, and `supabase.ts` provide optional email/password authentication through Supabase when both required public environment variables are configured.

## Data flow and matching

The Finder evaluates scholarship records against the student profile. Broad education bands, exact listed levels where present, and categories explicitly named in the portal listing can inform the display. They are listing comparisons, not complete scheme eligibility rules.

Verified criteria are considered only when the criterion has the required verification metadata and the user's answer can be compared using its configured operator. Unknown, incomplete, or unanswered criteria remain unresolved. The Finder can show a possible match based on a matching broad listing, but the result is not a determination of eligibility. Current source records mark scheme criteria unknown and `requirementsVerified` false.

The preparation wizard separately collects application type, study level, and state. `src/services/eligibility.ts` currently returns `needs-verification`; it does not calculate an eligible/ineligible determination. The preparation summary tracks answers and checklist items, not application submission or award likelihood.

## Local persistence

`src/services/storage.ts` uses the IndexedDB database `scholar-saathi`, version 1, with a `preparation` object store. It stores preparation progress under `current` and Finder profile plus saved scholarship IDs under `finder`. App writes are serialized. The app does not currently synchronize these records to Supabase.

Local browser storage is not encrypted by the application. Users can delete local progress, profile data, and saved scholarships using the in-app delete-data flow. Clearing browser site data can also remove the records.

## Optional authentication

Authentication is enabled only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present and pass the configuration checks in `src/services/supabaseConfig.ts`. The browser client accepts a Supabase publishable key or legacy anon key, not a secret/service-role key. These `VITE_` values are public in a client-side build.

Authentication supports email/password sign-in, sign-up, password reset, password update, and sign-out. Authentication is not cloud data synchronization: the Finder profile and saved scholarships remain in IndexedDB. Supabase setup instructions and the database migration are in `supabase/SETUP.md` and `supabase/migrations/`.

## Offline behavior

The service worker caches the application shell and same-origin assets under a versioned cache. It serves cached shell navigation when a network request fails and uses cached assets when available. This is limited offline support; it does not make authentication, external portals, or all network-dependent behavior available offline.

## Sample data and verification

`sample-data/scholarships.json` is a standalone JSON copy of the current application catalogue for development and testing. The app imports `src/data/scholarships.ts`; it does not load the JSON file at runtime. The sample copy does not independently verify source URLs, dates, eligibility criteria, or deadlines.

There are no automated test files or `test` script in `package.json`. The available checks are `npm run lint` and `npm run build`. Manual behavior cases are documented in `docs/TEST_CASES.md`.
