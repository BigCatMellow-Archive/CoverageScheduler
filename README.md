# Coverage Scheduler

Coverage Scheduler is a Google Sheets + Google Apps Script tool for planning staff coverage when teachers or other scheduled staff are absent.

The primary interface is a **full-page Google Apps Script web app**. An optional spreadsheet sidebar is also included. The application's live data stays in Google Sheets; the public GitHub repository contains the software and documentation.

## New user? Start here

The detailed beginner guide is written for someone with **zero previous Apps Script experience**:

**[Coverage Scheduler Beginner Guide](docs/wiki/Home.md)**

Recommended order:

1. [Getting Started](docs/wiki/Getting-Started.md)
2. [Install Google Apps Script](docs/wiki/Installing-Google-Apps-Script.md)
3. [Set Up the Workbook](docs/wiki/Workbook-Setup.md)
4. [Teacher Schedule](docs/wiki/Teacher-Schedule.md)
5. [Coverage Staff](docs/wiki/Coverage-Staff.md)
6. [Deploy the Web App](docs/wiki/Deploying-the-Web-App.md)
7. [Daily Workflow](docs/wiki/Daily-Workflow.md)
8. [Troubleshooting](docs/wiki/Troubleshooting.md)

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
  code.gs                       Spreadsheet/sidebar entry points
  teacher-schedule-adapter.gs  Preserves and validates Teacher Schedule
  setup.gs                      Workbook schemas, validation, and configuration
  scheduler.gs                  Scheduling engine, normalization, output, and handouts
  sidebar.html                  Apps Script sidebar markup
  sidebarcss.html               Sidebar styles
  sidebarjs.html                Sidebar client-side behavior

google-apps-script/
  code.gs                       Full web-app entry point and workbook binding
  index.html                    Full-page Coverage Scheduler UI
  teacher-schedule-adapter.gs  Teacher Schedule adapter/validator
  setup.gs                      Workbook setup
  scheduler.gs                  Scheduling engine
  sidebar*.html                 Optional Sheet sidebar
  appsscript.json               Apps Script manifest

prototype/
  coverage-scheduler.html             Browser-only interface prototype
  coverage-scheduler-standalone.html  Self-contained prototype build
  tweaks-panel.jsx                    Prototype editing/tweaks helper

docs/
  wiki/                  Beginner/operator documentation
  ARCHITECTURE.md        Data flow and scheduler design
  TEACHER-SCHEDULE.md    Teacher Schedule source format and inference rules
  REVIEW.md              Repository/code review findings and technical debt
```

## Teacher Schedule source

Coverage Scheduler uses the existing `Teacher Schedule` tab directly. The preferred source format is:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

Each row represents one block of one teacher's day. `Start` and `End` are authoritative; the scheduler does not assume fixed school periods.

The source sheet does **not** need extra columns for grade, assignment type, coverage-needed status, or cover eligibility. The scheduler infers those values at runtime from `Class`, `Subject`, and the block times.

The setup command deliberately leaves an existing `Teacher Schedule` sheet unchanged. See [`docs/wiki/Teacher-Schedule.md`](docs/wiki/Teacher-Schedule.md).

## Install in Google Sheets

For the most direct installation, use the files in `google-apps-script/` and follow the [beginner installation guide](docs/wiki/Installing-Google-Apps-Script.md).

In summary:

1. Open the Google Sheet that will hold the coverage system.
2. Make sure the operational schedule is in a tab named **Teacher Schedule**.
3. Open **Extensions → Apps Script**.
4. Copy the `.gs`, `.html`, and manifest files from `google-apps-script/`.
5. Save the project and reload the spreadsheet.
6. Use **Coverage Scheduler → Set up workbook**.
7. Use **Coverage Scheduler → Validate teacher schedule**.
8. Populate `Coverage Staff`.
9. Deploy the project as a Web App and use its `/exec` URL.

The setup command stores the target spreadsheet ID privately in Apps Script Script Properties. The public repository does not need a hard-coded operational spreadsheet ID.

## Workbook model

| Sheet | Purpose |
| --- | --- |
| `Teacher Schedule` | Existing operational teacher schedule; source of truth |
| `Coverage Staff` | Coverage personnel, priority tier, limits, and restrictions |
| `Substitute Availability` | Date-specific availability overrides |
| `Daily Absences` | Staff absences for a selected date |
| `Coverage Output` | Saved coverage assignments |
| `Lists` | Validation lists used by the workbook |
| `Config` | Scheduler settings |
| `_Preview` | Temporary generated preview data |

`Lists` and `_Preview` are helper sheets and are hidden by the setup routine.

## Typical workflow

1. Open the web app and select a date.
2. Add full-day, partial-day, or emergency absences.
3. Confirm which coverage staff are available that day.
4. Generate a plan.
5. Review assigned and unfilled blocks in Timeline, Table, or By Sub view.
6. Manually adjust blocks when necessary.
7. Save the approved plan to `Coverage Output`.
8. Optionally create a Google Docs handout for the people covering classes.

## Scheduling approach

The scheduler is heuristic rather than a mathematical optimizer. It makes a series of practical choices rather than trying every possible schedule combination.

It generally:

1. Honors manually preferred assignments first.
2. Prioritizes absences that have fewer whole-day coverage options.
3. Attempts a whole-day assignment when configured to do so.
4. Uses split coverage when necessary and allowed.
5. Rejects automatic candidates who are unavailable, already assigned at the same time, outside configured restrictions, or over their limits.
6. Scores remaining candidates to favor higher-priority tiers, continuity with the same teacher, and lower existing workload.

See [`docs/wiki/How-the-Scheduler-Works.md`](docs/wiki/How-the-Scheduler-Works.md) for a plain-language explanation and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for implementation detail.

## Privacy and repository safety

Do **not** commit live school data to this repository. Staff schedules, absence records, substitute availability, student information, spreadsheet exports, and local credentials should remain outside version control.

The included `.gitignore` blocks common spreadsheet/data exports and local clasp configuration by default. If sample data is added later, it should be deliberately anonymized.

See [`SECURITY.md`](SECURITY.md).

## Prototypes

Files in `prototype/` are interface experiments. They intentionally contain mock names and mock schedules so the interface can be opened without a live Google Sheet. They should not be treated as the authoritative scheduling implementation.

## Current limitations

- There is no automated test suite yet.
- There is no CI workflow yet.
- The scheduling algorithm is heuristic and can produce a valid but non-optimal assignment when many constraints compete.
- `Term` is currently treated as informational when the schedule uses `All Year`; seasonal/non-`All Year` schedules need explicit date-to-term mapping.
- Numeric grade inference is strongest for class labels containing a grade number; PreK/Kindergarten/Beginner labels need care when using strict grade restrictions.
- The Apps Script project is installed manually rather than through an automated package installer.

## License

No open-source license is currently included. Unless a license is added, normal copyright restrictions apply.
