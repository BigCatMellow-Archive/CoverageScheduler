# Coverage Scheduler

Coverage Scheduler is a Google Sheets + Google Apps Script tool for planning staff coverage when teachers or other scheduled staff are absent.

The working application runs as a **sidebar inside a Google Sheet**. This repository also contains separate browser-only UI prototypes; those prototypes use mock data and are not the production application.

## What it does

- Reads the school's existing teacher schedule directly from Google Sheets.
- Creates and maintains the scheduler-managed workbook tabs.
- Records full-day, partial-day, and emergency absences.
- Tracks substitute/coverage staff availability by date and weekday.
- Supports coverage tiers, availability windows, grade/subject restrictions, and daily assignment limits.
- Tries to keep one coverage person with an absent teacher for the whole day when possible.
- Falls back to split coverage when a whole-day assignment is not possible.
- Checks assignment time conflicts and coverage limits.
- Generates a preview before writing assignments to the final output sheet.
- Creates Google Docs handouts from the generated coverage plan.

## Repository layout

```text
apps-script/
  code.gs                       Spreadsheet menu, sidebar bootstrap, and entry points
  teacher-schedule-adapter.gs  Preserves and validates the existing Teacher Schedule source
  setup.gs                      Managed workbook schemas, validation, and configuration
  scheduler.gs                  Scheduling engine, data normalization, output, and handouts
  sidebar.html                  Apps Script sidebar markup
  sidebarcss.html               Sidebar styles
  sidebarjs.html                Sidebar client-side behavior

google-apps-script/
  ...                           Copy-ready Apps Script package, including appsscript.json

prototype/
  coverage-scheduler.html             Browser-only interface prototype
  coverage-scheduler-standalone.html  Self-contained prototype build
  tweaks-panel.jsx                    Prototype editing/tweaks helper

docs/
  ARCHITECTURE.md        Data flow and scheduler design
  TEACHER-SCHEDULE.md   Teacher Schedule source format and inference rules
  REVIEW.md              Repository/code review findings and technical debt
```

## Teacher Schedule source

Coverage Scheduler now uses the existing `Teacher Schedule` tab directly. The preferred source format is:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

Each row represents one block of one teacher's day. `Start` and `End` are authoritative; the scheduler does not assume fixed school periods.

The source sheet does **not** need extra columns for grade, assignment type, coverage-needed status, or cover eligibility. The scheduler infers those values at runtime from `Class`, `Subject`, and the block times.

The setup command deliberately leaves an existing `Teacher Schedule` sheet unchanged. See [`docs/TEACHER-SCHEDULE.md`](docs/TEACHER-SCHEDULE.md).

## Install in Google Sheets

This is designed to be a **spreadsheet-bound Apps Script project**. It does not require a separate web server.

For the most direct installation, use the files in `google-apps-script/`.

1. Create or open the Google Sheet that will hold the coverage data.
2. Make sure the operational schedule is in a tab named **Teacher Schedule**.
3. In Google Sheets, open **Extensions → Apps Script**.
4. Add the four script files:
   - `code.gs`
   - `teacher-schedule-adapter.gs`
   - `setup.gs`
   - `scheduler.gs`
5. Add the three HTML files:
   - `sidebar.html`
   - `sidebarcss.html`
   - `sidebarjs.html`
6. If using the `google-apps-script/` package, copy its `appsscript.json` manifest as well.
7. Save the Apps Script project and reload the spreadsheet.
8. Use **Coverage Scheduler → Validate teacher schedule**.
9. Use **Coverage Scheduler → Set up workbook**.
10. Populate `Coverage Staff` and any other scheduler-managed configuration you need.
11. Use **Coverage Scheduler → Open coverage panel** to work with the scheduler.

Google will request authorization when the script first uses protected services. The project works with the active spreadsheet and uses Google Docs when generating handouts.

## Workbook model

| Sheet | Purpose |
| --- | --- |
| `Teacher Schedule` | Existing operational teacher schedule; treated as the source of truth |
| `Coverage Staff` | Coverage personnel, priority tier, limits, and restrictions |
| `Substitute Availability` | Date-specific availability overrides |
| `Daily Absences` | Staff absences for a selected date |
| `Coverage Output` | Saved coverage assignments |
| `Lists` | Validation lists used by the workbook |
| `Config` | Scheduler settings |
| `_Preview` | Temporary generated preview data |

`Lists` and `_Preview` are helper sheets and are hidden by the setup routine.

## Typical workflow

1. Select a date in the sidebar.
2. Mark the staff members who are absent and specify full-day or partial-day details.
3. Confirm which coverage staff are available that day.
4. Generate a preview.
5. Review assigned and unfilled blocks.
6. Save the approved plan to `Coverage Output`.
7. Optionally create a Google Docs handout for the people covering classes.

## Scheduling approach

The scheduler is heuristic rather than a mathematical optimizer. In plain terms, it makes a series of practical choices rather than trying every possible schedule combination.

It generally:

1. Honors manually preferred assignments first.
2. Prioritizes absences that have fewer whole-day coverage options.
3. Attempts a whole-day assignment when configured to do so.
4. Uses split coverage when necessary and allowed.
5. Rejects automatic candidates who are unavailable, already assigned at the same time, outside configured restrictions, or over their limits.
6. Scores remaining candidates to favor higher-priority tiers, continuity with the same teacher, and lower existing workload.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for more detail and [`docs/REVIEW.md`](docs/REVIEW.md) for review findings that were deliberately not changed in the original repository-cleanup pass.

## Privacy and repository safety

Do **not** commit live school data to this repository. Staff schedules, absence records, substitute availability, student information, spreadsheet exports, and local Apps Script identifiers should remain outside version control.

The included `.gitignore` blocks common spreadsheet/data exports and local clasp configuration by default. If sample data is added later, it should be deliberately anonymized.

The original upload included a teacher-scheduler workbook; it is intentionally excluded from the cleaned project tree. If that workbook contains real operational data, removing it in a later commit is not sufficient to remove it from Git history. See [`SECURITY.md`](SECURITY.md).

## Prototypes

Files in `prototype/` are interface experiments. They intentionally contain mock names and mock schedules so the interface can be opened without a live Google Sheet. They should not be treated as the authoritative scheduling implementation.

## Current limitations

- There is no automated test suite yet.
- There is no CI workflow yet.
- The scheduling algorithm is heuristic and can produce a valid but non-optimal assignment when many constraints compete.
- `Term` is currently treated as informational when the schedule uses `All Year`; seasonal/non-`All Year` schedules need explicit date-to-term mapping.
- The Apps Script project is currently installed manually rather than through a packaged deployment process.

## License

No open-source license is currently included. Unless a license is added, normal copyright restrictions apply.
