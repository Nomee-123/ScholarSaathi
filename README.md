# ScholarSaathi

ScholarSaathi is a private, browser-based preparation guide for students exploring scholarships on India's National Scholarship Portal. It helps students organise answers and a document checklist before they continue to the official portal.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, check code style with `npm run lint`, or serve the build locally with `npm run preview`.

## What the app does

- Browse two National Scholarship Portal scheme listings and open the official portal.
- Work through a short, one-question-at-a-time preparation guide in English or Hindi.
- Review a cautious pre-check and a preparation summary.
- Track example document checklist items as Ready, Missing, or Need to check.
- Save and restore preparation answers and checklist states in IndexedDB on this device.
- Reopen the app shell after the first successful online load using the service worker.
- Delete saved preparation data from the app.

## Scholarship information and privacy

The scheme listings link to the National Scholarship Portal (`https://scholarships.gov.in/`). The portal was checked on **26 October 2026**. The cards report the portal's dated notice snapshots: PM-USP CSSS renewals were listed as open with a 31 October 2026 student application closing date; PM YASASVI fresh applications were listed as open, while students in Rajasthan, Keralam and Karnataka were asked to wait. These are time-sensitive portal notices, not verified personal eligibility or enduring scheme rules; check the portal again before acting.

Scheme-specific eligibility criteria and required document lists are **not verified** by this demo. Confirm the current scheme notice, including which eligibility conditions apply (if any), the applicable fresh/renewal rules, and the exact required documents. Do not treat the checklist examples as authoritative. The eligibility result therefore remains **Needs verification**.

ScholarSaathi does not upload documents, submit applications, or guarantee eligibility or approval. Answers and checklist states are stored in this browser's IndexedDB. Clearing site data in the browser also removes them.

The service worker caches the built application shell and its local JavaScript/CSS assets. The first visit requires a network connection; external official portal links require a connection.
