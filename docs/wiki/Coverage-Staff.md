# Coverage Staff

`Coverage Staff` tells Coverage Scheduler **who it is allowed to assign** when someone is absent.

For normal use, **do not build this list by editing the worksheet directly**. Use the web app.

## Add someone from the web app

In the right-hand **Coverage Staff** panel, click:

**+ Coverage Staff**

A modal opens with the settings for that person.

The ordinary setup is intentionally short:

1. Enter the person's **Name**.
2. Choose their **Role**.
3. Choose **Priority Tier**.
4. Set their normal **Start** and **End** time.
5. Pick the weekdays they normally work.
6. Decide whether they can cover any block during those hours or only free blocks from their own Teacher Schedule.
7. Click **Save Coverage Staff**.

The app writes the row into the `Coverage Staff` worksheet for you.

## The most important choices

### Priority Tier

A practical model is:

- **Tier 1** — preferred coverage; normally dedicated substitutes.
- **Tier 2** — regular internal backup coverage.
- **Tier 3** — last-resort or emergency coverage.

Tier is a preference, not a guarantee. Availability and schedule conflicts still win.

### Can cover any block during these hours

Turn this **on** for a person who is broadly free to cover during their normal work window, such as a dedicated substitute.

Turn it **off** for a teacher or staff member whose own schedule matters.

When it is off, Coverage Scheduler checks `Teacher Schedule` and looks for free/planning/break blocks before assigning that person.

### Available by default

This is the person's normal state.

You do not need to edit it each morning. The switch beside each person in the right-hand panel controls whether they are available on the **selected date** and stores that as a date-specific override.

## Normal availability days

The modal has weekday buttons:

```text
M  T  W  R  F
```

`R` means Thursday.

Select the days that person normally works.

## Optional limits & restrictions

Most users can leave this section closed.

Open **Optional limits & restrictions** only when a person needs special rules.

You can set:

- allowed grades;
- allowed subjects;
- allowed assignment types such as Class, Homeroom, or Duty;
- maximum blocks per day;
- maximum number of different absent teachers per day;
- whether the person may cover pieces of more than one teacher's schedule;
- notes.

Blank grade/subject limits mean **no restriction**.

## Edit someone

Find the person in the right-hand Coverage Staff panel and click **Edit**.

The same modal opens with their current settings.

Make the change and click **Save Coverage Staff**.

## Remove someone from the coverage team

Open that person's **Edit** modal and click:

**Remove from Team**

A confirmation modal appears before anything is removed.

Removing someone from the team does not erase old saved coverage output.

## Daily availability

The switch beside each coverage person is specifically for the date shown at the top of the app.

Example:

A substitute normally works Monday through Friday but calls out on September 14.

You do **not** edit their permanent settings. Select September 14 and turn their switch off.

That date-specific change is stored in `Substitute Availability`.

## What is happening in the worksheet?

The app ultimately stores the following fields in `Coverage Staff`:

| Column | Meaning |
| --- | --- |
| `Name` | Person's name |
| `Role` | Substitute, teacher, aide, etc. |
| `Coverage_Tier` | Priority 1, 2, or 3 |
| `Can_Cover_All_Day` | Whether their own Teacher Schedule limits them |
| `Active_Today` | Normal/default availability |
| `Available_Days` | Normal weekdays |
| `Default_Start` | Earliest normal coverage time |
| `Default_End` | Latest normal coverage time |
| `Allowed_Grades` | Optional grade restriction |
| `Allowed_Subjects` | Optional subject restriction |
| `Allowed_Assignment_Types` | Optional Class/Homeroom/Duty restriction |
| `Max_Blocks_Per_Day` | Optional workload limit |
| `Max_Teachers_Per_Day` | Optional distinct-teacher limit |
| `Can_Be_Split_Across_Teachers` | Whether one person can cover multiple absent teachers |
| `Notes` | Optional notes |

You normally do not need to type into these cells yourself.

## Recommended first setup

Start with only the information the scheduler truly needs.

For a dedicated substitute:

- Name
- Role = Substitute
- Tier = 1
- Can cover any block = on
- Available by default = on
- Days
- Start / End

For a teacher who can cover during free blocks:

- Name matching their Teacher Schedule name
- Role = Teacher (Free Blocks)
- Tier = 2 or 3
- Can cover any block = **off**
- Available by default = on
- Days

Only add advanced restrictions when there is a real reason for them.