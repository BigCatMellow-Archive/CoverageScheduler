# Performance Architecture

Coverage Scheduler keeps Google Sheets as the operational source of truth. The performance pass is designed to reduce calls to Spreadsheet service without moving school staffing data to another database or external service.

## What changed

### One read per sheet per server request

`readSheetObjects_()` now keeps a request-local copy of each sheet it reads. Repeated calls during the same web action reuse that in-memory copy instead of calling Google Sheets again.

Writes invalidate the affected request-local entry immediately, so later reads in the same request see the new data.

Generate primes the sheets it needs as a request snapshot. The normal web bootstrap deliberately does not preload `Teacher Schedule`; detailed teacher blocks are lazy-loaded only when a person is selected.

### Short Google-managed cache for stable sources

`Config` uses Apps Script `CacheService` for up to 60 seconds. `Teacher Schedule` deliberately does not use cross-request caching; it is kept only in the request-local snapshot.

Important properties:

- cache keys are scoped to the connected spreadsheet ID, so rebinding the script cannot reuse another workbook's cached values;
- the cache is an optimization only;
- Google Sheets remains authoritative;
- a cache miss always falls back to the sheet;
- app writes invalidate the matching cache entry;
- the spreadsheet-bound `onEdit(e)` handler invalidates the entry when a user manually edits a source/config sheet;
- Generate and validation requests read `Teacher Schedule` live and reuse it only within that request;
- the browser bootstrap does not load full Teacher Schedule blocks; a selected person's schedule is fetched on demand.

No external cache, database, API, or new credential is introduced.

### Materialized field-trip coverage pool

Field-trip coverage used to repeatedly rediscover and score candidates for every trip-created coverage block. The pool now materializes that expensive baseline work once.

The visible sheet `Field Trip Coverage Pool` contains one row per **field-trip coverage block × eligible candidate**.

- saving or editing a field trip rebuilds that event's block/candidate rows;
- each row stores the event, coverage block, candidate, source, baseline score, reason, `Enabled`, and `Priority_Adjustment`;
- deleting a field trip removes its pool rows;
- manual edits to `Teacher Schedule`, `Class Schedule`, `Field Trips`, `Config`, `Coverage Staff`, or `Substitute Availability` mark the pool stale;
- the next field-trip request rebuilds stale materialization before using it;
- days with no field trip do not read the pool;
- `Enabled = No` removes that candidate from that exact block;
- `Priority_Adjustment` changes ranking but cannot bypass hard live constraints;
- ordinary absences, trip participation, exact schedule conflicts, current assignments, and daily limits are still checked live.

The pool is a rebuildable planning index, not a replacement source of truth. Rebuilds preserve the operator-entered `Enabled` and `Priority_Adjustment` values for matching block/candidate rows.

### Lazy Teacher Schedule delivery

The initial web payload now contains the Staff List roster without every teacher's block-by-block schedule. When a user selects a teacher in the absence editor or a person in the manual coverage picker, the browser requests only that person's schedule for the selected date and keeps it locally for the rest of that date.

This reduces startup serialization and avoids a full Teacher Schedule read on normal bootstrap after setup is complete.

### Existing schedule index retained

The scheduler already indexes normalized Teacher Schedule rows by staff/day during a Generate request. That optimization is retained. Combined with request-level sheet caching, the same source rows are no longer fetched repeatedly before they reach that index.

### Batched row writes

Row-oriented saves that previously wrote individual cells now build the entire row and call `setValues()` once.

This is used by field trips, substitute availability, and Coverage Staff records through the shared row writer.

### Multi-day absence save

Adding one absence across several school days previously repeated this cycle for every date:

`read all absences -> rewrite all absences -> invalidate preview`

It now:

1. reads Daily Absences once;
2. applies every requested weekday in memory;
3. writes the sheet once;
4. invalidates affected preview dates once.

Duplicate/retry protection is preserved.

### Lightweight workbook readiness

The web app no longer probes every managed tab on every endpoint call. A schema marker is stored in Script Properties and is bound to both the schema version and the connected spreadsheet ID.

A new or rebound workbook still receives the full structural check. Normal calls perform the lightweight check.

## Performance logging

Every web endpoint now records a timing summary in Apps Script execution logs.

Example shape:

```text
[Coverage Performance] {
  "request":"webGenerateCoverage",
  "elapsedMs":1234,
  "marks":[
    {"label":"workbook-ready","elapsedMs":120},
    {"label":"snapshot-loaded","elapsedMs":420},
    {"label":"schedule-built","elapsedMs":780},
    {"label":"preview-written","elapsedMs":1010}
  ],
  "io":{
    "sheetReads":5,
    "requestCacheHits":18,
    "persistentCacheHits":1,
    "sheetWrites":1
  }
}
```

The log contains timing/counter information only. It does not log teacher names, absence notes, schedule rows, or assignment contents.

Useful requests to compare before/after deployment:

- `webGetBootstrap` — open/change date;
- `webGenerateCoverage` — Generate Plan;
- `webSaveAbsenceRange` — multi-day absence;
- `webGetManualCoverageChoices` — open the manual assignment picker;
- `webSaveCoverage` / handout actions.

## Security boundary

The optimization does not change the application's data authority or authentication model.

- operational data remains in the private Google Sheet;
- short-lived cross-request cache entries remain inside Google Apps Script;
- no database credentials are added;
- no third-party service receives schedule/absence data;
- no additional Apps Script advanced service or OAuth scope is required.

For operational use, deploy the web app only to the intended school/Workspace audience. Do not use anonymous/public access for live staffing data.

## When to consider a real database

A separate database is not the first performance step for this project.

Reconsider the storage layer only after measuring the optimized version and finding that Spreadsheet I/O remains the limiting factor, or when requirements change substantially—for example much larger historical datasets, complex reporting across years, high write concurrency, or integrations that need transactional relational queries.

If that point is reached, the migration should preserve Google Workspace authentication and least-privilege access rather than exposing a public database directly to the browser.
