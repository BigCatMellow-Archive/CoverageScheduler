# Coverage Scheduler

Coverage Scheduler is a Google Sheets + Google Apps Script tool for planning staff coverage when teachers or other scheduled staff are absent.

The main interface is a full-page Google Apps Script web app. The spreadsheet remains the source of operational data, while the web app gives office staff a simpler way to enter absences, manage coverage people, generate assignments, review conflicts, save the final plan, and create handouts.

> **Start here if you are using the scheduler day to day.** You usually do not need to edit the underlying sheets directly.

## Quick navigation

- [What the system does](#what-the-system-does)
- [The normal daily workflow](#the-normal-daily-workflow)
- [Common examples](#common-examples)
- [How coverage staff work](#how-coverage-staff-work)
- [How the scheduler decides](#how-the-scheduler-decides)
- [Understanding the workbook](#understanding-the-workbook)
- [First-time setup](#first-time-setup)
- [Updating the live web app](#updating-the-live-web-app)
- [Troubleshooting](#troubleshooting)
- [Repository layout](#repository-layout)

## What the system does

Coverage Scheduler combines four kinds of information:

1. **Who is scheduled to be where** — from `Teacher Schedule`.
2. **Who is absent and when** — entered through the web app and stored in `Daily Absences`.
3. **Who can provide coverage** — managed through **+ Coverage Staff**.
4. **The rules and limits for assigning coverage** — availability windows, tiers, restrictions, workload limits, and scheduler configuration.

When you click **Generate Plan**, the scheduler compares all of those pieces and builds a proposed coverage plan. It tries to avoid time conflicts, keep coverage practical, and use higher-priority coverage people before lower-priority options.

Generating a plan is a preview step. You can review and adjust the result before saving it to `Coverage Output`.

### Main things you can do

- Add a single full-day or partial-day absence.
- Add several staff members at once with **+ Group Absence** for field trips, meetings, trainings, or other shared events.
- Add or edit substitutes, aides, teachers with free blocks, administrators, or other coverage people.
- Mark coverage people available or unavailable for the selected day.
- Limit who can cover certain grades, subjects, assignment types, or time windows.
- Generate a coverage plan.
- View the plan as a timeline, table, or grouped by coverage person.
- Manually reassign individual blocks when needed.
- Save the approved plan.
- Create a printable Google Docs handout.

## The normal daily workflow

Most days should follow this sequence:

### 1. Choose the date

Open the deployed web app and select the day you are planning.

The scheduler loads:

- that day's absences;
- the people available to provide coverage;
- the relevant teacher schedules;
- any previously saved plan data.

### 2. Enter absences

For one person, click **+ Add Absence**.

You can choose:

- **Full Day** — the person is unavailable for all scheduled blocks.
- **Partial Day** — enter the time they will be gone.
- **Emergency** — records the absence as an emergency so emergency fallback behavior can be considered by the scheduler.

You can also add notes and, for a normal single-person absence, optionally specify preferred coverage.

### 3. Confirm the coverage team

Look at the **Coverage Staff** panel on the right.

Use the availability switch to confirm who is actually available that day. If someone needs to be added or edited, use **+ Coverage Staff**.

### 4. Generate the plan

Click **Generate**.

The scheduler finds the blocks that actually need coverage and attempts to assign available people without overlapping their assignments.

### 5. Review the result

Use whichever view is easiest:

- **Timeline** — useful for seeing the day chronologically.
- **Table** — useful for checking every block.
- **By Sub** — useful for seeing one coverage person's workload.

Pay special attention to anything marked **Unfilled**.

### 6. Make manual adjustments if needed

If the automatically generated plan is not the arrangement you want, open an assignment and select a different coverage person.

After manual changes, review the affected person's other assignments to make sure the final plan still makes operational sense.

### 7. Save the final plan

When the plan looks right, save it. The approved assignments are written to `Coverage Output`.

### 8. Create a handout

Use the handout action to create a Google Doc. The handout is organized by coverage person so each person can see where they need to be and when.

## Common examples

### Example 1: One teacher is out all day

**Situation:** Jordan Lee is absent for the entire day.

1. Choose the correct date.
2. Click **+ Add Absence**.
3. Select **Jordan Lee**.
4. Choose **Full Day**.
5. Save the absence.
6. Confirm which coverage staff are available.
7. Click **Generate**.

The scheduler checks Jordan's schedule and only creates coverage needs for blocks that are marked or inferred as requiring coverage. Planning, break, or other non-cover-required blocks are normally ignored.

### Example 2: A teacher leaves for an appointment

**Situation:** Morgan Patel will leave at 11:15 AM and return at 1:45 PM.

1. Click **+ Add Absence**.
2. Select **Morgan Patel**.
3. Choose **Partial Day**.
4. Enter **11:15 AM** through **1:45 PM**.
5. Save and generate the plan.

The scheduler covers blocks that overlap that absence window. A class from 10:30–11:20 overlaps the absence and can require coverage; a class ending before 11:15 does not.

### Example 3: Several teachers are going on a field trip

**Situation:** Four teachers will be away from 9:30 AM until 2:15 PM.

1. Click **+ Group Absence**.
2. Select all four teachers.
3. Choose the field-trip date.
4. Leave the absence type as **Partial Day**.
5. Enter **9:30 AM** through **2:15 PM**.
6. Add a note such as `5th Grade Field Trip` if useful.
7. Save the group absence.
8. Click **Generate**.

The app creates a normal absence entry for each selected teacher, then the regular scheduling engine handles all of those coverage needs together.

This matters because the same substitute cannot be automatically assigned to two teachers at the same time. A teacher who is on the field trip is also blocked from being used as coverage during their own absence window, even if that teacher normally provides coverage during free blocks.

Group absences start with automatic assignment rather than one shared preferred coverage person. After generating the plan, individual blocks can still be reassigned manually.

### Example 4: A substitute is only available in the morning

**Situation:** Casey Nguyen can cover from 8:00 AM until noon.

Edit Casey under **Coverage Staff** and set the normal or date-specific availability window appropriately.

The scheduler will consider Casey only for blocks that fit inside that availability window.

### Example 5: A teacher can cover only during free blocks

**Situation:** Taylor Brooks is a teacher who can occasionally cover classes during planning periods.

When adding Taylor as Coverage Staff:

- choose **Teacher (Free Blocks)** as the role;
- turn off **Can cover any block during these hours**;
- make sure Taylor also exists correctly in `Teacher Schedule`.

The scheduler uses Taylor's Teacher Schedule to identify blocks marked or inferred as coverage-eligible, such as planning periods.

## How coverage staff work

Coverage Staff are the people the scheduler may assign to an absent person's blocks.

Typical examples include:

- substitutes;
- aides;
- administrators;
- specialists;
- teachers who can cover during free blocks;
- other staff who are allowed to provide coverage.

### Priority tiers

The web app uses three priority tiers:

| Tier | Meaning | Typical use |
| --- | --- | --- |
| **1** | First choice | Regular substitute or primary coverage staff |
| **2** | Next choice | Secondary coverage option |
| **3** | Last resort | Emergency or least-preferred option |

Tier is one factor, not the only factor. Someone still has to be available and eligible for the specific block.

### Availability

Coverage staff can have:

- normal available weekdays;
- normal start and end times;
- daily availability overrides;
- an active/inactive status for the selected day.

### Optional restrictions

A coverage person can also be limited by:

- allowed grades;
- allowed subjects;
- allowed assignment types;
- maximum blocks per day;
- maximum different teachers per day;
- whether their day can be split across multiple absent teachers.

Leaving an optional restriction blank generally means there is no restriction for that field.

## How the scheduler decides

The scheduler is a practical heuristic, not a mathematical optimizer. It makes a sequence of reasonable assignment decisions rather than testing every possible combination.

In broad terms it:

1. Reads the selected day's absences.
2. Finds the absent person's scheduled blocks that require coverage.
3. Applies partial-day time windows when present.
4. Removes coverage candidates who are unavailable or ineligible.
5. Prevents a coverage person from being assigned to overlapping blocks.
6. Prevents someone who is themselves absent from being used as coverage during the overlapping absence window.
7. Honors a manually preferred assignment for a normal single-person absence when one was explicitly selected.
8. Gives harder-to-cover absences attention before easier ones.
9. Tries a whole-day/whole-teacher assignment when configured to do so.
10. Falls back to split coverage when allowed.
11. Scores remaining candidates using tier, continuity, workload, and configured restrictions.
12. Leaves a block **Unfilled** when no valid automatic candidate is available.

An **Unfilled** result is intentional information. It means the scheduler could not find a candidate that satisfied its current rules; it does not silently invent availability.

For a deeper explanation, see [`docs/wiki/How-the-Scheduler-Works.md`](docs/wiki/How-the-Scheduler-Works.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Understanding the workbook

The web app is the normal operating interface, but all live data is stored in the connected Google Sheet.

| Sheet | What it is for | Usually edited by |
| --- | --- | --- |
| `Teacher Schedule` | Source schedule for teachers/staff | Existing schedule process / administrator |
| `Staff List` | Stable roster shown in absence pickers | Setup or administrator |
| `Coverage Staff` | Coverage people and assignment rules | Web app |
| `Substitute Availability` | Date-specific availability overrides | Web app / scheduler workflow |
| `Daily Absences` | Absences for specific dates | Web app |
| `Coverage Output` | Final saved coverage assignments | Web app |
| `Config` | Scheduler behavior settings | Advanced/admin use |
| `Lists` | Validation/helper values | Setup routine |
| `_Preview` | Temporary generated preview data | Scheduler |

`Lists` and `_Preview` are helper sheets and are normally hidden.

### Teacher Schedule

The preferred source format is:

~~~text
Teacher | Term | Day | Start | End | Class | Subject | Room
~~~

Each row represents one block of one person's day.

`Start` and `End` are authoritative. The scheduler does not require your school to use fixed numbered periods.

The scheduler also understands several alternate header names. Setup/validation can add or work with the more detailed internal fields used for role, grade, assignment type, coverage requirement, and cover eligibility.

### Staff List

The absence picker comes from `Staff List`.

The simplest format is:

~~~text
Teacher
Jordan Lee
Morgan Patel
Taylor Brooks
~~~

If `Staff List` is missing or empty when setup runs, the system seeds it from unique names in `Teacher Schedule`. If it already contains names, setup preserves it.

## First-time setup

For the full beginner walkthrough, start with [`docs/wiki/Home.md`](docs/wiki/Home.md).

Recommended order:

1. [`Getting Started`](docs/wiki/Getting-Started.md)
2. [`Install Google Apps Script`](docs/wiki/Installing-Google-Apps-Script.md)
3. [`Set Up the Workbook`](docs/wiki/Workbook-Setup.md)
4. [`Teacher Schedule`](docs/wiki/Teacher-Schedule.md)
5. [`Staff List`](docs/wiki/Staff-List.md)
6. [`Coverage Staff`](docs/wiki/Coverage-Staff.md)
7. [`Deploy the Web App`](docs/wiki/Deploying-the-Web-App.md)
8. [`Daily Workflow`](docs/wiki/Daily-Workflow.md)
9. [`Troubleshooting`](docs/wiki/Troubleshooting.md)

### Short installation version

1. Open the Google Sheet that will hold the coverage system.
2. Make sure the operational schedule is in a tab named **Teacher Schedule**.
3. Open **Extensions → Apps Script**.
4. Create matching Apps Script files and copy the files from `google-apps-script/`.
5. Include `appsscript.json` as the project manifest.
6. Save the Apps Script project and reload the spreadsheet.
7. Use **Coverage Scheduler → Set up workbook**.
8. Use **Coverage Scheduler → Validate teacher schedule**.
9. Deploy the Apps Script project as a **Web app**.
10. Open the generated `/exec` URL.
11. Add your real coverage team with **+ Coverage Staff**.

### What setup does

Running **Set up workbook**:

- creates the scheduler-managed sheets if they do not already exist;
- adds required headers without intentionally replacing existing populated schedule data;
- seeds helper lists and default configuration;
- creates/seeds `Staff List` when needed;
- hides helper sheets;
- stores the connected spreadsheet ID in Apps Script **Script Properties** so the standalone web app knows which workbook to reopen.

The repository does not need a hard-coded operational spreadsheet ID.

## Updating the live web app

Changes merged into GitHub do **not** automatically appear in the deployed Google Apps Script web app.

To update an existing installation:

1. Copy the changed files from `google-apps-script/` into the existing Apps Script project.
2. Save the project.
3. Choose **Deploy → Manage deployments**.
4. Edit the existing Web App deployment.
5. Select **New version**.
6. Deploy.

Using the existing deployment keeps the same `/exec` URL.

### Important distinction

- **GitHub `main`** = current source code.
- **Apps Script editor** = the code currently installed in your Google project.
- **Deployed Web App version** = the code users actually receive from the `/exec` URL.

All three need to be current for a code change to be visible to users.

## Troubleshooting

### I added an absence but no blocks appear

Check:

- the selected date/day matches the person's `Teacher Schedule` rows;
- the teacher name matches the schedule name;
- the scheduled blocks have valid start/end times;
- the blocks are considered to require coverage;
- a partial-day absence actually overlaps the expected blocks.

### The scheduler leaves something Unfilled

Check whether:

- any coverage staff are active that day;
- their availability windows include the block;
- their grade/subject/type restrictions allow the assignment;
- they are already covering someone else at the same time;
- they have reached a configured daily limit;
- the potential coverage person is also absent during that time.

An Unfilled block may be correct if there genuinely is no eligible person.

### A coverage person does not appear as an option

Check their **Coverage Staff** record, weekday availability, active status, time window, and restrictions.

If they are a **Teacher (Free Blocks)**, also check that their own Teacher Schedule contains a genuinely cover-eligible free/planning block at that time.

### I changed GitHub but the web app still looks old

Merging GitHub code is not enough. Copy the updated files into Apps Script, then create a **New version** of the existing deployment.

### I copied the project to a different spreadsheet and it still opens the old workbook

Open the new spreadsheet and run **Coverage Scheduler → Set up workbook**. That updates the spreadsheet ID stored in Script Properties.

### The absence picker is missing someone

Check `Staff List`. The web app deliberately uses that stable roster rather than rebuilding the picker from the schedule every time.

## Repository layout

~~~text
google-apps-script/
  code.gs                       Web-app entry point, workbook binding, UI additions
  web-ui-data.gs                Staff List and Coverage Staff web actions
  handout.gs                    Google Docs coverage handouts
  index.html                    Main full-page web interface
  teacher-schedule-adapter.gs  Teacher Schedule preservation/validation
  setup.gs                      Workbook schemas, setup, validation, defaults
  scheduler.gs                  Coverage engine, preview, output logic
  sidebar.html                  Optional spreadsheet sidebar
  sidebarcss.html               Optional sidebar styles
  sidebarjs.html                Optional sidebar client behavior
  appsscript.json               Apps Script manifest

apps-script/
  Legacy/alternate spreadsheet-sidebar implementation files

docs/
  wiki/                         Beginner and operator guides
  ARCHITECTURE.md               Technical data flow and design
  TEACHER-SCHEDULE.md           Schedule format and inference rules
  REVIEW.md                     Review findings / technical debt notes

prototype/
  Browser-only interface experiments and mock-data prototypes
~~~

The `google-apps-script/` folder is the authoritative copy-ready implementation for the current full-page web app.

## Configuration

`Config` is created with defaults such as:

- try whole-day coverage first;
- allow split coverage;
- fallback block/teacher limits;
- whether lunch may be used as cover-eligible time;
- date-based availability override behavior;
- the Apps Script time zone.

Most day-to-day users should not need to edit `Config`.

## Privacy and repository safety

Do **not** commit live school data to this repository.

Keep these outside version control:

- real staff schedules if they are operational/private;
- absence records;
- substitute availability containing private information;
- student information;
- spreadsheet exports;
- credentials or tokens;
- local clasp configuration containing sensitive project identifiers.

If sample data is ever added, deliberately anonymize it.

See [`SECURITY.md`](SECURITY.md).

## Current limitations

- There is no automated test suite yet.
- There is no CI deployment workflow yet.
- The Apps Script project is updated/deployed manually.
- The scheduling algorithm is heuristic and can produce a valid but non-optimal plan when many constraints compete.
- `Term` is currently mostly informational when schedules use `All Year`; seasonal schedules need explicit date-to-term mapping.
- Numeric grade inference works best when class labels contain recognizable grade numbers.
- Unusual PreK/Kindergarten/Beginner labels may need explicit grade configuration when strict grade restrictions are used.

## License

No open-source license is currently included. Unless a license is added, normal copyright restrictions apply.
