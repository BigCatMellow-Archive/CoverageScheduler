# Install the Google Apps Script Project

This page walks through installation from the beginning.

## Step 1 — Open the target Google Sheet

Open the spreadsheet that will hold Coverage Scheduler.

Make sure it already has a worksheet tab named exactly:

```text
Teacher Schedule
```

The capitalization and space matter.

## Step 2 — Open Apps Script

In the Google Sheet menu, choose:

**Extensions → Apps Script**

A new browser tab opens with the Apps Script editor.

If Google created a file named `Code.gs`, you can rename it to `code.gs` or replace its contents with the repository version.

## Step 3 — Copy the script files

Open the repository folder:

`google-apps-script/`

Create these script files in Apps Script and copy the matching contents into each one:

```text
code.gs
web-ui-data.gs
teacher-schedule-adapter.gs
setup.gs
scheduler.gs
```

`web-ui-data.gs` is important. It connects the web interface to `Staff List` and handles adding/editing/removing coverage staff from the UI.

To create a script file:

1. In the left Files panel, click the **+** button.
2. Choose **Script**.
3. Enter the filename without worrying about the `.gs` extension if Google adds it automatically.
4. Paste the matching repository code.
5. Press **Ctrl+S** or click Save.

## Step 4 — Copy the HTML files

Create these HTML files the same way, but choose **HTML** when clicking the **+** button:

```text
index.html
sidebar.html
sidebarcss.html
sidebarjs.html
```

`index.html` is the full-screen web app interface.

The `sidebar*` files support the optional interface that opens inside Google Sheets.

## Step 5 — Add the manifest

The repository also includes:

```text
appsscript.json
```

If you do not see a manifest in Apps Script:

1. Click **Project Settings** in the left sidebar.
2. Turn on **Show `appsscript.json` manifest file in editor**.
3. Return to the Editor.
4. Open `appsscript.json`.
5. Replace its contents with the repository version.

## Step 6 — Save everything

Click Save or press **Ctrl+S**.

At this point the code is installed, but the workbook is **not configured yet**.

Continue to [Set Up the Workbook](Workbook-Setup.md).

## If Apps Script shows a syntax error

Check these common causes:

- Code from two different files was accidentally pasted into one file.
- An HTML file was created as a Script file, or vice versa.
- `web-ui-data.gs` was skipped.
- Part of a file was missed while copying.
- Smart quotes were introduced by another editor.

The easiest repair is usually to delete the affected file's contents and copy that file again directly from GitHub.