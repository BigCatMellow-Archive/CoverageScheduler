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

Coverage Scheduler combines five kinds of information:

1. **Who is scheduled to be where** — from `Teacher Schedule`.
2. **Who is absent and when** — entered through the web app and stored in `Daily Absences`.
3. **Which field trips change the normal day** — stored as editable events in `Field Trips`.
4. **Who can provide coverage** — managed through **+ Coverage Staff**, plus temporary teachers released by a field trip.
5. **The rules and limits for assigning coverage** — availability windows, tiers, restrictions, workload limits, and scheduler configuration.

When you click **Generate Plan**, the scheduler compares all of those pieces and builds a proposed coverage plan. It tries to avoid time conflicts, keep coverage practical, and use higher-priority coverage people before lower-priority options.

Generating a plan is a preview step. You can review and adjust the result before saving it to `Coverage Output`.

### Main things you can do

- Add a single full-day or partial-day absence.
- Create and edit **Field Trips** with the staff going, student grade(s), date, and time.
- View field trips and ordinary absences together in the monthly **Calendar**.
- Add or edit substitutes, aides, teachers with free blocks, administrators, or other coverage people.
- Mark coverage people available or unavailable for the selected day.
- Limit who can cover certain grades, subjects, assignment types, or time windows.
- Generate a coverage plan.
- View the plan as a timeline, table, or grouped by coverage person.
- Manually reassign individual blocks when needed.
- Save the approved plan and create its printable Google Docs handout in one action.

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

### Field trips on the selected day

Field trips are separate from ordinary absences. Use **+ Field Trip** to create one, or **Calendar** to find and edit an existing event.

A field trip is stored once rather than as several independent absence rows. It can be one day or span multiple/overnight dates. The selected grade(s), staff, departure, and return determine which classes disappear, which classes still need coverage, and which teachers staying behind become temporarily available.

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

### 7. Save the final plan and create the handout

When the plan looks right, click **Save & Handout**.

That one action:

1. writes the exact plan you are looking at to `Coverage Output`;
2. creates the Google Docs handout from those same rows;
3. gives you a link to open the handout.

This means manual reassignments made after generation are preserved in both the saved output and the handout. The handout is organized by coverage person so each person can see where they need to be and when.

If there are no assigned coverage rows, the plan can still be saved, but there is nothing to include in a coverage-person handout.

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

### Example 3: A 2nd-grade field trip changes both coverage needs and available teachers

**Situation:** Mike is going on a 2nd-grade field trip from 9:00 AM until 2:00 PM. Mike teaches both 2nd grade and 1st grade. Steve is staying at school and normally teaches 2nd grade during part of that window.

1. Click **+ Field Trip**.
2. Name the event, such as `2nd Grade Field Trip`.
3. Choose the departure date/time and return date/time. For a one-day trip, use the same date twice.
4. Select **2** under **Students on Trip**.
5. Select Mike and every other staff member going on the trip.
6. Save the field trip.
7. Click **Generate Plan**.

The scheduler changes the day before assigning coverage:

- Mike's 2nd-grade classes during the trip are treated as cancelled because those students are away.
- Mike's 1st-grade classes still happen and therefore need coverage.
- Steve's 2nd-grade class during the trip is also treated as cancelled, so that block becomes temporary coverage availability.
- Steve is preferred for field-trip coverage before an unrelated substitute when his released block fits.
- If Steve has a usable planning or break block during the trip, that can also be used.
- Steve's other classes that are still happening keep him unavailable.
- If the field-trip pool cannot cover a block, the scheduler falls back to the normal Coverage Staff pool.

Field trips have stable event IDs and can be edited as one event from the **Calendar** or directly from the field-trip card in the daily coverage plan. The plan card shows the staff on the trip by name, teachers released to help because their trip-grade classes were cancelled, and the coverage assignment for each remaining class. Clicking a coverage line opens the normal manual reassignment editor. Changing the staff, grade, dates, or times changes the scheduling consequences the next time the plan is generated.

### Overnight and multi-day field trips

A field trip can span several days without creating separate events.

For example, a trip that departs Monday at 10:00 AM and returns Wednesday at 1:00 PM is interpreted as:

- **Monday:** trip rules apply from 10:00 AM onward;
- **Tuesday:** trip rules apply for the full school day;
- **Wednesday:** trip rules apply until 1:00 PM;
- classes before departure Monday and after return Wednesday operate normally.

The same event ID appears across all affected dates in the Calendar, but editing any occurrence edits the single underlying field trip.

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

1. Reads the selected day's ordinary absences and field trips.
2. Removes field-trip-grade classes that will not happen because those students are away.
3. Finds the remaining blocks that genuinely need coverage.
4. Finds teachers staying behind whose field-trip-grade classes were cancelled and temporarily adds them to that event's coverage pool.
5. Allows those affected teachers to use released class blocks and usable planning/break blocks during the trip.
6. Prefers the event-specific field-trip pool for field-trip-created coverage needs before falling back to normal Coverage Staff.
7. Keeps teachers unavailable while they are teaching any class that is still happening.
8. Applies partial-day time windows and normal availability restrictions.
9. Prevents a coverage person from being assigned to overlapping blocks.
10. Prevents someone who is themselves absent or on the field trip from being used as coverage during that window.
11. Honors a manually preferred assignment for a normal single-person absence when one was explicitly selected.
12. Uses whole-day continuity for ordinary absences when configured, but schedules field-trip needs block-by-block first so released capacity is not wasted.
13. Falls back to split coverage and then the normal coverage pool when needed.
14. Leaves a block **Unfilled** when no valid automatic candidate is available.

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
| `Daily Absences` | Ordinary absences for specific dates | Web app |
| `Field Trips` | One editable record per field trip: event ID, start/end dates and times, grades, staff, notes | Web app / Calendar |
| `Coverage Output` | Final saved coverage assignments, including the linked field-trip Event ID when applicable | Web app |
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
  field-trip-ui.gs              Field trip editor, calendar, and event UI
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
