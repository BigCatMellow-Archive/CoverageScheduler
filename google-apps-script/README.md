# Google Apps Script Version

This folder is the copy-ready Google Apps Script version of Coverage Scheduler.

The primary interface is now the **full-page web app** in `index.html`, based on the original Coverage Scheduler prototype layout. The older spreadsheet sidebar files are retained as an optional secondary interface.

## Files

- `code.gs` — web-app entry point, spreadsheet menu, and server wrappers
- `index.html` — full-page Coverage Scheduler interface
- `teacher-schedule-adapter.gs` — preserves and validates the existing Teacher Schedule source
- `setup.gs` — managed workbook sheets, validation, and defaults
- `scheduler.gs` — scheduling engine and Google Docs handout generation
- `sidebar.html` — optional spreadsheet sidebar markup
- `sidebarcss.html` — optional sidebar styles
- `sidebarjs.html` — optional sidebar browser logic
- `appsscript.json` — Apps Script project manifest

## Teacher Schedule source

The preferred `Teacher Schedule` tab is the existing operational schedule format:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

The scheduler reads this sheet directly. It does **not** require extra Grade, Assignment Type, coverage-needed, or cover-eligible columns. Those values are inferred at runtime from Class, Subject, and the block times.

`Start` and `End` are authoritative. The scheduler does not assume fixed school periods, so 30-, 45-, 60-, 90-, and other block lengths can coexist.

Break/planning rows are treated as possible coverage availability for staff who are also listed in `Coverage Staff`; teaching, homeroom, and duty rows are treated as occupied time. The existing scheduling engine also understands the older `Staff_Name`-style source schema for backward compatibility.

The `Term` column is currently informational when all rows are `All Year`. If seasonal/non-`All Year` terms are introduced, the validation command will warn that date-to-term mapping needs to be added before those rows can be filtered automatically.

## Install

1. Open the Google Sheet you want to use.
2. Confirm the live schedule is in a tab named **Teacher Schedule**.
3. Go to **Extensions → Apps Script**.
4. Create matching files and copy in the contents from this folder. For the full web interface, the required application files are:
   - `code.gs`
   - `teacher-schedule-adapter.gs`
   - `setup.gs`
   - `scheduler.gs`
   - `index.html`
5. If the manifest is hidden, open **Project Settings** and enable **Show `appsscript.json` manifest file in editor**, then replace it with this folder's manifest.
6. Save the project and reload the spreadsheet.
7. Run **Coverage Scheduler → Validate teacher schedule**.
8. Run **Coverage Scheduler → Set up workbook**.

Set up creates or repairs the scheduler-managed tabs but leaves the existing `Teacher Schedule` data and layout alone.

## Deploy the full-page interface

1. In the Apps Script editor choose **Deploy → New deployment**.
2. Choose **Web app**.
3. Set **Execute as** to yourself/the script owner so the app can read and write the scheduler workbook.
4. Choose the access level appropriate for the staff who will use the scheduler.
5. Deploy and authorize the requested Google Sheets/Docs permissions.
6. Open the generated `/exec` URL. That URL loads `index.html` as the full Coverage Scheduler application.

The web UI supports the original workflow: choose a date, add/edit absences, toggle coverage staff availability, generate the plan, inspect Timeline/Table/By Sub views, manually reassign blocks, save output, and create the handout document.

## Workbook binding

For the web-app execution context, `code.gs` currently points explicitly to the 2026–27 Coverage Scheduler workbook:

```text
1tLR_QPQyHD-w_FlAjb1HYtjxY6NLVy4E-WLmIln8AK8
```

This is intentional because a deployed Apps Script web app does not always have a spreadsheet UI context available. If the scheduler is moved to a different workbook, update `COVERAGE_SPREADSHEET_ID` near the top of `code.gs`.