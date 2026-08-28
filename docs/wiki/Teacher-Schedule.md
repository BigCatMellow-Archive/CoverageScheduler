# Teacher Schedule

`Teacher Schedule` is the master schedule Coverage Scheduler reads when deciding what an absent teacher needs covered and when another teacher may be free.

## Required tab name

The worksheet tab must be named exactly:

```text
Teacher Schedule
```

## Preferred columns

The recommended source format is:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

Example:

| Teacher | Term | Day | Start | End | Class | Subject | Room |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Smith, Jane | All Year | M | 8:00 AM | 8:30 AM | 5B | Homeroom | Rm. 12 |
| Smith, Jane | All Year | M | 8:30 AM | 9:15 AM | 5B | Science | Rm. 12 |
| Smith, Jane | All Year | M | 9:15 AM | 10:00 AM | 5C | Science | Rm. 12 |
| Smith, Jane | All Year | M | 10:00 AM | 11:00 AM |  | Break |  |

Each row is one block in one person's schedule.

## Column meanings

### Teacher

The staff name used throughout the system.

Use the same spelling everywhere. If `Smith, Jane` appears in Teacher Schedule but `Jane Smith` appears in Coverage Staff, the system treats those as different names.

### Term

The portion of the school year when the row applies.

`All Year` is fully supported.

The current scheduler does not yet map arbitrary term names to calendar date ranges. If you use terms other than `All Year`, the validation tool warns you because those rows are currently treated as matching their weekday regardless of date.

### Day

Use these weekday codes:

```text
M = Monday
T = Tuesday
W = Wednesday
R = Thursday
F = Friday
```

`R` is used for Thursday so Tuesday and Thursday are not both `T`.

### Start and End

These are the authoritative times for the block.

Coverage Scheduler does **not** require fixed periods. Different rows can be 30, 45, 60, 90, or other lengths.

Examples:

```text
8:00 AM | 8:30 AM
8:30 AM | 9:15 AM
10:00 AM | 11:00 AM
1:00 PM | 3:00 PM
```

### Class

The student group or class identifier, such as:

```text
5B
7D
PreK-C
Beg-B
```

For numeric grades, the scheduler can infer the grade number from this field. Non-numeric labels such as `PreK-C`, `K`, or `Beg-B` do not currently provide the same numeric grade inference, so be cautious with strict `Allowed_Grades` restrictions for those classes.

### Subject

What the teacher is doing during that block.

Examples include:

```text
Science
Language Arts
French
Homeroom
Break
Blue Top Recess Duty
Planning
Lunch
```

Coverage Scheduler uses this text to infer the type of block.

### Room

The room or location used in the final coverage plan and handouts.

## How block types are inferred

If you use the preferred eight-column schedule, you do not need to add columns such as `Assignment_Type` or `Needs_Coverage_If_Absent`.

The scheduler infers them.

In general:

| Subject text | Interpreted as | Needs coverage if teacher absent? | Can represent a free block for a coverage teacher? |
| --- | --- | --- | --- |
| `Homeroom` | Homeroom | Yes | No |
| contains `Duty` | Duty | Yes | No |
| contains `Break` | Break | No | Yes |
| contains `Plan` | Planning | No | Yes |
| contains `Lunch` | Lunch | No | No by default |
| normal academic subject | Class | Yes | No |

This means consistent subject labels matter.

## A teacher who can also provide coverage

A teacher may appear in both:

- `Teacher Schedule`, because they have a normal teaching schedule; and
- `Coverage Staff`, because the school allows them to cover during free periods.

If that person is configured with `Can_Cover_All_Day = No`, Coverage Scheduler checks the Teacher Schedule and only treats appropriate free/planning/break blocks as ordinary availability.

## Do not add fake free periods

The scheduler understands explicit breaks and planning blocks. Keep the source schedule truthful instead of changing class rows just to make someone appear available.

## Validation

After changing the schedule, run:

**Coverage Scheduler → Validate teacher schedule**

Use this especially after importing or replacing a large schedule.
