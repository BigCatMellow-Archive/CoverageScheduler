# Coverage Scheduler Wiki

Coverage Scheduler is a Google Sheets + Google Apps Script tool that helps a school assign substitute or coverage staff when teachers are absent.

This guide assumes **no previous experience with Google Apps Script, GitHub, or Coverage Scheduler**. Follow the pages in order the first time you install it.

## Start here

1. [Getting Started](Getting-Started.md) — what you need and what the different pieces mean.
2. [Install the Google Apps Script Project](Installing-Google-Apps-Script.md) — copy the files into your Google Sheet.
3. [Set Up the Workbook](Workbook-Setup.md) — run the one-time setup and create the required worksheet tabs.
4. [Teacher Schedule](Teacher-Schedule.md) — format the master schedule that Coverage Scheduler reads.
5. [Coverage Staff](Coverage-Staff.md) — tell the scheduler who is allowed to cover classes.
6. [Deploy the Web App](Deploying-the-Web-App.md) — create the full-screen Coverage Scheduler URL.
7. [Daily Workflow](Daily-Workflow.md) — how to use the scheduler on a normal school day.

## Reference pages

- [Workbook Sheet Reference](Workbook-Sheet-Reference.md)
- [How the Scheduler Makes Decisions](How-the-Scheduler-Works.md)
- [Troubleshooting](Troubleshooting.md)
- [Frequently Asked Questions](FAQ.md)

## The basic idea

Coverage Scheduler uses one Google spreadsheet as its database.

The most important tab is `Teacher Schedule`. That is the school's master schedule. A typical row looks like this:

```text
Teacher | Term | Day | Start | End | Class | Subject | Room
Smith, Jane | All Year | M | 8:30 AM | 9:15 AM | 5B | Science | Rm. 12
```

When a teacher is absent, the app looks at that teacher's schedule, finds the blocks that need coverage, checks the people listed on `Coverage Staff`, and builds a proposed coverage plan.

You review the plan before saving it.

## What you do not need

You do **not** need:

- a paid web server;
- a separate database;
- programming experience;
- a fixed period schedule;
- a separate permanent "Absent Staff" roster.

Google Sheets stores the data. Google Apps Script runs the scheduler and serves the web interface.

## Important privacy note

Do not put real staff schedules, absence records, student information, or other operational school data in the public GitHub repository.

The GitHub repository should contain the **software only**. Your real data belongs in your private Google Sheet.
