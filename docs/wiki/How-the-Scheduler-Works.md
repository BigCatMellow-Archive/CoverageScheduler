# How the Scheduler Makes Decisions

Coverage Scheduler is a rule-based heuristic scheduler.

That means it makes practical decisions in a sequence instead of testing every mathematically possible combination.

The result should always be reviewed by a person before it is treated as final.

## Step 1 — Find the absent person's coverage blocks

For every absence, the scheduler reads that person's rows in `Teacher Schedule` for the selected weekday.

It ignores blocks that normally do not need coverage, such as ordinary breaks or planning time.

For a partial-day absence, it keeps only blocks that overlap the absence window.

## Step 2 — Read available coverage people

The scheduler reads `Coverage Staff` and applies any matching row from `Substitute Availability` for the selected date.

A candidate normally must be:

- active for the selected date;
- available on that weekday;
- inside their start/end availability window;
- allowed for the block's grade, subject, and assignment type when restrictions are configured;
- under their workload limits;
- free of another coverage assignment at the same time.

## Step 3 — Determine whether the person is actually free

### All-day coverage person

If `Can_Cover_All_Day = Yes`, the candidate is treated as generally available inside their configured availability window.

### Existing teacher providing internal coverage

If `Can_Cover_All_Day = No`, Coverage Scheduler looks for a matching free block in that person's `Teacher Schedule`.

Break/planning rows can represent normal coverage availability.

Teaching, homeroom, and duty rows are occupied time.

Lunch is not treated as normal coverage availability by default.

## Step 4 — Manual preferred assignments

If an absence has a `Preferred_Coverage` person, that assignment is processed before automatic scheduling.

This is an administrator override.

Because it is deliberately manual, review preferred assignments carefully for real-world feasibility.

## Step 5 — Decide which absences are hardest

For automatic scheduling, the engine estimates how many whole-day candidates can cover each absent person.

Absences with fewer options are handled earlier.

This reduces the chance that an easy assignment consumes the only person capable of handling a harder one.

## Step 6 — Try whole-day coverage

When `Whole_Day_First = TRUE`, the scheduler first tries to find one person who can cover every required block for an absent teacher.

This reduces handoffs and makes the day easier to understand.

If a valid whole-day candidate exists, the engine scores candidates and chooses the best fit.

## Step 7 — Fall back to split coverage

If one person cannot cover the entire day and `Allow_Split_Coverage = TRUE`, the scheduler tries split coverage.

It first looks for a strong primary candidate who can cover as much of the schedule as possible.

Remaining blocks are then filled individually.

## Candidate scoring

Among valid candidates, the scheduler generally favors:

- better coverage tier;
- keeping the same coverage person with the same absent teacher;
- adjacent blocks that maintain continuity;
- appropriate subject/grade matches when restrictions are configured;
- people who already have less coverage work that day;
- fewer unnecessary handoffs between absent teachers.

## Emergency behavior

Emergency absences can enable a special Tier 3 fallback path for eligible 7th/8th-grade teaching blocks.

Emergency pulls are intentionally penalized in scoring so normal coverage options are preferred when available.

This behavior should match school policy before being relied on operationally.

## Unfilled blocks

A block remains `Unfilled` when the scheduler cannot find a candidate who satisfies the active constraints.

Common reasons include:

- no coverage staff are active;
- everyone is already busy at that time;
- availability windows do not reach the block;
- grade/subject restrictions eliminate the remaining people;
- workload limits have been reached;
- an internal teacher has no free block spanning the required time.

An unfilled block is not necessarily a software error. It can be the correct result when no legal candidate exists.

## Why the result is called a preview

Generation writes to `_Preview` first.

That is intentional. The scheduler proposes a plan; a human reviews it; **Save Output** writes the approved version to `Coverage Output`.

## Is it an optimizer?

No.

The scheduler does not search every possible arrangement to prove that its plan is globally optimal. In a complicated day there may be another valid arrangement with fewer handoffs or better workload balance.

The current goal is a practical, understandable plan generated quickly enough for daily school operations.
