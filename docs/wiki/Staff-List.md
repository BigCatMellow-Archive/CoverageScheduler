# Staff List

`Staff List` is the roster used by the web app when you click **+ Add Absence**.

This is deliberately separate from `Teacher Schedule`.

`Teacher Schedule` answers:

> What is this person doing at a particular time?

`Staff List` answers:

> Which people should appear in the absence picker?

## Required format

The simplest and preferred format is one column:

```text
Teacher
Abonge, Chantal
Aljets, D.
Andre, Susan
...
```

The header should be:

```text
Teacher
```

Each teacher appears once underneath it.

## Do I have to create Staff List manually?

No.

When you run **Coverage Scheduler → Set up workbook**, the current version checks for `Staff List`.

If the tab does not exist, the scheduler creates it.

If it is empty, the scheduler fills it with unique teacher names found in `Teacher Schedule`.

If you already have a populated `Staff List`, the scheduler leaves your list alone.

## Why use Staff List instead of generating the picker from today's schedule?

A person's schedule may be unusual on a particular weekday, or schedule data may not contain exactly the rows the UI expected.

Using `Staff List` means the absence picker has a stable roster independent of the selected weekday.

The app then looks up the selected person's schedule for that day to determine the blocks that may need coverage.

## Matching Teacher Schedule

When the web app loads a teacher from `Staff List`, it also looks for that teacher in `Teacher Schedule`.

It tolerates ordinary punctuation/capitalization differences when finding the matching schedule name.

When a match is found, the app uses the exact `Teacher Schedule` name internally when saving the absence. This matters because coverage generation ultimately works from the schedule rows.

## What if a teacher appears in Staff List but not Teacher Schedule that day?

They still appear in **+ Add Absence**.

The modal tells you that no matching schedule blocks were found for the selected weekday.

You can still record the absence, but the scheduler cannot generate class coverage for that person unless matching Teacher Schedule rows exist.

## Adding or removing teachers

`Staff List` is intended to be the simple master roster. Add or remove names in that one-column sheet when the school's staff roster changes.

You do not need to copy a teacher's schedule into this tab. Their actual blocks continue to live only in `Teacher Schedule`.

## Staff List is not Coverage Staff

These are different concepts:

- **Staff List** = people who may be absent and should appear in the absence picker.
- **Coverage Staff** = people the scheduler is allowed to assign as coverage.

A person can appear in both. For example, a teacher may appear in Staff List and also be added to Coverage Staff so they can cover classes during free periods.