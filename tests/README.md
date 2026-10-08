# Production smoke test

Run this before copying a new `google-apps-script/` revision into Apps Script:

```bash
node tests/apps-script-smoke.js
```

The test is dependency-free. It checks:

- the combined Apps Script server bundle parses in one global namespace;
- browser JavaScript parses;
- browser/server API versions match;
- the deployed handout-module compatibility gate is present;
- normal date bootstrap does not load the full Teacher Schedule or field-trip pool;
- Create Handout revalidates the reviewed plan before printing;
- automatic field-trip pool refreshes use the script lock;
- every browser `gas(...)` RPC has a server function;
- core time parsing, grade inference, partial-absence clipping, schedule-conflict rejection, absence rejection, and daily assignment limits.

This is a static/pure-function smoke suite. It does **not** replace a post-deploy Apps Script runtime test against the live workbook and Google Docs/Drive services.
