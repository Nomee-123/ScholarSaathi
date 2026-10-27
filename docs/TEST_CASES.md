# ScholarSaathi test cases

## What is automated today

There are currently no automated unit, integration, or browser test files in the repository, and `package.json` does not define a test script. `npm run build` checks TypeScript compilation and creates a production bundle; `npm run lint` runs ESLint. These checks are useful, but they are not automated behavioral tests.

The manual cases below describe expected behavior from the current implementation. **They have not been executed** as part of preparing this document. Do not treat them as passing tests until someone follows the steps in the running app.

## Manual cases — not executed

Use the development server (`npm run dev`) and open the local URL it prints. The examples below use the included sample records; their portal-notice dates are historical snapshots from the source records and must not be interpreted as current deadlines or availability.

### TC-01 — Search and filter scholarship results

**Status:** Manual; not executed.

1. In the Finder profile, choose **Undergraduate** and **Unknown / not sure** for marks; save the profile. Open **Find scholarships** and locate the results.
2. Search for `PM YASASVI`. Confirm the school and college sample records are shown, and unrelated records are hidden.
3. Clear the search and set **Level filter** to **Postgraduate**. Confirm the National Scholarship for Post Graduate Studies record appears and school-level records are filtered out.
4. Set **Category filter** to **OBC**. Confirm the records whose listing names OBC remain; records with no listed categories are not excluded solely because their category list is empty.
5. Set **Result status** to **Possible match**. Confirm only possible results are shown. With the current sample records, none should be labelled as a confirmed eligibility decision.
6. Clear the status filter and set **Level filter** to **All levels**, leaving the category filter in place. Change **Sort** to **Name** and confirm the visible results are alphabetical. Use **Clear filters** to restore the full list.

**Expected:** Search matches scholarship name and short name without case sensitivity. Level, category, and status narrow the displayed records; sorting by name is alphabetical. Empty results show the empty state and are not an eligibility decision.

### TC-02 — Unknown criteria do not become an eligibility pass

**Status:** Manual; not executed.

1. Open the Finder profile and choose **Undergraduate** (or **Postgraduate**) and **Unknown / not sure** for marks. Save the profile.
2. Review a college-level sample record, such as **PM YASASVI College**.
3. Open its match explanation and its list of items to verify.
4. Repeat with the profile's academic level set to **Unknown / not sure**.

**Expected:** With a matching broad education band, the record can be a **Possible match**, but unknown scheme criteria remain listed for verification and do not produce a confirmed match. With an unknown academic level, the result requires verification because the broad listing cannot be compared. Neither result should be presented as a rejection or an eligibility guarantee. The records currently mark scheme criteria as unknown and `requirementsVerified` as false.

### TC-03 — Validate the Finder profile

**Status:** Manual; not executed.

1. Open the Finder profile, leave **Academic level** empty, and select **Save profile**.
2. Choose **Undergraduate**, leave **Marks information** unselected, and save again.
3. Choose **I know my percentage**, leave the percentage blank, and save.
4. Enter `-1`, then `100.01`, as marks. Confirm each value is rejected with validation feedback and does not replace the last valid value.
5. Enter `0` and save; then try `100` and save.
6. Select **Unknown / not sure** for marks and save. Also try **Unknown / not sure** for academic level; marks need not be supplied for that level.
7. Enter a negative annual family income, then `0`. Confirm the negative value triggers validation feedback and is not saved into the profile, while zero is accepted. Income remains optional.

**Expected:** Saving requires an academic-level choice and, for a known academic level, a marks-status choice. A known marks value is required when marks status is known and must be between 0 and 100 inclusive. Unknown marks (or an unknown academic level) can be saved without a numeric mark. Income is optional; the input handler rejects negative values and accepts zero or greater. The save action does not itself block on the income validation message. Income has no additional scheme-specific eligibility effect in these sample records.

### TC-04 — Save and unsave a scholarship

**Status:** Manual; not executed.

1. In the results, save any scholarship and confirm its button changes to the saved state.
2. Turn on **Saved only** and confirm the saved record remains visible.
3. Unsave it from the result card or the saved-scholarships section. Confirm it disappears from **Saved only** results.
4. Save a record, reload the page, and confirm the saved state remains.
5. Use **Delete saved data**, confirm the action, and verify that saved scholarships and the Finder profile are cleared from this browser.

**Expected:** Saved IDs are toggled in local Finder data, the saved-only filter uses those IDs, and the state is persisted in browser IndexedDB. Deleting saved data clears the saved IDs and profile as well as preparation progress. This is local-device persistence, not cloud synchronization.

### TC-05 — Calculate preparation progress

**Status:** Manual; not executed.

Use **PM-USP CSSS**, which currently has three checklist items, for a six-task example (three preparation answers plus three checklist items).

1. Start preparation and open the summary without answering any preparation questions or marking any checklist item ready.
2. Answer two of the three questions and mark one checklist item **Prepared / done**. Leave the other checklist entries unset, **Not prepared**, or **Needs checking**.
3. Mark all three checklist items ready and complete all three questions.
4. If possible, also check the initial state when there is no selected scholarship.

**Expected:** The initial selected-scholarship progress is `0 / 6` or `0%`. Step 2 is `3 / 6` or `50%`. Step 3 is `6 / 6` or `100%`. Only truthy answers count as completed answers, and only documents whose state is `ready` count as ready documents; `missing` and `verify` remain incomplete. Without a selected scholarship, the progress helper returns zero tasks and zero percent. Preparation progress measures checklist organization, not eligibility or application submission.

## Sample data

[`../sample-data/scholarships.json`](../sample-data/scholarships.json) is a JSON array shaped like the application's `Scholarship[]` type. **Every record in that file is a sample/illustrative record for development and testing**, copied from the current `src/data/scholarships.ts` data, not a separate authoritative data source. Existing source URLs, dates, and notices are reproduced as recorded; they have not been independently rechecked for this sample file and may be outdated. Eligibility criteria remain explicitly unknown/unverified in the source records. Verify current details on the official portal before relying on them.
