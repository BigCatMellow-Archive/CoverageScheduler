const TEACHER_SCHEDULE_SOURCE_HEADERS = ['Teacher', 'Term', 'Day', 'Start', 'End', 'Class', 'Subject', 'Room'];

/**
 * Sets up the scheduler around an existing Teacher Schedule source sheet.
 *
 * The source schedule is intentionally left in its native eight-column shape:
 * Teacher | Term | Day | Start | End | Class | Subject | Room
 *
 * Grade, assignment type, coverage need, and cover eligibility are inferred at
 * runtime by scheduler.gs. This avoids maintaining a second transformed copy of
 * the schedule and avoids adding columns to the operational source sheet.
 */
function setupCoverageWorkbookFromTeacherSchedule() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let teacherSheet = ss.getSheetByName('Teacher Schedule');

  if (!teacherSheet) {
    teacherSheet = ss.insertSheet('Teacher Schedule');
    teacherSheet.getRange(1, 1, 1, TEACHER_SCHEDULE_SOURCE_HEADERS.length)
      .setValues([TEACHER_SCHEDULE_SOURCE_HEADERS]);
    teacherSheet.setFrozenRows(1);
    teacherSheet.getRange(1, 1, 1, TEACHER_SCHEDULE_SOURCE_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#d9eaf7')
      .setWrap(true);
  }

  const inspection = validateTeacherScheduleSource_();

  const managedSheets = [
    'Coverage Staff',
    'Substitute Availability',
    'Daily Absences',
    'Coverage Output',
    'Lists',
    'Config',
    '_Preview'
  ];

  managedSheets.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    ensureHeaderRow_(sheet, SHEET_SCHEMAS[name].headers);
    formatSheet_(sheet);
  });

  seedLists_();
  seedConfig_();
  applyDataValidation_();
  hideHelperSheets_();

  const warningSuffix = inspection.warnings.length
    ? ' ' + inspection.warnings.length + ' schedule warning(s) found; use Coverage Scheduler → Validate teacher schedule.'
    : '';
  ss.toast(
    'Coverage Scheduler is ready. Using ' + inspection.teacherCount + ' teacher schedule(s).' + warningSuffix,
    APP_TITLE,
    8
  );

  return inspection;
}

/**
 * Validates the source structure without changing Teacher Schedule.
 * The runtime scheduler already accepts the older Staff_Name-style schema, so
 * the validator keeps those aliases for backward compatibility.
 */
function validateTeacherScheduleSource_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teacher Schedule');
  if (!sheet) throw new Error('Missing Teacher Schedule sheet.');
  if (sheet.getLastColumn() < 1) throw new Error('Teacher Schedule has no columns.');

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(value => String(value || '').trim());

  const headerGroups = {
    Teacher: ['Teacher', 'Staff_Name', 'Teacher_Name', 'Name'],
    Term: ['Term'],
    Day: ['Day'],
    Start: ['Start', 'Start_Time', 'Start Time'],
    End: ['End', 'End_Time', 'End Time'],
    Class: ['Class', 'Class_Name', 'Class Name', 'Section', 'Group'],
    Subject: ['Subject', 'Course', 'Course_Name', 'Course Name', 'Activity'],
    Room: ['Room']
  };

  const positions = {};
  Object.keys(headerGroups).forEach(key => {
    positions[key] = findTeacherScheduleHeader_(headers, headerGroups[key]);
  });

  const required = ['Teacher', 'Day', 'Start', 'End', 'Subject'];
  const missing = required.filter(key => positions[key] === -1);
  if (missing.length) {
    throw new Error(
      'Teacher Schedule is missing required column(s): ' + missing.join(', ') +
      '. Expected the source format Teacher | Term | Day | Start | End | Class | Subject | Room.'
    );
  }

  const warnings = [];
  ['Term', 'Class', 'Room'].forEach(key => {
    if (positions[key] === -1) warnings.push('Recommended column missing: ' + key + '.');
  });

  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (!rowCount) {
    return {
      rowCount: 0,
      teacherCount: 0,
      terms: [],
      warnings: warnings.concat(['Teacher Schedule has no schedule rows yet.'])
    };
  }

  const values = sheet.getRange(2, 1, rowCount, sheet.getLastColumn()).getValues();
  const teachers = {};
  const terms = {};
  let invalidDayCount = 0;
  let invalidTimeCount = 0;
  let blankTeacherCount = 0;

  values.forEach(row => {
    const teacher = String(row[positions.Teacher] || '').trim();
    if (!teacher) {
      blankTeacherCount++;
      return;
    }
    teachers[teacher] = true;

    if (positions.Term !== -1) {
      const term = String(row[positions.Term] || '').trim();
      if (term) terms[term] = true;
    }

    const day = String(row[positions.Day] || '').trim().toUpperCase();
    if (['M', 'T', 'W', 'R', 'F'].indexOf(day) === -1) invalidDayCount++;

    const start = timeToMinutes_(row[positions.Start]);
    const end = timeToMinutes_(row[positions.End]);
    if (start == null || end == null || end <= start) invalidTimeCount++;
  });

  if (blankTeacherCount) warnings.push(blankTeacherCount + ' row(s) have no teacher name and will be ignored.');
  if (invalidDayCount) warnings.push(invalidDayCount + ' row(s) use a day code other than M/T/W/R/F.');
  if (invalidTimeCount) warnings.push(invalidTimeCount + ' row(s) have an invalid or reversed Start/End time.');

  const termList = Object.keys(terms).sort();
  const nonAllYearTerms = termList.filter(term => term.toLowerCase() !== 'all year');
  if (nonAllYearTerms.length) {
    warnings.push(
      'Term values other than "All Year" are present (' + nonAllYearTerms.join(', ') +
      '). The current scheduler treats all matching weekday rows as active; add term/date mapping before using seasonal schedules.'
    );
  }

  return {
    rowCount: rowCount,
    teacherCount: Object.keys(teachers).length,
    terms: termList,
    warnings: warnings
  };
}

function findTeacherScheduleHeader_(headers, aliases) {
  for (let i = 0; i < aliases.length; i++) {
    const idx = headers.indexOf(aliases[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}
