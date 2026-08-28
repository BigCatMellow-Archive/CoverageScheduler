# Google Apps Script Version

This folder is the copy-ready Google Apps Script version of Coverage Scheduler.

The primary interface is the **full-page web app** in `index.html`, based on the original Coverage Scheduler layout. The spreadsheet sidebar files are retained as an optional secondary interface.

For a complete first-time-user walkthrough, start with [`docs/wiki/Home.md`](../docs/wiki/Home.md).

## Files

- `code.gs` — web-app entry point, spreadsheet menu, workbook binding, and server wrappers
- `index.html` — full-page Coverage Scheduler interface
- `teacher-schedule-adapter.gs` — preserves and validates the existing Teacher Schedule source
- `setup.gs` — managed workbook sheets, validation, and defaults
- `scheduler.gs` — scheduling engine and Google Docs handout generation
- `sidebar.html` — optional spreadsheet sidebar markup
- `sidebarcss.html` — optional sidebar styles
- `sidebarjs.html` — optional sidebar browser logic
- `appsscript.json` — Apps Script project manifest

## Teacher Schedule source

The preferred `Teacher Schedule` tab is the operational schedule format:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

The scheduler reads this sheet directly. It does **not** require extra Grade, Assignment Type, coverage-needed, or cover-eligible columns. Those values are inferred at runtime from Class, Subject, and the block times.

`Start` and `End` are authoritative. The scheduler does not assume fixed school periods, so 30-, 45-, 60-, 90-, and other block lengths can coexist.

Break/planning rows are treated as possible coverage availability for staff who are also listed in `Coverage Staff`; teaching, homeroom, and duty rows are treated as occupied time.

The `Term` column is currently informational when all rows are `All Year`. If seasonal/non-`All Year` terms are introduced, the validation command warns that date-to-term mapping needs to be added before those rows can be filtered automatically.

## Install

1. Open the Google Sheet you want to use.
2. Confirm the live schedule is in a tab named **Teacher Schedule**.
3. Go to **Extensions → Apps Script**.
4. Create matching files and copy in the contents from this folder:
   - `code.gs`
   - `teacher-schedule-adapter.gs`
   - `setup.gs`
   - `scheduler.gs`
   - `index.html`
   - `sidebar.html`
   - `sidebarcss.html`
   - `sidebarjs.html`
5. If the manifest is hidden, open **Project Settings** and enable **Show `appsscript.json` manifest file in editor**, then replace it with this folder's manifest.
6. Save the project and reload the spreadsheet.
7. Choose **Coverage Scheduler → Set up workbook**. This both creates the required scheduler tabs and remembers this spreadsheet for the standalone web app.
8. Choose **Coverage Scheduler → Validate teacher schedule**.
9. Populate `Coverage Staff` with the people who are allowed to provide coverage.

Set up creates or repairs the scheduler-managed tabs but leaves the existing `Teacher Schedule` data and layout alone.

## Deploy the full-page interface

1. In the Apps Script editor choose **Deploy → New deployment**.
2. Choose **Web app**.
3. Choose the execution identity and access level appropriate for your organization.
4. Deploy and authorize the requested Google Sheets/Docs permissions.
5. Open the generated `/exec` URL.

The web UI supports the normal workflow: choose a date, add/edit absences, toggle coverage staff availability, generate the plan, inspect Timeline/Table/By Sub views, manually reassign blocks, save output, and create the handout document.

## Workbook binding

The public repository does **not** contain a hard-coded operational spreadsheet ID.

When you run **Coverage Scheduler → Set up workbook** from the target spreadsheet, `code.gs` stores that spreadsheet ID in Apps Script **Script Properties**. The standalone web app reopens that workbook on future requests.

If you copy the project to a different workbook, run **Set up workbook** from the new spreadsheet to update the stored connection.

## Updating an existing web deployment

Saving newer code in Apps Script does not automatically update a versioned production deployment.

After copying updated files:

1. choose **Deploy → Manage deployments**;
2. edit the existing Web App deployment;
3. select **New version**;
4. deploy again.

The existing `/exec` URL can continue to be used.
