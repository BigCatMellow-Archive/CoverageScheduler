# Google Apps Script Version

This folder is the copy-ready Google Apps Script version of Coverage Scheduler.

## Files

- `code.gs` — spreadsheet menu and entry points
- `setup.gs` — workbook creation, headers, validation, and defaults
- `scheduler.gs` — scheduling engine and Google Docs handout generation
- `sidebar.html` — sidebar markup
- `sidebarcss.html` — sidebar styles
- `sidebarjs.html` — sidebar browser logic
- `appsscript.json` — Apps Script project manifest

## Install

1. Open the Google Sheet you want to use.
2. Go to **Extensions → Apps Script**.
3. Create matching script/HTML files and copy in the contents from this folder.
4. If the manifest is hidden, open **Project Settings** and enable **Show `appsscript.json` manifest file in editor**.
5. Replace the generated manifest with this folder's `appsscript.json`.
6. Save the project and reload the spreadsheet.
7. Run **Coverage Scheduler → Set up workbook**.

The script is designed to be bound to the spreadsheet it operates on; no spreadsheet ID is hard-coded.
