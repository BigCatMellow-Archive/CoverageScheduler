# Google Apps Script Version

This folder is the copy-ready Google Apps Script version of Coverage Scheduler.

## Files

- `code.gs` — spreadsheet menu and entry points
- `teacher-schedule-adapter.gs` — preserves and validates the existing Teacher Schedule source
- `setup.gs` — managed workbook sheets, validation, and defaults
- `scheduler.gs` — scheduling engine and Google Docs handout generation
- `sidebar.html` — sidebar markup
- `sidebarcss.html` — sidebar styles
- `sidebarjs.html` — sidebar browser logic
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
4. Create matching script/HTML files and copy in the contents from this folder.
5. If the manifest is hidden, open **Project Settings** and enable **Show `appsscript.json` manifest file in editor**.
6. Replace the generated manifest with this folder's `appsscript.json`.
7. Save the project and reload the spreadsheet.
8. Run **Coverage Scheduler → Validate teacher schedule**.
9. Run **Coverage Scheduler → Set up workbook**.

Set up creates or repairs the scheduler-managed tabs but leaves the existing `Teacher Schedule` data and layout alone.

The script is bound to the spreadsheet it operates on; no spreadsheet ID is hard-coded.
