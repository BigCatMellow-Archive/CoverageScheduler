# Security and Privacy

Coverage Scheduler processes operational school staffing data. Treat the Google Sheet as private operational data and the GitHub repository as source code only.

## Do not commit

Do not commit real or export-derived data such as:

- staff schedules;
- absence records;
- substitute availability;
- student information;
- internal room/assignment data when it is considered sensitive;
- spreadsheet exports (`.xlsx`, `.csv`, and similar files);
- `.clasp.json` or other files containing Apps Script project identifiers;
- credentials, API keys, access tokens, or private URLs.

Use deliberately anonymized data for screenshots, fixtures, examples, and prototypes.

## If sensitive data is committed

Removing a file in a later commit does not remove it from Git history. If real sensitive data is accidentally committed, rotate any exposed credentials or identifiers as appropriate and remove the material from repository history rather than relying only on a normal deletion commit.

## Application permissions

The Apps Script project works with the active Google Sheet and creates Google Docs handouts. Review the authorization prompt before granting access and deploy the script only in Google accounts where that access is appropriate.
