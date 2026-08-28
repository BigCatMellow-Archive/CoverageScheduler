# Architecture

Coverage Scheduler is a spreadsheet-bound Google Apps Script application. The Google Sheet is both the user data store and the administrative surface; Apps Script provides the scheduling logic and sidebar interface.

## Components

### `code.gs`

Provides the spreadsheet menu and top-level entry points. It opens the sidebar, loads the selected day's data, and exposes convenience actions such as preview generation and handout creation.

### `setup.gs`

Defines the workbook schema and creates missing sheets/headers. It also seeds validation lists and default configuration values, applies spreadsheet data validation, formats the sheets, and hides helper sheets.

### `scheduler.gs`

Contains the scheduling engine and most server-side data access. Its responsibilities include:

- reading sheet rows into normalized objects;
- interpreting schedule/coverage column aliases;
- applying date-specific substitute availability overrides;
- building coverage needs from absences and teacher schedules;
- checking candidate eligibility and time conflicts;
- choosing whole-day and split-coverage assignments;
- writing previews and approved output;
- generating Google Docs coverage handouts.

### Sidebar files

`sidebar.html`, `sidebarcss.html`, and `sidebarjs.html` form the Apps Script sidebar. Client-side actions call server-side Apps Script functions through `google.script.run`.

## Data flow

```text
Teacher Schedule ─┐
Coverage Staff ───┼──> normalize/read data ──┐
Availability ─────┤                          │
Daily Absences ───┘                          v
                                      scheduling engine
                                             │
                              ┌──────────────┴──────────────┐
                              v                             v
                          _Preview                    sidebar preview
                              │
                              v
                       Coverage Output
                              │
                              v
                     Google Docs handout
```

## Scheduling sequence

For a selected date and day code, the engine:

1. Reads the teacher schedule, active coverage staff, and saved absences.
2. Expands each absence into the schedule blocks that actually need coverage.
3. Applies any manually preferred coverage assignments first.
4. Orders remaining absences by difficulty, favoring cases with fewer whole-day candidates.
5. Attempts whole-day coverage when `Whole_Day_First` is enabled.
6. If needed and allowed, attempts split coverage.
7. Rejects automatic assignments that violate availability, time conflicts, daily block limits, teacher-count limits, or configured grade/subject/assignment restrictions.
8. Writes the proposed rows to `_Preview`.
9. On approval, replaces the selected date/day rows in `Coverage Output` with the preview.

This is a greedy heuristic. It makes locally sensible choices in sequence; it does not perform exhaustive constraint solving or guarantee a mathematically optimal schedule.

## Configuration

The setup routine currently seeds these settings:

- `Whole_Day_First`
- `Allow_Split_Coverage`
- `Default_Max_Blocks_Per_Day`
- `Default_Max_Teachers_Per_Day`
- `Use_Lunch_For_Coverage`
- `Availability_Override_Mode`
- `Script_Time_Zone`

Coverage-person-specific limits and restrictions are stored in `Coverage Staff`. Because some seeded settings are policy hooks or fallbacks, test the current scheduler path before assuming every seeded setting changes assignment behavior when a candidate field is blank.

## Date-specific availability

The `Coverage Staff` sheet stores normal/default availability. `Substitute Availability` stores overrides for a particular date. This allows the sidebar's ON/OFF switch and time controls to change one day's availability without destroying the person's normal schedule.

## Emergency behavior

Emergency absences are marked through the absence record. The scheduling engine can relax some normal grade/subject/assignment restrictions for emergency coverage and contains special Tier 3 emergency-pull logic for eligible seventh/eighth-grade blocks.

Because this behavior is policy-specific, it should be reviewed before adapting the repository to another school.

## Prototype boundary

The files in `prototype/` are intentionally separate from the Apps Script application. They use mock data and browser-loaded React/Babel to explore interface ideas. They do not read from the Google Sheet and should not be used as the source of truth for scheduling behavior.

## Testing priorities

The project does not currently contain automated tests. The highest-value future tests would cover:

1. overlapping-time conflict rejection;
2. full-day versus partial-day absence filtering;
3. whole-day candidate selection;
4. split-coverage continuity;
5. maximum blocks/teachers limits;
6. date-specific availability overrides;
7. emergency override behavior;
8. manual/preferred override behavior;
9. replacement of only the selected date/day in `Coverage Output`.
