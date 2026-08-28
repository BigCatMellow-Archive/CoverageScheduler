# Teacher Schedule Source Format

Coverage Scheduler is designed to read the school's existing `Teacher Schedule` tab directly rather than maintain a transformed copy.

## Preferred columns

| Column | Meaning |
| --- | --- |
| `Teacher` | Staff name repeated on every schedule row |
| `Term` | Schedule term, normally `All Year` |
| `Day` | `M`, `T`, `W`, `R`, or `F` |
| `Start` | Block start time |
| `End` | Block end time |
| `Class` | Class/group such as `7D`, `5B`, or `PreK-C`; may be blank for non-class blocks |
| `Subject` | Subject or activity such as `Science`, `Homeroom`, `Break`, or `Recess Duty` |
| `Room` | Room/location when applicable |

Each row represents one block. Block times are authoritative; there is no fixed-period assumption.

## Runtime inference

The scheduler derives fields that older versions expected as physical columns:

- grade from `Class` where possible
- assignment type from `Subject`
- whether an absent block needs coverage
- whether a non-teaching block can be used as coverage availability

Typical inference rules are:

- `Break` and planning/prep blocks: do not need absence coverage and can be used as staff availability
- `Lunch`: does not need absence coverage and is not used for coverage by default
- `Homeroom`, classes, and duties: need coverage and count as occupied time

## Setup behavior

Use `Coverage Scheduler → Set up workbook`. The Google Apps Script package routes this command through `teacher-schedule-adapter.gs`, which validates `Teacher Schedule`, leaves it unchanged, and creates/repairs only the scheduler-managed sheets.

Use `Coverage Scheduler → Validate teacher schedule` to check row counts, teacher counts, term values, day codes, and time validity without changing source data.

## Terms

The current schedule is expected to use `All Year`. If non-`All Year` term values are introduced, the validator warns about them. Automatic seasonal term selection requires a date-to-term mapping and is not inferred from the term name alone.

## Privacy

Do not commit the live schedule or exports of it to this public repository. Keep operational staff data in the bound Google Sheet.
