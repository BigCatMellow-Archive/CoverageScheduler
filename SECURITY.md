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

## Web app deployment

For live school staffing data, restrict the deployed web app to the intended school/Google Workspace audience. Do not deploy the operational application for anonymous/public access.

Use the least-privileged execution/deployment arrangement that works with the school's sharing model, and review the Google authorization prompt when scopes change.

## Performance cache privacy

The performance layer does not introduce an external datastore. `Config` may be held briefly in Google Apps Script `CacheService` (up to 60 seconds). `Field Trip Coverage Pool` is stored inside the same private operational workbook and contains derived block-level staffing candidates, scores, and reasons. It may therefore expose staffing/schedule information to anyone who can view that workbook; workbook sharing must remain restricted to the intended school staff. `Teacher Schedule` itself is not persisted in cross-request CacheService. Source-sheet changes mark the pool stale so it is rebuilt before reuse.

Performance logs contain request names, timings, cache hit/read counts, and write counts only. They must not include staff names, absence notes, schedule rows, or assignment contents.
