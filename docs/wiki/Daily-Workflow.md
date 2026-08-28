# Daily Workflow

Once installation and setup are finished, normal use should happen from the web app rather than the Apps Script editor.

## 1. Open the web app

Open the bookmarked Apps Script URL ending in `/exec`.

Choose the date you are scheduling.

The weekday code is derived from that date automatically.

## 2. Add absent staff

The left panel lists staff found in `Teacher Schedule` for the selected weekday.

Click **Add absence**.

Choose the staff member and the type of absence.

### Full Day

Use this when the person is absent for the full scheduled day.

Coverage Scheduler checks all of that person's blocks for the selected weekday and keeps the blocks that require coverage.

### Partial Day

Use this when the person is absent only during part of the day.

Enter a start and end time. Any coverage-needed block that overlaps that window can be included.

### Emergency

Emergency mode marks the absence as an emergency. The scheduler can use emergency-only fallback behavior configured in the scheduling engine.

Use this deliberately; it can make lower-priority emergency options eligible.

### Preferred Coverage

Normally leave this set to **Auto-assign**.

If an administrator needs a specific person to cover an absence, select that person as Preferred Coverage.

Manual preferred assignments currently act as an administrative override and should be reviewed carefully because they are handled before normal automatic candidate selection.

## 3. Confirm coverage staff

The right panel shows the people listed on `Coverage Staff`.

Use the switch beside each person to indicate whether they are available on the selected date.

Changing this switch creates or updates a date-specific row in `Substitute Availability`; it does not need to permanently change the person's normal schedule.

## 4. Generate the plan

Click **Generate Plan**.

The scheduler reads:

- the selected absences;
- the absent teachers' schedule blocks;
- coverage-staff rules;
- date-specific availability;
- internal teachers' free blocks;
- existing assignments generated during this plan.

The center panel displays the result.

## 5. Review the result

Do not treat generation as automatic approval.

Review:

- unfilled blocks;
- who is covering each absent teacher;
- unusual Tier 3 assignments;
- room and subject information;
- split coverage and handoffs;
- any manual overrides.

You can switch among:

- **Timeline**
- **Table**
- **By Sub**

## 6. Reassign a block if needed

Click a generated block or row to open the reassignment dialog.

Choose another active coverage person or leave it unfilled.

A manual change affects the current plan in the interface. Save the output when the plan is ready.

## 7. Save Output

Click **Save Output**.

The current plan is written to `Coverage Output` for that date.

If a saved plan already exists for the same date/day, the scheduler replaces that day's saved rows while preserving other dates.

## 8. Create the handout

Click **Handout** after a preview has been generated.

Coverage Scheduler creates a Google Doc with assignments grouped by coverage person.

The document is created in Google Drive under the account executing the web app.

## Where the daily data goes

| Action | Sheet used |
| --- | --- |
| Add/edit absence | `Daily Absences` |
| Turn a coverage person on/off for a date | `Substitute Availability` |
| Generate plan | `_Preview` |
| Save Output | `Coverage Output` |
| Create handout | Google Docs / Drive |

## End-of-day cleanup

You generally do not need to delete the day's data.

`Daily Absences`, `Substitute Availability`, and `Coverage Output` are date-aware, so historical rows can remain useful as a record.
