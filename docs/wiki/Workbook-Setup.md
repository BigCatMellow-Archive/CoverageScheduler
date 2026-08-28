# Set Up the Workbook

After the code is installed, run the one-time setup from the Google Sheet.

## Step 1 — Return to the spreadsheet

Go back to the Google Sheet that contains `Teacher Schedule`.

Reload the page.

After a few seconds, a new menu should appear near the top of Google Sheets:

**Coverage Scheduler**

If the menu does not appear, see [Troubleshooting](Troubleshooting.md).

## Step 2 — Run the setup command

Choose:

**Coverage Scheduler → Set up workbook**

The first time you do this, Google may ask you to authorize the script.

### If Google asks for permission

1. Click **Review permissions**.
2. Choose the Google account that owns or can edit the spreadsheet.
3. Review the requested permissions.
4. Click **Allow**.

Coverage Scheduler needs spreadsheet access because it reads and writes workbook tabs. It also needs Google Docs access when you ask it to create coverage handouts.

## What setup does

Setup remembers this spreadsheet as the workbook used by the standalone web app.

It creates or repairs these scheduler-managed tabs:

```text
Coverage Staff
Substitute Availability
Daily Absences
Coverage Output
Lists
Config
_Preview
```

It also checks for:

```text
Staff List
```

If `Staff List` does not exist, setup creates it with a `Teacher` column. If the list is empty, it seeds unique names from `Teacher Schedule`.

If you already have a populated `Staff List`, setup leaves your roster alone.

Setup does **not** replace the existing `Teacher Schedule` data.

`Lists` and `_Preview` are helper tabs and may be hidden automatically.

## What should exist afterward

Your workbook should contain at least:

| Tab | Created by | Purpose |
| --- | --- | --- |
| `Teacher Schedule` | You | Master schedule and source of truth |
| `Staff List` | Setup or you | Stable roster used by + Add Absence |
| `Coverage Staff` | Setup | People the scheduler may assign; normally managed from the web UI |
| `Substitute Availability` | Setup | Date-specific coverage-team availability changes |
| `Daily Absences` | Setup | Absences entered through the app |
| `Coverage Output` | Setup | Saved final coverage plans |
| `Lists` | Setup | Internal validation lists |
| `Config` | Setup | Scheduler settings |
| `_Preview` | Setup | Temporary generated plan |

## Step 3 — Validate Teacher Schedule

Choose:

**Coverage Scheduler → Validate teacher schedule**

A dialog reports:

- number of schedule rows;
- number of teachers found;
- terms found;
- structural warnings.

Warnings do not always mean the system cannot run, but read them before using the scheduler for real coverage.

## Step 4 — Open the web app

Once the web app is deployed, normal configuration is done there.

Use:

- **+ Add Absence** to mark a teacher absent;
- **+ Coverage Staff** to build the coverage team;
- the availability switches to turn coverage people on or off for a particular date.

You should not need to manually type into `Daily Absences` or `Coverage Staff` for routine use.

## Can I run setup again?

Yes. The setup process is designed to create or repair the scheduler-managed tabs without replacing the operational `Teacher Schedule` or a populated `Staff List`.

Re-running setup is appropriate if:

- you accidentally deleted a helper tab;
- you installed a newer version of the script;
- a required header is missing from a scheduler-managed tab.

It is still sensible to keep normal Google Drive version history or backups for an operational school workbook.

## Next step

Read [Staff List](Staff-List.md), then [Coverage Staff](Coverage-Staff.md).