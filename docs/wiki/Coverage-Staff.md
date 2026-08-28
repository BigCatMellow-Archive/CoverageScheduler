# Coverage Staff

`Coverage Staff` tells Coverage Scheduler **who it is allowed to assign** when someone is absent.

The scheduler does not assume that every employee can cover classes. If a person is not listed here, automatic scheduling will not use them as ordinary coverage staff.

## The columns

| Column | What it means |
| --- | --- |
| `Name` | Person's name. Match Teacher Schedule spelling if they also teach. |
| `Role` | Descriptive role, such as Substitute, Teacher, Support, or Administrator. |
| `Coverage_Tier` | Priority group. Tier 1 is preferred before Tier 2, then Tier 3. |
| `Can_Cover_All_Day` | `Yes` if they are not constrained by Teacher Schedule free blocks. |
| `Active_Today` | Default on/off state. Date-specific changes can override it. |
| `Available_Days` | Weekdays they normally work, such as `M,T,W,R,F`. Blank means unrestricted. |
| `Default_Start` | Normal earliest coverage time. |
| `Default_End` | Normal latest coverage time. |
| `Allowed_Grades` | Optional grade restriction. Blank means unrestricted. |
| `Allowed_Subjects` | Optional subject restriction. Blank means unrestricted. |
| `Allowed_Assignment_Types` | Optional restriction such as Class, Homeroom, or Duty. |
| `Max_Blocks_Per_Day` | Optional maximum number of blocks. Blank means no explicit limit. |
| `Max_Teachers_Per_Day` | Optional maximum number of different absent teachers this person covers. |
| `Can_Be_Split_Across_Teachers` | Whether this person may cover pieces of multiple teachers' schedules. |
| `Notes` | Human-readable notes. |

## Simple full-day substitute example

A normal substitute who can cover anything all day can be entered like this:

```text
Name: Jordan Lee
Role: Substitute
Coverage_Tier: 1
Can_Cover_All_Day: Yes
Active_Today: Yes
Available_Days: M,T,W,R,F
Default_Start: 8:00 AM
Default_End: 3:00 PM
Allowed_Grades: [blank]
Allowed_Subjects: [blank]
Allowed_Assignment_Types: [blank]
Max_Blocks_Per_Day: [blank]
Max_Teachers_Per_Day: [blank]
Can_Be_Split_Across_Teachers: Yes
```

Blank restrictions mean "do not restrict this field."

## Teacher who may cover during free blocks

If an existing teacher can provide internal coverage during planning or break time, list them in `Coverage Staff` and use:

```text
Can_Cover_All_Day: No
```

Their `Name` should exactly match their name in `Teacher Schedule`.

The scheduler then checks their real schedule before assigning them.

Example:

```text
Name: Rivera, Alex
Role: Teacher
Coverage_Tier: 2
Can_Cover_All_Day: No
Active_Today: Yes
Available_Days: M,T,W,R,F
```

You do not need to manually type every free block into Coverage Staff. Those blocks come from Teacher Schedule.

## What are tiers?

Tiers are priorities, not guarantees.

A simple model is:

- **Tier 1** — dedicated substitutes; use first.
- **Tier 2** — internal staff who commonly provide coverage.
- **Tier 3** — last-resort or emergency coverage.

The scheduler still checks availability, restrictions, time conflicts, and limits. A Tier 1 person who is unavailable cannot be selected just because they are Tier 1.

## Date-specific availability

You usually do not need to edit the base `Active_Today` value every morning.

The web interface can turn a coverage person on or off for the selected date. That information is stored in `Substitute Availability` as a date-specific override.

For example, a substitute may normally work Monday through Friday but be unavailable on September 14. Turn them off for that date in the app rather than changing their permanent weekday settings.

## Recommended first setup

Start simple.

For each dedicated substitute, enter:

- Name
- Role
- Tier
- All-day Yes/No
- Active Today
- Available Days
- Start
- End

Leave advanced restrictions blank until you have a reason to use them.

Over-configuring every person on day one makes troubleshooting harder.
