# Repository Review

Review date: 2026-08-28

This review focuses on repository hygiene, maintainability, and obvious correctness risks. It does not attempt to redesign the scheduling policy.

## Addressed by the GitHub cleanup

### 1. Source and prototypes were mixed together

The repository root previously mixed production Apps Script source, browser-only prototypes, and uploaded working files. The cleanup separates the Apps Script implementation from prototype material so a reader can identify the real application immediately.

### 2. No project documentation

The original upload had no README or installation instructions. The cleanup adds a README with the application purpose, setup steps, workbook model, scheduling approach, privacy guidance, and known limitations.

### 3. Duplicate source file

`uploads/code-c3101a21.gs` and `uploads/code.gs` referenced the same Git blob and were exact duplicates. The cleanup keeps a single `apps-script/code.gs`.

### 4. Operational spreadsheet committed to the repository

The original tree contained `4.15 - 2025-2026 Teacher Scheduler.xlsx`. A source-code repository for this application should not contain live school staffing exports. The cleanup excludes that workbook from the proposed tree and adds ignore/privacy guidance for future data files.

Important: deleting a file in a new commit does not remove it from Git history. If that workbook contains real private data, repository history should be cleaned separately before the repository is treated as safely public.

## Code observations not changed in this cleanup

### Manual/preferred assignments bypass normal candidate validation

When an absence has `Preferred_Coverage`, the scheduler writes the preferred person as an assigned manual coverage person before the normal automatic scheduler runs. If that name is not present in active coverage staff, the code still records the name as assigned. If the person is present, the code records the assignment without first applying the normal eligibility, time-conflict, restriction, or limit checks used by automatic assignment.

This may be intentional because a manual assignment can represent an administrator overriding the normal rules. The behavior should be explicitly confirmed and, if retained, surfaced clearly in the UI as an override.

### The handout generator's unfilled section is effectively unreachable

Both public handout entry points filter source rows to `Status === 'Assigned'` before calling the shared document builder. The shared builder later tries to create an `Unfilled Coverage` section from rows without an assigned coverage name. Under normal data, those rows have already been removed.

Two reasonable designs are possible:

- handouts contain assigned coverage only, in which case the dead unfilled section should be removed; or
- handouts should include an administrative unfilled page, in which case the entry points should pass all relevant rows and the builder should separate assigned from unfilled rows itself.

### No automated tests

The scheduling engine has enough interacting constraints that regression tests would provide meaningful protection. Highest-priority cases are listed in `ARCHITECTURE.md`.

### No continuous integration

There is currently no GitHub Actions workflow or Apps Script test/lint step. CI should be added only after a practical local/test strategy is selected; adding an empty workflow would not improve reliability.

## Overall assessment

The project is structurally better than the original upload suggests. The scheduling engine is decomposed into normalization, eligibility, availability, conflict, scoring, and output functions rather than being one monolithic script. The main weaknesses are packaging, lack of automated verification, and a few policy-sensitive behaviors that need explicit decisions before broader use.
