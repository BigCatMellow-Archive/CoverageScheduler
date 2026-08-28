# Getting Started

This page explains the pieces of Coverage Scheduler before you install anything.

## What you need

You need:

- a Google account that can edit the target Google Sheet;
- a Google Sheet that will hold the coverage system;
- a `Teacher Schedule` tab in that spreadsheet;
- permission to use **Extensions → Apps Script** in Google Sheets;
- the files from the repository's `google-apps-script/` folder.

You do not need to install software on your computer.

## Three things that are easy to confuse

### 1. The Google Sheet

This is where your school data lives.

It contains tabs such as:

- `Teacher Schedule`
- `Coverage Staff`
- `Daily Absences`
- `Coverage Output`

Think of the spreadsheet as the application's database.

### 2. The Apps Script project

Open the spreadsheet and choose:

**Extensions → Apps Script**

That opens Google's code editor. The files from `google-apps-script/` are copied into that editor.

The script is attached to the spreadsheet.

### 3. The web app

The web app is the full-screen Coverage Scheduler interface.

After the script is installed, Google gives you a URL ending in `/exec`. You can bookmark that URL and use Coverage Scheduler without opening the Apps Script editor every day.

## First-time installation checklist

Before you expect the web app to work, all of these must be true:

- [ ] The spreadsheet contains a tab named exactly `Teacher Schedule`.
- [ ] The Apps Script project contains all files from `google-apps-script/`.
- [ ] You have run **Coverage Scheduler → Set up workbook** once from the spreadsheet.
- [ ] You approved Google's permission prompts.
- [ ] `Coverage Staff` contains at least one person who can provide coverage.
- [ ] You deployed the Apps Script project as a Web App.
- [ ] You opened the current `/exec` deployment URL.

If the web app opens but displays an error, start with [Troubleshooting](Troubleshooting.md).

## Recommended order

Do not deploy first and try to fix the workbook afterward. The least confusing order is:

1. Prepare `Teacher Schedule`.
2. Install the Apps Script files.
3. Reload the Google Sheet.
4. Run **Set up workbook**.
5. Fill in `Coverage Staff`.
6. Deploy the web app.
7. Test one simple absence.

## A good first test

For your first test, use:

- one teacher with a normal full-day schedule;
- one full-day substitute in `Coverage Staff`;
- a weekday where both have usable schedules.

Mark the teacher absent and click **Generate Plan**. This is easier to troubleshoot than beginning with multiple partial-day absences and several coverage rules at once.
