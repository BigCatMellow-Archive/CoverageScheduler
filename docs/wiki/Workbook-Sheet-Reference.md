# Workbook Sheet Reference

This page explains every worksheet used by Coverage Scheduler.

## Teacher Schedule

**Who maintains it:** School / scheduler administrator

**Purpose:** Source of truth for teacher schedules.

Preferred columns:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

Coverage Scheduler reads this sheet but the setup routine does not restructure it.

See [Teacher Schedule](Teacher-Schedule.md).

## Staff List

**Who maintains it:** School / scheduler administrator; setup can seed it initially

**Purpose:** Stable roster shown by **+ Add Absence**.

Preferred format:

```text
Teacher
Teacher Name 1
Teacher Name 2
...
```

If the tab is missing or empty, setup creates/seeds it from unique `Teacher Schedule` names. A populated Staff List is preserved.

See [Staff List](Staff-List.md).

## Coverage Staff

**Who maintains it:** Normally the web app through **+ Coverage Staff** and **Edit**

**Purpose:** Defines who may provide coverage and their normal rules.

Main fields include name, role, priority tier, all-day status, normal days/hours, optional restrictions, and workload limits.

See [Coverage Staff](Coverage-Staff.md).

## Substitute Availability

**Who maintains it:** Usually the web app

**Purpose:** Date-specific availability overrides.

Columns:

```text
Date | Day | Name | Available | Start | End | Notes
```

Example use: a substitute normally works Monday through Friday but is unavailable on one specific Tuesday.

The web UI's coverage-staff toggle writes this type of override.

## Daily Absences

**Who maintains it:** Usually the web app

**Purpose:** Records who is absent for a specific date.

Columns:

```text
Date
Day
Staff_Name
Absence_Type
Start_Override
End_Override
Notes
Preferred_Coverage
```

A full-day absence leaves the start/end override blank.

A partial-day absence can store a custom time window.

## Coverage Output

**Who maintains it:** Written by **Save Output**

**Purpose:** Stores approved/saved coverage assignments.

Important columns include:

```text
Date
Day
Start
End
Absent_Staff
Class
Grade
Subject
Assignment_Type
Room
Assigned_Coverage
Coverage_Mode
Coverage_Tier_Used
Status
Notes
```

This is the most useful sheet for reporting on final assignments.

## Lists

**Who maintains it:** Setup code

**Purpose:** Stores standard option lists used for data validation.

Examples include day codes, Yes/No values, absence types, assignment types, coverage tiers, and roles.

This is a helper sheet and is normally hidden.

## Config

**Who maintains it:** Setup code initially; advanced administrators may adjust values.

**Purpose:** Controls scheduler behavior.

Default settings include `Whole_Day_First`, `Allow_Split_Coverage`, workload limits, lunch coverage behavior, availability override behavior, and the script time zone.

See [How the Scheduler Works](How-the-Scheduler-Works.md) before changing these values.

## _Preview

**Who maintains it:** Scheduler engine

**Purpose:** Temporary generated plan before final output is saved.

The web interface reads this when creating previews and handouts.

This sheet is normally hidden.

## Sheet names matter

Do not casually rename these tabs. The code expects the standard names.

If a scheduler-managed tab is accidentally deleted, run:

**Coverage Scheduler → Set up workbook**

The setup routine can recreate missing scheduler-managed sheets.