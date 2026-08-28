# Troubleshooting

Start with the symptom you actually see. Do not reinstall everything unless the checks below point to a damaged installation.

## `NetworkError: Connection failure due to HTTP 404`

This usually points to the Apps Script web-app deployment rather than the teacher schedule itself.

### Check 1 — Are you using the deployed web-app URL?

For normal use, the URL should be the current Apps Script Web App deployment and normally ends in:

```text
/exec
```

Do not use a GitHub HTML-file URL as the live application. The web UI depends on `google.script.run`, which only works when the page is served by Apps Script.

### Check 2 — Did you deploy after adding `index.html` and the web functions?

Open Apps Script and choose:

**Deploy → Manage deployments**

Edit the Web App deployment, choose **New version**, and deploy again.

Saving code in the editor does not automatically update an older versioned `/exec` deployment.

### Check 3 — Are you opening an old deployment URL?

If you created multiple deployments, make sure your bookmark points to the deployment you are currently maintaining.

### Check 4 — Does the Apps Script project contain `index.html`?

The web app's `doGet()` loads a file named `index`.

The project therefore needs:

```text
index.html
```

### Check 5 — Reload after deployment

Close the old app tab and reopen the `/exec` URL after deploying the new version.

## The web app says it is not connected to a workbook

The current repository does not hard-code a spreadsheet ID.

Open the target Google Sheet, reload it, and choose:

**Coverage Scheduler → Set up workbook**

This stores the workbook ID privately in Apps Script Script Properties.

Then reload the web app.

## I do not see the Coverage Scheduler menu in Google Sheets

Try these in order:

1. Confirm `code.gs` exists in the Apps Script project.
2. Save the Apps Script project.
3. Return to the spreadsheet.
4. Reload the spreadsheet browser tab.
5. Wait several seconds for `onOpen()` to run.

If the menu still does not appear, open Apps Script and check **Executions** for an `onOpen` error.

## Setup asks for authorization

That is expected on first run.

Coverage Scheduler needs permission to work with the Google Sheet and to create Google Docs handouts.

If a managed school account blocks the requested authorization, your Google Workspace administrator may need to approve or permit Apps Script usage.

## Setup fails because Teacher Schedule is missing

Create or rename the source tab to exactly:

```text
Teacher Schedule
```

Then run setup again.

## The workbook only has Teacher Schedule and Sheet1

Setup has not been completed.

Run:

**Coverage Scheduler → Set up workbook**

The scheduler should create:

```text
Coverage Staff
Substitute Availability
Daily Absences
Coverage Output
Lists
Config
_Preview
```

## The app has no coverage people on the right

`Coverage Staff` is empty, or no usable rows were found.

Open the `Coverage Staff` worksheet and add at least one person.

See [Coverage Staff](Coverage-Staff.md).

## The absent teacher is not listed

Check:

1. Their name exists in `Teacher Schedule`.
2. They have rows for the selected weekday.
3. `Day` uses `M`, `T`, `W`, `R`, or `F`.
4. The selected date corresponds to that weekday.

Run **Coverage Scheduler → Validate teacher schedule** to catch structural issues.

## I marked someone absent but Generate Plan creates no blocks

Possible causes:

- the absence was not saved;
- that teacher has no schedule rows for the selected weekday;
- all of the person's matching rows are inferred as non-coverage blocks;
- a partial-day window does not overlap any coverage-needed block;
- Start/End values could not be interpreted.

Check the teacher's rows directly in `Teacher Schedule`.

## Everything is unfilled

Check `Coverage Staff` first.

For each expected coverage person, verify:

- `Active_Today` is Yes, or the web-app toggle is on for that date;
- `Available_Days` includes the selected weekday;
- Default Start/End cover the required time;
- grade/subject/type restrictions are not too narrow;
- workload limits are not already reached.

For internal teachers with `Can_Cover_All_Day = No`, they also need a free/planning/break row in Teacher Schedule that spans the required coverage block.

## A free teacher is not being selected

Coverage Scheduler requires the free block to contain the coverage block.

For example, if coverage is needed from 9:00–9:45, a teacher free only from 9:15–10:00 cannot cover the entire block.

Also check that the person's name matches exactly between `Teacher Schedule` and `Coverage Staff`.

## Thursday does not work

Use:

```text
R
```

for Thursday.

`T` means Tuesday.

## The web app still behaves like old code

This is almost always a deployment-version issue.

1. Save the Apps Script files.
2. Go to **Deploy → Manage deployments**.
3. Edit the Web App.
4. Select **New version**.
5. Deploy.
6. Reopen the `/exec` URL.

## Handout creation fails

Generate a coverage plan first. The handout command reads the latest generated preview.

Also make sure the account executing the web app is allowed to create Google Docs in Drive.

## Where do I see server-side errors?

In Apps Script:

1. Open the project.
2. Click **Executions** in the left sidebar.
3. Open the failed execution.
4. Read the exception and function name.

This is the best place to diagnose backend errors that the web interface can only summarize.

## I changed the code and now nothing works

Compare the Apps Script project against the files in `google-apps-script/`.

For a beginner, replacing the affected file completely is usually safer than trying to repair a partially copied block.
