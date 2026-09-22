# Google Apps Script Version

This folder is the copy-ready Google Apps Script version of Coverage Scheduler.

The primary interface is the **full-page web app** in `index.html`, based on the original Coverage Scheduler layout. The spreadsheet sidebar files are retained as an optional secondary interface.

For a complete first-time-user walkthrough, start with [`docs/wiki/Home.md`](../docs/wiki/Home.md).

## Files

- `code.gs` — web-app entry point, spreadsheet menu, workbook binding, and server wrappers
- `web-ui-data.gs` — Staff List roster adapter and coverage-team create/edit/remove functions
- `handout.gs` — full-width, print-friendly Google Docs coverage handouts
- `index.html` — full-page Coverage Scheduler interface
- `teacher-schedule-adapter.gs` — preserves and validates the existing Teacher Schedule source
- `setup.gs` — managed workbook sheets, validation, and defaults
- `scheduler.gs` — scheduling engine, normalization, preview, and saved output
- `sidebar.html` — optional spreadsheet sidebar markup
- `sidebarcss.html` — optional sidebar styles
- `sidebarjs.html` — optional sidebar browser logic
- `appsscript.json` — Apps Script project manifest

## Teacher Schedule and Staff List

The preferred `Teacher Schedule` tab is:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

The scheduler reads this sheet directly. `Start` and `End` are authoritative; fixed school periods are not required.

The web app uses a separate `Staff List` tab as the roster shown in **+ Add Absence**. Its required header is simply:

```text
Teacher
```

If `Staff List` does not exist or is empty, setup creates it and seeds unique teacher names from `Teacher Schedule`. If it already contains names, the app leaves it alone and treats it as the roster source.

## Install

1. Open the Google Sheet you want to use.
2. Confirm the live schedule is in a tab named **Teacher Schedule**.
3. Go to **Extensions → Apps Script**.
4. Create matching files and copy in the contents from this folder:
   - `code.gs`
   - `web-ui-data.gs`
   - `handout.gs`
   - `teacher-schedule-adapter.gs`
   - `setup.gs`
   - `scheduler.gs`
   - `index.html`
   - `sidebar.html`
   - `sidebarcss.html`
   - `sidebarjs.html`
5. If the manifest is hidden, open **Project Settings** and enable **Show `appsscript.json` manifest file in editor**, then replace it with this folder's manifest.
6. Save the project and reload the spreadsheet.
7. Choose **Coverage Scheduler → Set up workbook**. This creates the scheduler tabs, creates/seeds `Staff List` when needed, and remembers this spreadsheet for the standalone web app.
8. Choose **Coverage Scheduler → Validate teacher schedule**.

You do **not** need to manually edit `Coverage Staff` for normal use. Open the web app and use **+ Coverage Staff** to add or edit the coverage team.

## Deploy the full-page interface

1. In the Apps Script editor choose **Deploy → New deployment**.
2. Choose **Web app**.
3. Choose the execution identity and access level appropriate for your organization.
4. Deploy and authorize the requested Google Sheets/Docs permissions.
5. Open the generated `/exec` URL.

The web UI supports the normal workflow: choose a date, add/edit absences, create/edit/remove coverage staff, toggle daily coverage availability, generate the plan, inspect Timeline/Table/By Sub views, manually reassign blocks, save output, and create the handout document.

For shared events such as field trips, use **+ Group Absence**. Select multiple staff members, choose the shared date or date range, and enter the common absence window. The app stores each selected person as a normal absence, so the existing scheduling engine automatically finds every overlapping class/duty block and assigns coverage without double-booking the same coverage person. Group absences use automatic assignment initially; individual blocks can still be manually reassigned after the plan is generated.

## Handouts

`handout.gs` creates one landscape page per coverage person with a full-width assignment table. The time column is intentionally wide enough for normal time ranges to stay on one line, while compact cell padding keeps rows short. The table uses the full printable width of the page with larger Subject and Absent Teacher columns for easier scanning.

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