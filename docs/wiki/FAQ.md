# Frequently Asked Questions

## Do I need to know how to program?

No. The normal installation is copying the provided files into Google Apps Script and running the setup command.

Programming knowledge is only needed if you want to modify scheduler behavior.

## Do I need a server?

No. Google Apps Script hosts the web interface and runs the backend code.

## Where is the data stored?

Operational data is stored in the Google Sheet connected during setup.

The GitHub repository contains the software, not your live school data.

## Is there a separate Absent Staff worksheet I have to maintain?

No.

The available staff list comes from `Teacher Schedule`.

When you mark someone absent in the app, that date-specific absence is stored in `Daily Absences`.

## Do I need to copy Teacher Schedule into a special scheduler format?

No, if your source uses the supported format:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
```

Coverage Scheduler reads it directly.

## Does every school need the same period lengths?

No.

Start and End times are authoritative. Blocks can have different lengths.

## Why is Thursday `R`?

Tuesday already uses `T`, so Thursday uses `R`.

## Does Break mean the same thing as Planning?

Both can represent ordinary free time for an internal coverage teacher.

Neither normally creates a coverage need when that teacher is absent.

## Is Lunch available for coverage?

Not by default.

The default configuration keeps lunch out of ordinary coverage availability.

## Can a normal teacher be listed as coverage staff?

Yes.

Add the person to `Coverage Staff`, make sure their name exactly matches Teacher Schedule, and set:

```text
Can_Cover_All_Day = No
```

The scheduler then checks their free blocks.

## What does Can_Cover_All_Day mean?

`Yes` means the person's availability is mainly controlled by Coverage Staff start/end rules rather than by Teacher Schedule occupied/free blocks.

This is appropriate for a dedicated substitute who does not have a normal teaching schedule in the workbook.

`No` is appropriate for an internal teacher whose real schedule must be checked.

## What is a Tier?

A tier is a scheduling priority.

Tier 1 is generally preferred over Tier 2, and Tier 2 over Tier 3, provided the candidate is otherwise eligible.

## Can I turn a substitute off for just one day?

Yes.

Use the coverage-staff toggle in the web app for the selected date. That creates a date-specific `Substitute Availability` override.

## Can one substitute cover more than one absent teacher?

Yes, if their limits and split settings permit it and the times do not overlap.

Use `Max_Teachers_Per_Day` if you want a hard limit.

## Can the scheduler split one teacher's day among several people?

Yes, when `Allow_Split_Coverage` is enabled.

The scheduler tries whole-day continuity first by default, then falls back to split coverage.

## Why did the scheduler leave a block unfilled?

Because no candidate passed all active checks at that point in the schedule.

See [Troubleshooting](Troubleshooting.md) and [How the Scheduler Makes Decisions](How-the-Scheduler-Works.md).

## Does Generate Plan immediately change Coverage Output?

No.

Generation writes a temporary preview. Click **Save Output** after reviewing it.

## Can I manually change an assignment?

Yes. Click the generated block or row in the web interface and choose another active coverage person.

Review manual changes before saving.

## Can I run setup more than once?

Yes. Setup is intended to create or repair scheduler-managed worksheets and preserve the existing Teacher Schedule.

## Do I have to redeploy after changing Apps Script code?

For the production `/exec` web app, yes.

Save the files, then update the existing deployment to a **New version** under **Deploy → Manage deployments**.

## Is the `/dev` URL the same as `/exec`?

No.

`/dev` is a development/test URL available to script editors and follows the latest saved code.

`/exec` is the normal versioned deployment used by end users.

## Can I share the web-app URL with everyone?

Only according to your school's privacy/security policy and the access options permitted by your Google Workspace administrator.

Coverage Scheduler can expose operational staff and absence information, so treat the URL and sharing settings as school-internal unless your organization explicitly decides otherwise.

## Does the scheduler guarantee the mathematically best possible plan?

No.

It uses a practical heuristic. It can produce a valid plan without proving that no better arrangement exists.

Human review remains part of the workflow.
