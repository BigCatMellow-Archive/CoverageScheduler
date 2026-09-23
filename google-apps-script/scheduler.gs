const HEADER_ALIASES = {
  'Teacher Schedule': {
    Staff_Name: ['Staff_Name', 'Teacher', 'Teacher_Name', 'Name'],
    Role: ['Role'],
    Term: ['Term', 'Semester', 'Schedule_Term', 'Schedule Term'],
    Day: ['Day'],
    Start: ['Start', 'Start_Time', 'Start Time'],
    End: ['End', 'End_Time', 'End Time'],
    Class: ['Class', 'Class_Name', 'Class Name', 'Current_Class', 'Current Class', 'Section', 'Group', 'Course', 'Course_Name', 'Course Name', 'Activity'],
    Grade: ['Grade'],
    Subject: ['Subject', 'Course', 'Course_Name', 'Course Name', 'Activity', 'Department', 'Content_Area', 'Content Area'],
    Assignment_Type: ['Assignment_Type', 'Assignment Type', 'Type'],
    Room: ['Room'],
    Needs_Coverage_If_Absent: ['Needs_Coverage_If_Absent', 'Needs Coverage If Absent'],
    Cover_Eligible_This_Block: ['Cover_Eligible_This_Block', 'Available_To_Cover', 'Coverage_Eligible', 'Cover Eligible This Block']
  },
  'Coverage Staff': {
    Name: ['Name', 'Substitute_Name', 'Staff_Name', 'Teacher'],
    Role: ['Role'],
    Coverage_Tier: ['Coverage_Tier', 'Tier', 'Priority'],
    Can_Cover_All_Day: ['Can_Cover_All_Day', 'All_Day', 'Can Cover All Day'],
    Active_Today: ['Active_Today', 'Active'],
    Available_Days: ['Available_Days', 'Available Days', 'Days', 'Days_Available'],
    Default_Start: ['Default_Start', 'Default Start', 'Available_From', 'Available From'],
    Default_End: ['Default_End', 'Default End', 'Available_Until', 'Available Until'],
    Allowed_Grades: ['Allowed_Grades', 'Grades'],
    Allowed_Subjects: ['Allowed_Subjects', 'Subjects'],
    Allowed_Assignment_Types: ['Allowed_Assignment_Types', 'Assignment_Types'],
    Max_Blocks_Per_Day: ['Max_Blocks_Per_Day'],
    Max_Teachers_Per_Day: ['Max_Teachers_Per_Day'],
    Can_Be_Split_Across_Teachers: ['Can_Be_Split_Across_Teachers', 'Can Split'],
    Notes: ['Notes']
  },
  'Substitute Availability': {
    Date: ['Date'],
    Day: ['Day'],
    Name: ['Name', 'Substitute_Name', 'Staff_Name', 'Teacher'],
    Available: ['Available', 'Active', 'Active_Today', 'Available_Today'],
    Start: ['Start', 'Start_Time', 'Available_From', 'Available From'],
    End: ['End', 'End_Time', 'Available_Until', 'Available Until'],
    Notes: ['Notes']
  },
  'Daily Absences': {
    Date: ['Date'],
    Day: ['Day'],
    Staff_Name: ['Staff_Name', 'Teacher', 'Name'],
    Absence_Type: ['Absence_Type', 'Type'],
    Start_Override: ['Start_Override', 'Start', 'Start Time'],
    End_Override: ['End_Override', 'End', 'End Time'],
    Notes: ['Notes'],
    Preferred_Coverage: ['Preferred_Coverage', 'Preferred Coverage', 'Assigned_To']
  },
  'Field Trips': {
    Event_ID: ['Event_ID', 'Event ID', 'ID'],
    Name: ['Name', 'Event_Name', 'Event Name'],
    Date: ['Date', 'Start_Date', 'Start Date'],
    End_Date: ['End_Date', 'End Date'],
    Start: ['Start', 'Start_Time', 'Start Time'],
    End: ['End', 'End_Time', 'End Time'],
    Grades: ['Grades', 'Students_Away', 'Students Away'],
    Staff: ['Staff', 'Teachers', 'Staff_Away', 'Staff Away'],
    Notes: ['Notes']
  },
  'Coverage Output': {
    Date: ['Date'],
    Day: ['Day'],
    Event_ID: ['Event_ID', 'Event ID', 'Field_Trip_ID', 'Field Trip ID'],
    Start: ['Start'],
    End: ['End'],
    Absent_Staff: ['Absent_Staff'],
    Class: ['Class'],
    Grade: ['Grade'],
    Subject: ['Subject'],
    Assignment_Type: ['Assignment_Type'],
    Room: ['Room'],
    Assigned_Coverage: ['Assigned_Coverage'],
    Coverage_Mode: ['Coverage_Mode'],
    Coverage_Tier_Used: ['Coverage_Tier_Used'],
    Status: ['Status'],
    Notes: ['Notes']
  },
  '_Preview': {
    Date: ['Date'],
    Day: ['Day'],
    Event_ID: ['Event_ID', 'Event ID', 'Field_Trip_ID', 'Field Trip ID'],
    Start: ['Start'],
    End: ['End'],
    Absent_Staff: ['Absent_Staff'],
    Class: ['Class'],
    Grade: ['Grade'],
    Subject: ['Subject'],
    Assignment_Type: ['Assignment_Type'],
    Room: ['Room'],
    Assigned_Coverage: ['Assigned_Coverage'],
    Coverage_Mode: ['Coverage_Mode'],
    Coverage_Tier_Used: ['Coverage_Tier_Used'],
    Status: ['Status'],
    Notes: ['Notes']
  },
  'Config': {
    Setting: ['Setting'],
    Value: ['Value'],
    Description: ['Description']
  }
};

function ensureFieldTripsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Field Trips');
  if (!sheet) {
    sheet = ss.insertSheet('Field Trips');
    sheet.getRange(1, 1, 1, SHEET_SCHEMAS['Field Trips'].headers.length)
      .setValues([SHEET_SCHEMAS['Field Trips'].headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHEET_SCHEMAS['Field Trips'].headers.length)
      .setFontWeight('bold')
      .setBackground('#d9eaf7');
  } else {
    ensureHeaderRow_(sheet, SHEET_SCHEMAS['Field Trips'].headers);
  }
  return sheet;
}

function normalizeGradeKey_(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const compact = raw.toLowerCase().replace(/[.\s_-]+/g, '');

  if (compact.indexOf('beginner') === 0 || compact.indexOf('beg') === 0) return 'Beg';
  if (compact.indexOf('prekindergarten') === 0 || compact.indexOf('prekind') === 0 || compact.indexOf('prek') === 0) return 'PreK';
  if (/^k[a-z]?$/.test(compact) || compact.indexOf('kindergarten') === 0) return 'K';

  const words = {
    first: '1',
    second: '2',
    third: '3',
    fourth: '4',
    fifth: '5',
    sixth: '6',
    seventh: '7',
    eighth: '8'
  };
  const lower = raw.toLowerCase();
  for (const word in words) {
    if (lower.indexOf(word) !== -1) return words[word];
  }

  const numeric = raw.match(/\d+/);
  if (numeric) return String(Number(numeric[0]));

  return raw;
}

function splitFieldTripStaffList_(value) {
  if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);

  // Staff names are commonly stored as "Last, First". Commas are part of
  // the person's name, not a list separator. Persisted field-trip staff are
  // separated with pipes, and semicolons are accepted as a manual fallback.
  return String(value || '')
    .split(/\s*[|;]\s*/)
    .map(v => v.trim())
    .filter(Boolean);
}

function normalizeFieldTripGrades_(value) {
  const seen = {};
  const values = Array.isArray(value)
    ? value
    : String(value || '').split(/\s*[|,;]\s*/);

  return values
    .map(normalizeGradeKey_)
    .filter(grade => {
      if (!grade || seen[grade]) return false;
      seen[grade] = true;
      return true;
    });
}

function normalizeFieldTripRow_(row) {
  const startDate = normalizeDateKey_(row.Date);
  const endDate = normalizeDateKey_(row.End_Date) || startDate;
  return {
    eventId: String(row.Event_ID || '').trim(),
    name: String(row.Name || '').trim(),
    date: startDate,
    startDate: startDate,
    endDate: endDate,
    start: timeToDisplay_(row.Start),
    end: timeToDisplay_(row.End),
    grades: normalizeFieldTripGrades_(row.Grades),
    staffNames: splitFieldTripStaffList_(row.Staff),
    notes: String(row.Notes || '').trim()
  };
}

function getFieldTripsInRange_(startDate, endDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Field Trips')) return [];

  const start = normalizeDateKey_(startDate);
  const end = normalizeDateKey_(endDate || startDate);
  return readSheetObjects_('Field Trips')
    .map(normalizeFieldTripRow_)
    .filter(row =>
      row.eventId &&
      row.startDate &&
      row.endDate &&
      (!start || row.endDate >= start) &&
      (!end || row.startDate <= end)
    )
    .sort((a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      a.start.localeCompare(b.start) ||
      a.name.localeCompare(b.name)
    );
}

function fieldTripForDate_(trip, date) {
  const key = normalizeDateKey_(date);
  if (!trip || !key || key < trip.startDate || key > trip.endDate) return null;

  const sameDay = trip.startDate === trip.endDate;
  let effectiveStartMinutes = 0;
  let effectiveEndMinutes = 1440;
  let allDayForDate = !sameDay && key !== trip.startDate && key !== trip.endDate;

  if (sameDay) {
    effectiveStartMinutes = displayTimeToMinutes_(trip.start);
    effectiveEndMinutes = displayTimeToMinutes_(trip.end);
    allDayForDate = false;
  } else if (key === trip.startDate) {
    effectiveStartMinutes = displayTimeToMinutes_(trip.start);
    effectiveEndMinutes = 1440;
    allDayForDate = false;
  } else if (key === trip.endDate) {
    effectiveStartMinutes = 0;
    effectiveEndMinutes = displayTimeToMinutes_(trip.end);
    allDayForDate = false;
  }

  return Object.assign({}, trip, {
    activeDate: key,
    effectiveStartMinutes: effectiveStartMinutes,
    effectiveEndMinutes: effectiveEndMinutes,
    allDayForDate: allDayForDate
  });
}

function getFieldTripsForDate_(date) {
  const key = normalizeDateKey_(date);
  return getFieldTripsInRange_(key, key)
    .map(trip => fieldTripForDate_(trip, key))
    .filter(Boolean);
}

function fieldTripIdentityKey_(trip) {
  trip = trip || {};
  const startDate = normalizeDateKey_(trip.startDate || trip.date || trip.Date);
  const endDate = normalizeDateKey_(trip.endDate || trip.End_Date || trip.startDate || trip.date || trip.Date);
  const name = String(trip.name || trip.Name || '').trim().toLowerCase();
  const start = timeToDisplay_(trip.start || trip.Start);
  const end = timeToDisplay_(trip.end || trip.End);
  const grades = normalizeFieldTripGrades_(trip.grades || trip.Grades).slice().sort().join('|');
  const staff = splitFieldTripStaffList_(trip.staffNames || trip.staff || trip.Staff)
    .map(name => String(name || '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');

  return [
    startDate || '',
    endDate || '',
    start || '',
    end || '',
    name,
    grades,
    staff
  ].join('::');
}

function saveFieldTrip_(payload) {
  payload = payload || {};
  const startDate = normalizeDateKey_(payload.startDate || payload.date);
  const endDate = normalizeDateKey_(payload.endDate || payload.startDate || payload.date);
  const name = String(payload.name || '').trim();
  const start = timeToDisplay_(payload.start);
  const end = timeToDisplay_(payload.end);
  const grades = normalizeFieldTripGrades_(payload.grades);
  const staffNames = splitFieldTripStaffList_(payload.staffNames || payload.staff);
  const notes = String(payload.notes || '').trim();

  if (!startDate) throw new Error('Choose a valid field trip start date.');
  if (!endDate) throw new Error('Choose a valid field trip end date.');
  if (endDate < startDate) throw new Error('Field trip end date must be the same as or after the start date.');
  if (!name) throw new Error('Enter a field trip name.');
  if (!start || !end) throw new Error('Enter both the departure and return time.');

  const startMinutes = displayTimeToMinutes_(start);
  const endMinutes = displayTimeToMinutes_(end);
  if (startMinutes == null || endMinutes == null) {
    throw new Error('Enter valid field trip departure and return times.');
  }
  if (startDate === endDate && endMinutes <= startMinutes) {
    throw new Error('For a one-day field trip, return time must be after departure time.');
  }

  if (!grades.length) throw new Error('Choose at least one student grade for the field trip.');
  if (!staffNames.length) throw new Error('Choose at least one staff member going on the field trip.');

  const sheet = ensureFieldTripsSheet_();
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(h => String(h || '').trim());
  const eventIdCol = findColumnByAliases_(headers, HEADER_ALIASES['Field Trips'].Event_ID);
  if (eventIdCol === -1) throw new Error('Field Trips sheet is missing Event_ID.');

  let eventId = String(payload.eventId || '').trim();

  const incomingIdentity = fieldTripIdentityKey_({
    name: name,
    startDate: startDate,
    endDate: endDate,
    start: start,
    end: end,
    grades: grades,
    staffNames: staffNames
  });
  const duplicate = getFieldTripsInRange_(startDate, endDate).find(trip =>
    trip.eventId !== eventId &&
    fieldTripIdentityKey_(trip) === incomingIdentity
  );

  if (duplicate) {
    if (eventId) {
      throw new Error(
        'Another field trip already matches this event exactly (' +
        (duplicate.name || 'Field Trip') + ', ' + duplicate.startDate + ').'
      );
    }
    return Object.assign({}, duplicate, { deduplicated: true });
  }

  if (!eventId) {
    eventId = 'FT-' + startDate.replace(/-/g, '') + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  }

  const values = sheet.getDataRange().getValues();
  let targetRow = -1;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][eventIdCol] || '').trim() === eventId) {
      targetRow = r + 1;
      break;
    }
  }
  if (targetRow === -1) targetRow = sheet.getLastRow() + 1;

  setSheetRowObject_(sheet, targetRow, headers, HEADER_ALIASES['Field Trips'], {
    Event_ID: eventId,
    Name: name,
    Date: startDate,
    End_Date: endDate,
    Start: start,
    End: end,
    Grades: grades.join(' | '),
    Staff: staffNames.join(' | '),
    Notes: notes
  });

  return normalizeFieldTripRow_({
    Event_ID: eventId,
    Name: name,
    Date: startDate,
    End_Date: endDate,
    Start: start,
    End: end,
    Grades: grades.join(' | '),
    Staff: staffNames.join(' | '),
    Notes: notes
  });
}

function deleteFieldTrip_(eventId) {
  const id = String(eventId || '').trim();
  if (!id) throw new Error('No field trip ID was provided.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Field Trips');
  if (!sheet || sheet.getLastRow() < 2) return { deleted: false, eventId: id };

  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(h => String(h || '').trim());
  const eventIdCol = findColumnByAliases_(headers, HEADER_ALIASES['Field Trips'].Event_ID);
  if (eventIdCol === -1) throw new Error('Field Trips sheet is missing Event_ID.');

  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][eventIdCol] || '').trim() === id) {
      sheet.deleteRow(r + 1);
      return { deleted: true, eventId: id };
    }
  }
  return { deleted: false, eventId: id };
}

function getCoverageStaffSheetName_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Coverage Staff')) return 'Coverage Staff';
  if (ss.getSheetByName('Substitutes')) return 'Substitutes';
  throw new Error('Missing sheet: Coverage Staff (or Substitutes)');
}

function getAllSchedulableStaff_(dayCode, date) {
  const config = getConfigMap_();
  const rows = date
    ? filterTeacherScheduleForDate_(readSheetObjects_('Teacher Schedule'), date, config)
    : readSheetObjects_('Teacher Schedule');
  const map = {};

  rows.forEach(row => {
    const normalized = normalizeTeacherScheduleRow_(row);
    if (dayCode && normalized.day !== String(dayCode).trim()) return;
    const name = normalized.staffName;
    if (!name) return;
    if (!map[name]) {
      map[name] = {
        name: name,
        role: normalized.role,
        days: {},
        blocks: []
      };
    }
    map[name].days[normalized.day] = true;
    if (normalized.startMinutes != null && normalized.endMinutes != null) {
      map[name].blocks.push({
        start: minutesToDisplay_(normalized.startMinutes),
        end: minutesToDisplay_(normalized.endMinutes),
        className: normalized.className,
        grade: normalized.grade,
        subject: normalized.subject,
        assignmentType: normalized.assignmentType,
        room: normalized.room,
        needsCoverageIfAbsent: normalized.needsCoverageIfAbsent
      });
    }
  });

  return Object.keys(map).sort().map(name => {
    map[name].blocks.sort((a, b) => displayTimeToMinutes_(a.start) - displayTimeToMinutes_(b.start));
    return map[name];
  });
}

function getActiveCoverageStaff_(date, day) {
  return getCoverageStaffForDate_(date, day, getConfigMap_())
    .filter(row => row.name && row.activeToday)
    .map(row => ({
      name: row.name,
      role: row.role,
      tier: row.tier,
      allDay: row.canCoverAllDay,
      selectedStart: row.selectedStart,
      selectedEnd: row.selectedEnd,
      notes: row.notes
    }))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
}

function getAllCoverageStaff_(date, day) {
  const config = getConfigMap_();
  return getCoverageStaffForDate_(date, day, config)
    .map(row => ({
      name: row.name,
      role: row.role,
      tier: row.tier,
      allDay: row.canCoverAllDay,
      activeToday: row.activeToday,
      availableDays: row.availableDays === '*' ? '' : row.availableDays,
      defaultStart: row.defaultStart,
      defaultEnd: row.defaultEnd,
      selectedStart: row.selectedStart,
      selectedEnd: row.selectedEnd,
      hasDateOverride: row.hasDateOverride,
      availabilityNotes: row.availabilityNotes,
      allowedGrades: row.allowedGrades === '*' ? '' : row.allowedGrades,
      allowedSubjects: row.allowedSubjects === '*' ? '' : row.allowedSubjects,
      allowedAssignmentTypes: row.allowedAssignmentTypes === '*' ? '' : row.allowedAssignmentTypes,
      maxBlocksPerDay: row.maxBlocksPerDay === Infinity ? '' : String(row.maxBlocksPerDay || ''),
      maxTeachersPerDay: row.maxTeachersPerDay === Infinity ? '' : String(row.maxTeachersPerDay || ''),
      canBeSplitAcrossTeachers: row.canBeSplitAcrossTeachers,
      notes: row.notes
    }))
    .filter(row => row.name)
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
}

function toggleCoverageStaffActive(payload) {
  payload = payload || {};
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('No staff name provided.');

  const date = normalizeDateKey_(payload.date);
  const day = String(payload.day || guessDayCodeFromDate_(date) || '').trim();

  if (date && day) {
    const current = getAllCoverageStaff_(date, day).find(row => row.name === name);
    const hasExplicitAvailable = payload.available !== undefined && payload.available !== null;
    const nextAvailable = hasExplicitAvailable
      ? normalizeYesNo_(payload.available, true)
      : !(current && current.activeToday);
    upsertSubstituteAvailability({
      date: date,
      day: day,
      name: name,
      available: nextAvailable,
      start: current ? current.selectedStart : '',
      end: current ? current.selectedEnd : '',
      notes: current ? current.availabilityNotes : ''
    });
    return getAllCoverageStaff_(date, day);
  }

  const sheetName = getCoverageStaffSheetName_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing sheet: ' + sheetName);

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const aliasMap = HEADER_ALIASES['Coverage Staff'];

  const nameCol = findColumnByAliases_(headers, aliasMap.Name);
  if (nameCol === -1) throw new Error('Cannot find Name column.');

  const activeCol = findColumnByAliases_(headers, aliasMap.Active_Today);
  if (activeCol === -1) throw new Error('Cannot find Active_Today column.');

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][nameCol] || '').trim() === name) {
      const current = normalizeYesNo_(values[r][activeCol], true);
      sheet.getRange(r + 1, activeCol + 1).setValue(current ? 'No' : 'Yes');
      break;
    }
  }

  return getAllCoverageStaff_();
}

function updateCoverageStaff(payload) {
  payload = payload || {};
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('No staff name provided.');

  const sheetName = getCoverageStaffSheetName_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing sheet: ' + sheetName);

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const aliasMap = HEADER_ALIASES['Coverage Staff'];

  const nameCol = findColumnByAliases_(headers, aliasMap.Name);
  if (nameCol === -1) throw new Error('Cannot find Name column.');

  let targetRow = -1;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][nameCol] || '').trim() === name) {
      targetRow = r;
      break;
    }
  }
  if (targetRow === -1) throw new Error('Coverage staff not found: ' + name);

  const fieldUpdates = {
    tier:              ['Coverage_Tier',              String(payload.tier || '')],
    canCoverAllDay:    ['Can_Cover_All_Day',          payload.canCoverAllDay ? 'Yes' : 'No'],
    activeToday:       ['Active_Today',               payload.activeToday ? 'Yes' : 'No'],
    availableDays:     ['Available_Days',             String(payload.availableDays || '')],
    defaultStart:      ['Default_Start',              String(payload.defaultStart || '')],
    defaultEnd:        ['Default_End',                String(payload.defaultEnd || '')],
    allowedGrades:     ['Allowed_Grades',             String(payload.allowedGrades || '')],
    allowedSubjects:   ['Allowed_Subjects',           String(payload.allowedSubjects || '')],
    maxBlocksPerDay:   ['Max_Blocks_Per_Day',         String(payload.maxBlocksPerDay || '')],
    maxTeachersPerDay: ['Max_Teachers_Per_Day',        String(payload.maxTeachersPerDay || '')],
    notes:             ['Notes',                       String(payload.notes || '')]
  };

  Object.keys(fieldUpdates).forEach(key => {
    if (payload[key] == null) return;
    const canonical = fieldUpdates[key][0];
    const value = fieldUpdates[key][1];
    const aliases = aliasMap[canonical];
    if (!aliases) return;
    const col = findColumnByAliases_(headers, aliases);
    if (col !== -1) {
      sheet.getRange(targetRow + 1, col + 1).setValue(value);
    }
  });

  const selectedDate = normalizeDateKey_(payload.date);
  const selectedDay = String(payload.day || guessDayCodeFromDate_(selectedDate) || '').trim();
  if (selectedDate && selectedDay && payload.availableOnDate != null) {
    upsertSubstituteAvailability({
      date: selectedDate,
      day: selectedDay,
      name: name,
      available: payload.availableOnDate,
      start: payload.selectedStart || '',
      end: payload.selectedEnd || '',
      notes: payload.availabilityNotes || ''
    });
  }

  return getAllCoverageStaff_(selectedDate, selectedDay);
}

function findColumnByAliases_(headers, aliases) {
  if (!aliases) return -1;
  for (let i = 0; i < aliases.length; i++) {
    const idx = headers.indexOf(aliases[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

function getDailyAbsencesForDate_(dateStr, dayCode) {
  const rows = readSheetObjects_('Daily Absences');
  return rows
    .filter(row => normalizeDateKey_(row.Date) === dateStr && String(row.Day || '').trim() === String(dayCode || '').trim())
    .map(row => ({
      date: normalizeDateKey_(row.Date),
      day: String(row.Day || '').trim(),
      staffName: String(row.Staff_Name || '').trim(),
      absenceType: String(row.Absence_Type || 'Full Day').trim(),
      startOverride: timeToDisplay_(row.Start_Override),
      endOverride: timeToDisplay_(row.End_Override),
      notes: String(row.Notes || '').trim(),
      emergency: isEmergencyAbsence_(row),
      preferredCoverage: String(row.Preferred_Coverage || '').trim()
    }))
    .filter(row => row.staffName)
    .sort((a, b) => a.staffName.localeCompare(b.staffName));
}

function replaceDailyAbsences(payload) {
  payload = payload || {};

  const date = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const day = String(payload.day || guessDayCodeFromDate_(date) || '').trim();
  const incomingAbsences = (payload.absences || []).filter(row => row && row.staffName);
  const staffNames = (payload.staffNames || []).filter(Boolean);

  if (!date) throw new Error('No date available for Daily Absences.');
  if (!day) throw new Error('No day code available for Daily Absences.');

  const rows = readSheetObjects_('Daily Absences');
  const kept = rows.filter(
    row => !(normalizeDateKey_(row.Date) === date && String(row.Day || '').trim() === day)
  );

  const added = incomingAbsences.length
    ? incomingAbsences.map(row => {
      const allDay = normalizeYesNo_(row.allDay, false);
      const emergency = normalizeYesNo_(row.emergency, false);
      return {
        Date: date,
        Day: day,
        Staff_Name: String(row.staffName || '').trim(),
        Absence_Type: allDay ? 'Full Day' : 'Partial Day',
        Start_Override: allDay ? '' : String(row.startOverride || '').trim(),
        End_Override: allDay ? '' : String(row.endOverride || '').trim(),
        Notes: emergency ? 'Emergency coverage' : String(row.notes || '').trim(),
        Preferred_Coverage: String(row.preferredCoverage || '').trim()
      };
    })
    : staffNames.map(name => ({
      Date: date,
      Day: day,
      Staff_Name: name,
      Absence_Type: 'Full Day',
      Start_Override: '',
      End_Override: '',
      Notes: '',
      Preferred_Coverage: ''
    }));

  clearSheetDataKeepingHeader_('Daily Absences');
  const finalRows = kept.concat(added);

  if (finalRows.length) {
    writeObjectsToSheet_(
      'Daily Absences',
      SHEET_SCHEMAS['Daily Absences'].headers,
      finalRows,
      false
    );
  }

  return getDailyAbsencesForDate_(date, day);
}

function fieldTripTimes_(trip) {
  return {
    startMinutes: trip && trip.effectiveStartMinutes != null
      ? Number(trip.effectiveStartMinutes)
      : displayTimeToMinutes_(trip && trip.start),
    endMinutes: trip && trip.effectiveEndMinutes != null
      ? Number(trip.effectiveEndMinutes)
      : displayTimeToMinutes_(trip && trip.end)
  };
}

function fieldTripGradeMatches_(trip, gradeValue) {
  const grade = normalizeGradeKey_(gradeValue);
  return !!grade && (trip.grades || []).some(value => normalizeGradeKey_(value) === grade);
}

function isInstructionalGradeBlock_(row) {
  const type = String(row.assignmentType || '').trim().toLowerCase();
  if (type === 'planning' || type === 'break' || type === 'lunch' || type === 'meeting' || type === 'duty') return false;
  return !!String(row.grade || '').trim();
}

function blockOverlapsFieldTrip_(row, trip) {
  const times = fieldTripTimes_(trip);
  if (times.startMinutes == null || times.endMinutes == null) return false;
  return row.startMinutes < times.endMinutes && row.endMinutes > times.startMinutes;
}

function blockIsCancelledByFieldTrip_(row, fieldTrips) {
  return (fieldTrips || []).some(trip =>
    fieldTripGradeMatches_(trip, row.grade) &&
    isInstructionalGradeBlock_(row) &&
    blockOverlapsFieldTrip_(row, trip)
  );
}

function buildFieldTripParticipantAbsences_(fieldTrips) {
  const rows = [];
  (fieldTrips || []).forEach(trip => {
    const times = fieldTripTimes_(trip);
    (trip.staffNames || []).forEach(name => {
      rows.push({
        staffName: name,
        absenceType: trip.allDayForDate ? 'Full Day' : 'Partial Day',
        startOverride: trip.allDayForDate ? '' : minutesToDisplay_(Math.min(times.startMinutes, 1439)),
        endOverride: trip.allDayForDate ? '' : minutesToDisplay_(Math.min(times.endMinutes, 1439)),
        notes: trip.name || 'Field Trip',
        emergency: false,
        preferredCoverage: '',
        fieldTripEventId: trip.eventId,
        fieldTripName: trip.name,
        fieldTripGrades: (trip.grades || []).slice()
      });
    });
  });
  return rows;
}

function candidateHasFieldTripEvent_(candidate, eventId) {
  const id = String(eventId || '').trim();
  if (!id) return false;
  return (candidate.fieldTripEvents || []).some(event => String(event.eventId || '').trim() === id);
}

function buildFieldTripCoverageCandidates_(fieldTrips, teacherSchedule, day, activeCoverageStaff, configuredCoverageStaff) {
  const normalized = teacherSchedule
    .map(row => normalizeTeacherScheduleRow_(row))
    .filter(row => row.day === day && row.staffName);

  const configuredByName = {};
  (configuredCoverageStaff || []).forEach(candidate => {
    if (candidate && candidate.name) configuredByName[candidate.name] = candidate;
  });

  const byName = {};
  (activeCoverageStaff || []).forEach(candidate => {
    byName[candidate.name] = Object.assign({}, candidate, {
      fieldTripEvents: (candidate.fieldTripEvents || []).slice(),
      fieldTripOnly: false
    });
  });

  (fieldTrips || []).forEach(trip => {
    const participantSet = {};
    (trip.staffNames || []).forEach(name => { participantSet[name] = true; });
    const tripTimes = fieldTripTimes_(trip);
    if (tripTimes.startMinutes == null || tripTimes.endMinutes == null) return;

    const affectedNames = {};
    normalized.forEach(row => {
      if (participantSet[row.staffName]) return;
      if (!fieldTripGradeMatches_(trip, row.grade)) return;
      if (!isInstructionalGradeBlock_(row)) return;
      if (!blockOverlapsFieldTrip_(row, trip)) return;
      affectedNames[row.staffName] = true;
    });

    Object.keys(affectedNames).forEach(name => {
      const configured = configuredByName[name];
      if (configured && !configured.activeToday) return;

      let candidate = byName[name];
      if (!candidate) {
        candidate = {
          name: name,
          role: 'Field Trip Release',
          tier: 3,
          canCoverAllDay: false,
          baseActive: true,
          activeToday: true,
          availableDays: '*',
          defaultStart: '',
          defaultEnd: '',
          selectedStart: '',
          selectedEnd: '',
          hasDateOverride: false,
          availabilityNotes: '',
          allowedGrades: '*',
          allowedSubjects: '*',
          allowedAssignmentTypes: '*',
          maxBlocksPerDay: Infinity,
          maxTeachersPerDay: Infinity,
          canBeSplitAcrossTeachers: true,
          notes: 'Temporary coverage availability created by a field trip.',
          fieldTripEvents: [],
          fieldTripOnly: true
        };
        byName[name] = candidate;
      }

      if (!candidate.fieldTripEvents) candidate.fieldTripEvents = [];
      if (!candidate.fieldTripEvents.some(event => event.eventId === trip.eventId)) {
        candidate.fieldTripEvents.push({
          eventId: trip.eventId,
          name: trip.name,
          grades: (trip.grades || []).slice(),
          startMinutes: tripTimes.startMinutes,
          endMinutes: tripTimes.endMinutes
        });
      }
    });
  });

  return Object.keys(byName).map(name => byName[name]);
}

function assignmentTypeIsBreak_(row) {
  return String(row && row.assignmentType || '').trim().toLowerCase() === 'break';
}

function assignmentTypeIsPlanning_(row) {
  return String(row && row.assignmentType || '').trim().toLowerCase() === 'planning';
}

function candidateBreakReservations_(candidateName, state) {
  if (!state || !state.breakReservationsByCandidate) return [];
  return state.breakReservationsByCandidate[candidateName] || [];
}

function candidateHasReservedBreakConflict_(candidateName, block, state) {
  return candidateBreakReservations_(candidateName, state).some(reservation =>
    timesOverlap_(reservation.startMinutes, reservation.endMinutes, block.startMinutes, block.endMinutes)
  );
}

function intervalConflictsWithCandidateState_(candidateName, startMinutes, endMinutes, state) {
  const assignments = state && state.assignmentsByCandidate && state.assignmentsByCandidate[candidateName] || [];
  if (assignments.some(existing =>
    timesOverlap_(existing.startMinutes, existing.endMinutes, startMinutes, endMinutes)
  )) return true;

  return candidateBreakReservations_(candidateName, state).some(reservation =>
    timesOverlap_(reservation.startMinutes, reservation.endMinutes, startMinutes, endMinutes)
  );
}

function findOpenBreakSlotInReleasedRow_(candidateName, releasedRow, durationMinutes, state) {
  if (!releasedRow || durationMinutes <= 0) return null;
  if ((releasedRow.endMinutes - releasedRow.startMinutes) < durationMinutes) return null;

  const busy = [];
  const assignments = state && state.assignmentsByCandidate && state.assignmentsByCandidate[candidateName] || [];
  assignments.forEach(item => busy.push({
    startMinutes: item.startMinutes,
    endMinutes: item.endMinutes
  }));
  candidateBreakReservations_(candidateName, state).forEach(item => busy.push({
    startMinutes: item.startMinutes,
    endMinutes: item.endMinutes
  }));

  const absenceWindows = absenceWindowsForCandidate_(candidateName, state);
  for (const absence of absenceWindows) {
    if (absence.allDay) return null;
    if (absence.startMinutes == null || absence.endMinutes == null) return null;
    busy.push({
      startMinutes: absence.startMinutes,
      endMinutes: absence.endMinutes
    });
  }

  busy.sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  let cursor = releasedRow.startMinutes;
  for (const interval of busy) {
    if (interval.endMinutes <= cursor) continue;
    if (interval.startMinutes >= releasedRow.endMinutes) break;
    if (interval.startMinutes - cursor >= durationMinutes) {
      return {
        startMinutes: cursor,
        endMinutes: cursor + durationMinutes
      };
    }
    cursor = Math.max(cursor, interval.endMinutes);
    if (cursor + durationMinutes > releasedRow.endMinutes) return null;
  }

  if (cursor + durationMinutes <= releasedRow.endMinutes) {
    return {
      startMinutes: cursor,
      endMinutes: cursor + durationMinutes
    };
  }
  return null;
}

function mergeTimeSegments_(segments) {
  const sorted = (segments || [])
    .filter(segment => segment && segment.endMinutes > segment.startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const merged = [];
  sorted.forEach(segment => {
    const last = merged[merged.length - 1];
    if (!last || segment.startMinutes > last.endMinutes) {
      merged.push({
        startMinutes: segment.startMinutes,
        endMinutes: segment.endMinutes
      });
      return;
    }
    last.endMinutes = Math.max(last.endMinutes, segment.endMinutes);
  });
  return merged;
}

function uncoveredIntervals_(startMinutes, endMinutes, coveredSegments) {
  const merged = mergeTimeSegments_(coveredSegments);
  const gaps = [];
  let cursor = startMinutes;

  merged.forEach(segment => {
    if (segment.endMinutes <= cursor || segment.startMinutes >= endMinutes) return;
    const start = Math.max(segment.startMinutes, startMinutes);
    const end = Math.min(segment.endMinutes, endMinutes);
    if (start > cursor) gaps.push({ startMinutes: cursor, endMinutes: start });
    cursor = Math.max(cursor, end);
  });

  if (cursor < endMinutes) gaps.push({ startMinutes: cursor, endMinutes: endMinutes });
  return gaps.filter(gap => gap.endMinutes > gap.startMinutes);
}

function segmentsCoverIntervals_(segments, intervals) {
  const merged = mergeTimeSegments_(segments);
  return (intervals || []).every(interval => {
    let cursor = interval.startMinutes;
    for (const segment of merged) {
      if (segment.endMinutes <= cursor) continue;
      if (segment.startMinutes > cursor) return false;
      cursor = Math.max(cursor, segment.endMinutes);
      if (cursor >= interval.endMinutes) return true;
    }
    return cursor >= interval.endMinutes;
  });
}

function fieldTripReleasedRows_(availabilityRows, event) {
  return (availabilityRows || []).filter(row =>
    isInstructionalGradeBlock_(row) &&
    (event.grades || []).some(grade => normalizeGradeKey_(grade) === normalizeGradeKey_(row.grade)) &&
    row.startMinutes < event.endMinutes &&
    row.endMinutes > event.startMinutes
  );
}

function fieldTripCoverageComposition_(candidate, block, event, availabilityRows, state) {
  const releasedRows = fieldTripReleasedRows_(availabilityRows, event);
  const releasedSegments = releasedRows
    .map(row => ({
      startMinutes: Math.max(row.startMinutes, block.startMinutes),
      endMinutes: Math.min(row.endMinutes, block.endMinutes),
      row: row,
      kind: 'released'
    }))
    .filter(segment => segment.endMinutes > segment.startMinutes);

  const planningSegments = (availabilityRows || [])
    .filter(row => row.coverEligibleThisBlock && assignmentTypeIsPlanning_(row))
    .map(row => ({
      startMinutes: Math.max(row.startMinutes, block.startMinutes),
      endMinutes: Math.min(row.endMinutes, block.endMinutes),
      row: row,
      kind: 'planning'
    }))
    .filter(segment => segment.endMinutes > segment.startMinutes);

  const nonBreakSegments = releasedSegments.concat(planningSegments);
  const uncovered = uncoveredIntervals_(block.startMinutes, block.endMinutes, nonBreakSegments);

  if (!uncovered.length) {
    const releasedNames = releasedSegments
      .filter(segment => segment.startMinutes < block.endMinutes && segment.endMinutes > block.startMinutes)
      .map(segment => segment.row.className || (normalizeGradeKey_(segment.row.grade) + ' class'));
    const planningUsed = planningSegments.length > 0;

    const directReleaseWindows = mergeTimeSegments_(
      releasedRows.map(row => ({
        startMinutes: Math.max(row.startMinutes, event.startMinutes),
        endMinutes: Math.min(row.endMinutes, event.endMinutes)
      }))
    );
    const containingRelease = directReleaseWindows.find(window =>
      window.startMinutes <= block.startMinutes &&
      window.endMinutes >= block.endMinutes
    );
    const runwayMinutes = containingRelease
      ? Math.max(0, containingRelease.endMinutes - block.endMinutes)
      : 0;

    return {
      available: true,
      priority: releasedSegments.length ? 3 : 1,
      reason: releasedSegments.length
        ? 'Available because ' + Array.from(new Set(releasedNames)).join(' + ') +
          ' ' + (releasedNames.length > 1 ? 'are' : 'is') +
          ' cancelled by ' + (event.name || 'the field trip')
        : 'Available during planning; included in the field-trip pool because this teacher teaches ' +
          ((event.grades || []).join('/') || 'the trip grade'),
      breakMove: null,
      runwayMinutes: runwayMinutes
    };
  }

  const breakSegments = (availabilityRows || [])
    .filter(row => assignmentTypeIsBreak_(row))
    .map(row => ({
      startMinutes: Math.max(row.startMinutes, block.startMinutes),
      endMinutes: Math.min(row.endMinutes, block.endMinutes),
      row: row,
      kind: 'break'
    }))
    .filter(segment => segment.endMinutes > segment.startMinutes);

  if (!segmentsCoverIntervals_(breakSegments, uncovered)) {
    return { available: false, priority: 0, reason: '', breakMove: null };
  }

  const displacedBreakMinutes = uncovered.reduce(
    (sum, gap) => sum + (gap.endMinutes - gap.startMinutes),
    0
  );
  if (displacedBreakMinutes <= 0) {
    return { available: false, priority: 0, reason: '', breakMove: null };
  }

  const replacementAnchor = uncovered.length
    ? uncovered[uncovered.length - 1].endMinutes
    : block.endMinutes;

  const replacementRows = releasedRows
    .filter(row => !timesOverlap_(row.startMinutes, row.endMinutes, block.startMinutes, block.endMinutes))
    .map(row => Object.assign({}, row, {
      startMinutes: Math.max(row.startMinutes, event.startMinutes),
      endMinutes: Math.min(row.endMinutes, event.endMinutes)
    }))
    .filter(row => row.endMinutes > row.startMinutes)
    .sort((a, b) => {
      const aAfter = a.startMinutes >= replacementAnchor;
      const bAfter = b.startMinutes >= replacementAnchor;
      if (aAfter !== bAfter) return aAfter ? -1 : 1;
      if (aAfter) return a.startMinutes - b.startMinutes;
      return b.endMinutes - a.endMinutes;
    });

  let replacement = null;
  let replacementRow = null;
  for (const row of replacementRows) {
    const slot = findOpenBreakSlotInReleasedRow_(
      candidate.name,
      row,
      displacedBreakMinutes,
      state
    );
    if (!slot) continue;
    replacement = slot;
    replacementRow = row;
    break;
  }

  if (!replacement || !replacementRow) {
    return { available: false, priority: 0, reason: '', breakMove: null };
  }

  const displacedText = uncovered
    .map(gap => minutesToDisplay_(gap.startMinutes) + '–' + minutesToDisplay_(gap.endMinutes))
    .join(' + ');

  const releasedUsed = releasedSegments
    .map(segment => segment.row.className || (normalizeGradeKey_(segment.row.grade) + ' class'));
  const releasedText = Array.from(new Set(releasedUsed)).join(' + ');

  const reason =
    (releasedText
      ? 'Available because ' + releasedText + ' is cancelled by ' + (event.name || 'the field trip') + '; '
      : '') +
    'break time used for ' + displacedText +
    ' and moved to ' +
    minutesToDisplay_(replacement.startMinutes) + '–' + minutesToDisplay_(replacement.endMinutes) +
    ' inside cancelled ' +
    (replacementRow.className || (normalizeGradeKey_(replacementRow.grade) + ' class'));

  return {
    available: true,
    priority: 2,
    reason: reason,
    runwayMinutes: 0,
    breakMove: {
      eventId: event.eventId,
      originalBreakStartMinutes: uncovered[0].startMinutes,
      originalBreakEndMinutes: uncovered[uncovered.length - 1].endMinutes,
      replacementStartMinutes: replacement.startMinutes,
      replacementEndMinutes: replacement.endMinutes,
      replacementGrade: normalizeGradeKey_(replacementRow.grade),
      replacementClass: replacementRow.className || replacementRow.subject || 'trip-grade class',
      reason: reason
    }
  };
}

function findFieldTripBreakMove_(candidate, block, event, availabilityRows, state) {
  const currentBreak = availabilityRows.find(row =>
    assignmentTypeIsBreak_(row) &&
    row.startMinutes <= block.startMinutes &&
    row.endMinutes >= block.endMinutes
  );
  if (!currentBreak) return null;

  const breakDuration = currentBreak.endMinutes - currentBreak.startMinutes;
  if (breakDuration <= 0) return null;

  const releasedRows = availabilityRows
    .filter(row =>
      isInstructionalGradeBlock_(row) &&
      (event.grades || []).some(grade => normalizeGradeKey_(grade) === normalizeGradeKey_(row.grade)) &&
      row.startMinutes < event.endMinutes &&
      row.endMinutes > event.startMinutes &&
      !timesOverlap_(row.startMinutes, row.endMinutes, block.startMinutes, block.endMinutes)
    )
    .sort((a, b) => a.startMinutes - b.startMinutes);

  for (const released of releasedRows) {
    const slot = findOpenBreakSlotInReleasedRow_(candidate.name, released, breakDuration, state);
    if (!slot) continue;

    return {
      eventId: event.eventId,
      originalBreakStartMinutes: currentBreak.startMinutes,
      originalBreakEndMinutes: currentBreak.endMinutes,
      replacementStartMinutes: slot.startMinutes,
      replacementEndMinutes: slot.endMinutes,
      replacementGrade: normalizeGradeKey_(released.grade),
      replacementClass: released.className || released.subject || 'trip-grade class',
      reason:
        'Break moved from ' +
        minutesToDisplay_(currentBreak.startMinutes) + '–' + minutesToDisplay_(currentBreak.endMinutes) +
        ' to ' +
        minutesToDisplay_(slot.startMinutes) + '–' + minutesToDisplay_(slot.endMinutes) +
        ' because ' + (released.className || (normalizeGradeKey_(released.grade) + ' class')) +
        ' is cancelled by ' + (event.name || 'the field trip')
    };
  }

  return null;
}

function candidateFieldTripAvailability_(candidate, block, availabilityRows, state) {
  if (!block.fieldTripEventId || !candidateHasFieldTripEvent_(candidate, block.fieldTripEventId)) {
    return { available: false, fieldTripPriority: 0, fieldTripReason: '', fieldTripBreakMove: null, fieldTripRunwayMinutes: 0 };
  }

  const event = (candidate.fieldTripEvents || []).find(item => item.eventId === block.fieldTripEventId);
  if (!event) {
    return { available: false, fieldTripPriority: 0, fieldTripReason: '', fieldTripBreakMove: null, fieldTripRunwayMinutes: 0 };
  }

  if (candidateHasReservedBreakConflict_(candidate.name, block, state)) {
    return {
      available: false,
      fieldTripPriority: 0,
      fieldTripReason: 'Reserved as replacement break for an earlier field-trip coverage assignment',
      fieldTripBreakMove: null,
      fieldTripRunwayMinutes: 0
    };
  }

  const composition = fieldTripCoverageComposition_(
    candidate,
    block,
    event,
    availabilityRows,
    state
  );

  return {
    available: !!composition.available,
    fieldTripPriority: Number(composition.priority || 0),
    fieldTripReason: composition.reason || '',
    fieldTripBreakMove: composition.breakMove || null,
    fieldTripRunwayMinutes: Number(composition.runwayMinutes || 0)
  };
}

function planRowToCoverageBlock_(row) {
  row = row || {};
  return {
    staffName: String(row.Absent_Staff || '').trim(),
    startMinutes: displayTimeToMinutes_(row.Start),
    endMinutes: displayTimeToMinutes_(row.End),
    className: String(row.Class || '').trim(),
    grade: String(row.Grade || '').trim() || inferGradeFromClass_(row.Class || ''),
    subject: String(row.Subject || '').trim(),
    assignmentType: String(row.Assignment_Type || '').trim() || 'Class',
    room: String(row.Room || '').trim(),
    fieldTripEventId: String(row.Event_ID || '').trim(),
    emergencyOverride: false
  };
}

function makeManualScheduleCandidate_(name, role) {
  return {
    name: String(name || '').trim(),
    role: String(role || 'Staff').trim(),
    tier: 3,
    canCoverAllDay: false,
    baseActive: true,
    activeToday: true,
    availableDays: '*',
    defaultStart: '',
    defaultEnd: '',
    selectedStart: '',
    selectedEnd: '',
    hasDateOverride: false,
    availabilityNotes: '',
    allowedGrades: '*',
    allowedSubjects: '*',
    allowedAssignmentTypes: '*',
    maxBlocksPerDay: Infinity,
    maxTeachersPerDay: Infinity,
    canBeSplitAcrossTeachers: true,
    notes: 'Manual placement candidate derived from Teacher Schedule.',
    fieldTripEvents: [],
    fieldTripOnly: false,
    manualSource: 'Available Staff'
  };
}

function buildManualCoverageCandidates_(date, day, config, fieldTrips, teacherSchedule) {
  const configuredCoverageStaff = getCoverageStaffForDate_(date, day, config);
  const activeCoverageStaff = configuredCoverageStaff.filter(row => row.name && row.activeToday);

  const automaticPool = buildFieldTripCoverageCandidates_(
    fieldTrips,
    teacherSchedule,
    day,
    activeCoverageStaff,
    configuredCoverageStaff
  );

  const configuredNames = {};
  configuredCoverageStaff.forEach(candidate => {
    if (candidate && candidate.name) configuredNames[candidate.name] = candidate;
  });

  const byName = {};
  automaticPool.forEach(candidate => {
    const copy = Object.assign({}, candidate);
    copy.manualSource = (copy.fieldTripEvents || []).length
      ? 'Field Trip Pool'
      : 'Coverage Staff';
    byName[copy.name] = copy;
  });

  teacherSchedule
    .map(row => normalizeTeacherScheduleRow_(row))
    .filter(row => row.day === day && row.staffName)
    .forEach(row => {
      if (byName[row.staffName]) return;

      // If this person is explicitly managed in Coverage Staff and has been
      // marked unavailable for the date, do not reintroduce them through their
      // Teacher Schedule row.
      if (configuredNames[row.staffName] && !configuredNames[row.staffName].activeToday) return;

      const candidate = makeManualScheduleCandidate_(row.staffName, row.role || 'Staff');
      if (configuredNames[row.staffName]) candidate.manualSource = 'Coverage Staff';
      byName[row.staffName] = candidate;
    });

  return Object.keys(byName)
    .map(name => byName[name])
    .filter(candidate => candidate && candidate.name);
}

function manualCoverageStateFromPlan_(planRows, excludedIndex, candidates, teacherSchedule, day, effectiveAbsences) {
  const state = makeEmptyState_();
  state.absencesByCandidate = buildAbsenceWindowsByStaff_(effectiveAbsences);

  const candidateByName = {};
  (candidates || []).forEach(candidate => {
    if (candidate && candidate.name) candidateByName[candidate.name] = candidate;
  });

  (planRows || [])
    .map((row, index) => ({ row: row || {}, index: index }))
    .filter(item =>
      item.index !== excludedIndex &&
      String(item.row.Status || '').trim() === 'Assigned' &&
      String(item.row.Assigned_Coverage || '').trim()
    )
    .sort((a, b) => {
      const ab = planRowToCoverageBlock_(a.row);
      const bb = planRowToCoverageBlock_(b.row);
      return (ab.startMinutes || 0) - (bb.startMinutes || 0) ||
        (ab.endMinutes || 0) - (bb.endMinutes || 0) ||
        a.index - b.index;
    })
    .forEach(item => {
      const name = String(item.row.Assigned_Coverage || '').trim();
      const block = planRowToCoverageBlock_(item.row);
      if (!name || block.startMinutes == null || block.endMinutes == null) return;

      let candidate = candidateByName[name] || makeManualScheduleCandidate_(name, 'Staff');

      // Reconstruct any field-trip break reservation used by an existing row
      // so later manual choices cannot consume that replacement break.
      const availability = candidateAvailabilityForBlock_(
        candidate,
        block,
        teacherSchedule,
        day,
        state
      );
      if (availability && availability.fieldTripBreakMove) {
        candidate = Object.assign({}, candidate, {
          fieldTripBreakMove: availability.fieldTripBreakMove
        });
      }

      recordAssignment_(
        state,
        candidate,
        block,
        String(item.row.Absent_Staff || '').trim()
      );
    });

  return state;
}

function manualCoverageContext_(payload) {
  payload = payload || {};
  const date = normalizeDateKey_(payload.date);
  const day = String(payload.day || guessDayCodeFromDate_(date) || '').trim();
  const planRows = Array.isArray(payload.rows) ? payload.rows : [];
  const blockIndex = Number(payload.blockIndex);
  if (!date) throw new Error('Choose a valid date before reassigning coverage.');
  if (!day) throw new Error('The selected date does not have a valid school-day code.');
  if (!Number.isInteger(blockIndex) || blockIndex < 0 || blockIndex >= planRows.length) {
    throw new Error('The coverage block could not be identified.');
  }

  const row = planRows[blockIndex] || {};
  const block = planRowToCoverageBlock_(row);
  if (block.startMinutes == null || block.endMinutes == null) {
    throw new Error('The selected coverage block has an invalid start or end time.');
  }

  const config = getConfigMap_();
  const teacherSchedule = filterTeacherScheduleForDate_(
    readSheetObjects_('Teacher Schedule'),
    date,
    config
  );
  const absences = getDailyAbsencesForDate_(date, day);
  const fieldTrips = getFieldTripsForDate_(date);
  const effectiveAbsences = absences.concat(buildFieldTripParticipantAbsences_(fieldTrips));
  const candidates = buildManualCoverageCandidates_(
    date,
    day,
    config,
    fieldTrips,
    teacherSchedule
  );
  const state = manualCoverageStateFromPlan_(
    planRows,
    blockIndex,
    candidates,
    teacherSchedule,
    day,
    effectiveAbsences
  );

  return {
    date: date,
    day: day,
    row: row,
    block: block,
    config: config,
    teacherSchedule: teacherSchedule,
    absences: absences,
    fieldTrips: fieldTrips,
    effectiveAbsences: effectiveAbsences,
    candidates: candidates,
    state: state
  };
}

function getManualCoverageChoices_(payload) {
  const context = manualCoverageContext_(payload);
  const row = context.row;
  const block = context.block;
  const absentName = String(row.Absent_Staff || '').trim();
  const currentName = String(row.Assigned_Coverage || '').trim();
  const choices = [];
  const absentDuringBlock = [];

  context.candidates.forEach(candidate => {
    if (!candidate || !candidate.name || candidate.name === absentName) return;

    if (candidateIsAbsentForBlock_(candidate.name, block, context.state)) {
      absentDuringBlock.push(candidate.name);
      return;
    }

    if (!candidateCanCoverBlock_(
      candidate,
      absentName,
      block,
      context.teacherSchedule,
      context.day,
      context.state,
      context.config
    )) return;

    const availability = candidateAvailabilityForBlock_(
      candidate,
      block,
      context.teacherSchedule,
      context.day,
      context.state
    );

    const fieldTripPool = !!(
      block.fieldTripEventId &&
      candidateHasFieldTripEvent_(candidate, block.fieldTripEventId)
    );
    const source = fieldTripPool
      ? 'Field Trip Pool'
      : (candidate.manualSource || 'Available Staff');

    const scoreInfo = scoreCandidateForBlock_(candidate, absentName, block, context.state);
    const fieldTripBoost = Number(availability.fieldTripPriority || 0) * 250;
    const runwayBoost = Math.min(Math.max(0, Number(availability.fieldTripRunwayMinutes || 0)), 60);

    choices.push({
      name: candidate.name,
      role: candidate.role || '',
      tier: candidate.tier,
      source: source,
      recommended: fieldTripPool,
      reason: availability.fieldTripReason ||
        (candidate.canCoverAllDay
          ? 'Available as Coverage Staff for the full block.'
          : 'Available during a cover-eligible schedule block.'),
      score: scoreInfo.score + fieldTripBoost + runwayBoost
    });
  });

  choices.sort((a, b) => {
    const sourceRank = source => source === 'Field Trip Pool' ? 0 : source === 'Coverage Staff' ? 1 : 2;
    return sourceRank(a.source) - sourceRank(b.source) ||
      b.score - a.score ||
      a.name.localeCompare(b.name);
  });

  return {
    date: context.date,
    day: context.day,
    blockIndex: Number(payload.blockIndex),
    currentName: currentName,
    currentEligible: !currentName || choices.some(choice => choice.name === currentName),
    choices: choices,
    excludedAbsentNames: Array.from(new Set(absentDuringBlock)).sort()
  };
}

function validateManualCoverageAssignment_(payload) {
  payload = payload || {};
  const name = String(payload.name || '').trim();

  if (!name) {
    return {
      valid: true,
      name: '',
      tier: '',
      source: '',
      reason: 'Manually left unfilled.'
    };
  }

  const result = getManualCoverageChoices_(payload);
  const choice = result.choices.find(item => item.name === name);
  if (!choice) {
    if (result.excludedAbsentNames.indexOf(name) !== -1) {
      throw new Error(name + ' is absent during this coverage block and cannot be assigned.');
    }
    throw new Error(name + ' is not available for this coverage block because of schedule, absence, trip, or another coverage conflict.');
  }

  return {
    valid: true,
    name: choice.name,
    tier: choice.tier,
    source: choice.source,
    reason: 'Manually assigned. ' + choice.reason
  };
}

function scheduleFieldTripNeedsChronologically_(
  needsByTeacher,
  coverageStaff,
  teacherSchedule,
  day,
  state,
  config,
  date,
  planRows,
  summary
) {
  const tripNeeds = [];

  Object.keys(needsByTeacher || {}).forEach(absentName => {
    (needsByTeacher[absentName] || []).forEach(block => {
      if (!block.fieldTripEventId) return;
      tripNeeds.push({
        absentName: absentName,
        block: block
      });
    });
  });

  tripNeeds.sort((a, b) =>
    a.block.startMinutes - b.block.startMinutes ||
    a.block.endMinutes - b.block.endMinutes ||
    a.absentName.localeCompare(b.absentName)
  );

  const deferred = [];
  const assignedAbsentNames = {};

  // First pass: use only people released by this field trip. This lets normal
  // Coverage Staff remain available for ordinary absences unless needed later.
  tripNeeds.forEach(item => {
    const eventPool = coverageStaff.filter(candidate =>
      candidateHasFieldTripEvent_(candidate, item.block.fieldTripEventId)
    );
    const best = pickBestBlockCandidate_(
      item.absentName,
      item.block,
      eventPool,
      teacherSchedule,
      day,
      state,
      config
    );

    if (!best) {
      deferred.push(item);
      return;
    }

    planRows.push(makePlanRow_(
      date,
      day,
      item.block,
      best,
      'Field Trip Coverage',
      'Assigned',
      best.reason
    ));
    recordAssignment_(state, best, item.block, item.absentName);
    summary.assignedBlocks += 1;
    assignedAbsentNames[item.absentName] = true;
  });

  return {
    deferred: deferred,
    assignedAbsentNames: assignedAbsentNames,
    totalBlocks: tripNeeds.length
  };
}

function fillDeferredFieldTripNeeds_(
  deferred,
  coverageStaff,
  teacherSchedule,
  day,
  state,
  config,
  date,
  planRows,
  summary
) {
  const assignedAbsentNames = {};

  (deferred || []).forEach(item => {
    const best = pickBestBlockCandidate_(
      item.absentName,
      item.block,
      coverageStaff,
      teacherSchedule,
      day,
      state,
      config
    );

    if (best) {
      planRows.push(makePlanRow_(
        date,
        day,
        item.block,
        best,
        'Field Trip Coverage',
        'Assigned',
        best.reason
      ));
      recordAssignment_(state, best, item.block, item.absentName);
      summary.assignedBlocks += 1;
      assignedAbsentNames[item.absentName] = true;
    } else {
      planRows.push(makePlanRow_(
        date,
        day,
        item.block,
        null,
        'Field Trip Coverage',
        'Unfilled',
        'No eligible field-trip coverage person or fallback coverage person found.'
      ));
      summary.unfilledBlocks += 1;
    }
  });

  return assignedAbsentNames;
}

function generateCoveragePreview(payload) {
  payload = payload || {};
  const date = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const day = payload.day || guessDayCodeFromDate_(date);

  const config = getConfigMap_();
  const teacherSchedule = filterTeacherScheduleForDate_(
    readSheetObjects_('Teacher Schedule'),
    date,
    config
  );
  const configuredCoverageStaff = getCoverageStaffForDate_(date, day, config);
  const activeCoverageStaff = configuredCoverageStaff.filter(row => row.name && row.activeToday);
  const absences = getDailyAbsencesForDate_(date, day);
  const fieldTrips = getFieldTripsForDate_(date);
  const fieldTripAbsences = buildFieldTripParticipantAbsences_(fieldTrips);
  const effectiveAbsences = absences.concat(fieldTripAbsences);
  const coverageStaff = buildFieldTripCoverageCandidates_(
    fieldTrips,
    teacherSchedule,
    day,
    activeCoverageStaff,
    configuredCoverageStaff
  );

  const needsByTeacher = buildCoverageNeedsByTeacher_(
    effectiveAbsences,
    teacherSchedule,
    day,
    fieldTrips
  );

  const state = makeEmptyState_();
  state.absencesByCandidate = buildAbsenceWindowsByStaff_(effectiveAbsences);
  const planRows = [];
  const summary = {
    totalAbsentStaff: Object.keys(needsByTeacher).filter(name => (needsByTeacher[name] || []).length).length,
    totalBlocks: 0,
    assignedBlocks: 0,
    unfilledBlocks: 0,
    wholeDayAssignments: 0,
    splitAssignments: 0,
    fieldTrips: fieldTrips.length
  };

  // ── Manual/preferred ordinary assignments first ──
  const manualNames = new Set();
  absences.filter(a => a.preferredCoverage).forEach(absence => {
    const absentName = absence.staffName;
    const preferred = absence.preferredCoverage;
    const blocks = (needsByTeacher[absentName] || []).filter(block => !block.fieldTripEventId);
    if (!blocks.length) return;

    const candidate = coverageStaff.find(c => c.name === preferred);

    // A preferred/manual person is a preference, not permission to bypass
    // absences, schedule conflicts, availability windows, or daily limits.
    if (!candidate || !candidateCanCoverAllBlocks_(
      candidate,
      absentName,
      blocks,
      teacherSchedule,
      day,
      state,
      config
    )) {
      return;
    }

    const candidateInfo = {
      name: candidate.name,
      tier: candidate.tier,
      role: candidate.role
    };

    blocks.forEach(block => {
      planRows.push(makePlanRow_(date, day, block, candidateInfo, 'Manual', 'Assigned', 'Manually preferred: ' + preferred + '.'));
      recordAssignment_(state, candidate, block, absentName);
    });

    summary.totalBlocks += blocks.length;
    summary.assignedBlocks += blocks.length;
    manualNames.add(absentName);
  });

  // ── Field trip first pass: event-created staff pool, global chronological order ──
  const tripPass = scheduleFieldTripNeedsChronologically_(
    needsByTeacher,
    coverageStaff,
    teacherSchedule,
    day,
    state,
    config,
    date,
    planRows,
    summary
  );
  summary.totalBlocks += tripPass.totalBlocks;
  if (Object.keys(tripPass.assignedAbsentNames).length) {
    summary.splitAssignments += Object.keys(tripPass.assignedAbsentNames).length;
  }

  // ── Ordinary automatic coverage ──
  const orderedNeeds = Object.keys(needsByTeacher)
    .filter(name => !manualNames.has(name))
    .map(absentName => ({
      absentName: absentName,
      blocks: (needsByTeacher[absentName] || []).filter(block => !block.fieldTripEventId)
    }))
    .filter(item => item.blocks.length)
    .map(item => ({
      absentName: item.absentName,
      blocks: item.blocks,
      difficulty: estimateDifficulty_(item.absentName, item.blocks, coverageStaff, teacherSchedule, day, config)
    }))
    .sort((a, b) =>
      a.difficulty.fullDayCandidateCount - b.difficulty.fullDayCandidateCount ||
      b.blocks.length - a.blocks.length ||
      a.absentName.localeCompare(b.absentName)
    );

  orderedNeeds.forEach(item => {
    const absentName = item.absentName;
    const blocks = item.blocks.slice().sort((a, b) => a.startMinutes - b.startMinutes);
    summary.totalBlocks += blocks.length;
    if (!blocks.length) return;

    let assignedWholeDay = false;

    if (normalizeYesNo_(config.Whole_Day_First, true)) {
      const fullDayCandidate = pickBestWholeDayCandidate_(
        absentName,
        blocks,
        coverageStaff,
        teacherSchedule,
        day,
        state,
        config
      );
      if (fullDayCandidate) {
        blocks.forEach(block => {
          planRows.push(makePlanRow_(
            date,
            day,
            block,
            fullDayCandidate,
            'Whole Day',
            'Assigned',
            fullDayCandidate.reason || 'Whole-day assignment.'
          ));
          recordAssignment_(state, fullDayCandidate, block, absentName);
        });
        assignedWholeDay = true;
        summary.assignedBlocks += blocks.length;
        summary.wholeDayAssignments += 1;
      }
    }

    if (assignedWholeDay) return;

    if (!normalizeYesNo_(config.Allow_Split_Coverage, true)) {
      blocks.forEach(block => {
        planRows.push(makePlanRow_(
          date,
          day,
          block,
          null,
          'Unfilled',
          'Unfilled',
          'Split coverage disabled and no full-day match found.'
        ));
        summary.unfilledBlocks += 1;
      });
      return;
    }

    let usedSomeone = false;
    const remainingBlocks = [];
    const primary = pickPrimarySplitCandidate_(
      absentName,
      blocks,
      coverageStaff,
      teacherSchedule,
      day,
      state,
      config
    );

    if (primary) {
      blocks.forEach(block => {
        if (candidateCanCoverBlock_(primary, absentName, block, teacherSchedule, day, state, config)) {
          planRows.push(makePlanRow_(
            date,
            day,
            block,
            primary,
            'Split Coverage',
            'Assigned',
            primary.reason
          ));
          recordAssignment_(state, primary, block, absentName);
          summary.assignedBlocks += 1;
          usedSomeone = true;
        } else {
          remainingBlocks.push(block);
        }
      });
    } else {
      remainingBlocks.push(...blocks);
    }

    remainingBlocks.forEach(block => {
      const best = pickBestBlockCandidate_(
        absentName,
        block,
        coverageStaff,
        teacherSchedule,
        day,
        state,
        config
      );
      if (best) {
        planRows.push(makePlanRow_(
          date,
          day,
          block,
          best,
          'Split Coverage',
          'Assigned',
          best.reason
        ));
        recordAssignment_(state, best, block, absentName);
        summary.assignedBlocks += 1;
        usedSomeone = true;
      } else {
        planRows.push(makePlanRow_(
          date,
          day,
          block,
          null,
          'Split Coverage',
          'Unfilled',
          'No eligible coverage person found.'
        ));
        summary.unfilledBlocks += 1;
      }
    });

    if (usedSomeone) summary.splitAssignments += 1;
  });

  // ── Field trip fallback: regular Coverage Staff only after ordinary needs ──
  const fallbackAssigned = fillDeferredFieldTripNeeds_(
    tripPass.deferred,
    coverageStaff,
    teacherSchedule,
    day,
    state,
    config,
    date,
    planRows,
    summary
  );
  if (Object.keys(fallbackAssigned).length) {
    summary.splitAssignments += Object.keys(fallbackAssigned).length;
  }

  writePreview_(planRows);

  return {
    date: date,
    day: day,
    summary: summary,
    rows: planRows,
    absences: absences,
    fieldTrips: fieldTrips,
    activeCoverageStaff: coverageStaff.map(row => ({
      name: row.name,
      tier: row.tier,
      role: row.role,
      allDay: row.canCoverAllDay,
      activeToday: !!row.activeToday,
      fieldTripOnly: !!row.fieldTripOnly,
      fieldTripEvents: (row.fieldTripEvents || []).map(event => ({
        eventId: event.eventId,
        name: event.name
      }))
    }))
  };
}

function saveCoveragePlan(payload) {
  payload = payload || {};
  const rows = payload.rows || getLatestPreview_().rows || [];
  if (!rows.length) {
    throw new Error('No preview rows available to save.');
  }

  const date = rows[0].Date || payload.date;
  const day = rows[0].Day || payload.day;
  const existing = readSheetObjects_('Coverage Output').filter(row => !(normalizeDateKey_(row.Date) === date && String(row.Day || '').trim() === String(day).trim()));
  clearSheetDataKeepingHeader_('Coverage Output');

  const finalRows = existing.concat(rows);
  if (finalRows.length) {
    writeObjectsToSheet_('Coverage Output', SHEET_SCHEMAS['Coverage Output'].headers, finalRows, false);
  }

  return {
    date: date,
    day: day,
    savedRows: rows.length
  };
}

function getLatestPreview_(date, day) {
  let rows = readSheetObjects_('_Preview');
  if (date) rows = rows.filter(r => normalizeDateKey_(r.Date) === date);
  if (day) rows = rows.filter(r => String(r.Day || '').trim() === String(day).trim());
  return {
    rows: rows,
    summary: {
      totalBlocks: rows.length,
      assignedBlocks: rows.filter(r => String(r.Status || '').trim() === 'Assigned').length,
      unfilledBlocks: rows.filter(r => String(r.Status || '').trim() !== 'Assigned').length
    }
  };
}

function writePreview_(rows) {
  clearSheetDataKeepingHeader_('_Preview');
  if (rows.length) {
    writeObjectsToSheet_('_Preview', SHEET_SCHEMAS['_Preview'].headers, rows, false);
  }
}

function buildCoverageNeedsByTeacher_(absences, teacherSchedule, day, fieldTrips) {
  const needs = {};
  const normalizedSchedule = teacherSchedule.map(row => normalizeTeacherScheduleRow_(row));
  const tripsById = {};
  (fieldTrips || []).forEach(trip => {
    if (trip && trip.eventId) tripsById[String(trip.eventId)] = trip;
  });

  function addNeed(name, row) {
    if (!needs[name]) needs[name] = [];
    const key = [row.startMinutes, row.endMinutes, row.className, row.assignmentType].join('|');
    const existing = needs[name].find(item =>
      [item.startMinutes, item.endMinutes, item.className, item.assignmentType].join('|') === key
    );
    if (existing) {
      if (row.fieldTripEventId && !existing.fieldTripEventId) {
        existing.fieldTripEventId = row.fieldTripEventId;
        existing.fieldTripName = row.fieldTripName;
        existing.fieldTripGrades = (row.fieldTripGrades || []).slice();
      }
      return;
    }
    needs[name].push(row);
  }

  (absences || []).forEach(absence => {
    const name = absence.staffName;
    if (!name) return;

    const trip = absence.fieldTripEventId
      ? tripsById[String(absence.fieldTripEventId)] || null
      : null;

    const relevantRows = normalizedSchedule.filter(row => {
      if (row.staffName !== name || row.day !== day || !row.needsCoverageIfAbsent) return false;

      // Any class whose students are away on a field trip is cancelled and
      // never becomes a coverage need, whether the teacher is on the trip or
      // absent for another reason.
      if (blockIsCancelledByFieldTrip_(row, fieldTrips)) return false;

      return true;
    });

    filterRowsByAbsenceType_(relevantRows, absence).forEach(row => {
      row.emergencyOverride = !!absence.emergency;

      if (trip) {
        row.fieldTripEventId = trip.eventId;
        row.fieldTripName = trip.name;
        row.fieldTripGrades = (trip.grades || []).slice();
      }

      addNeed(name, row);
    });
  });

  return needs;
}

function isEmergencyAbsence_(absence) {
  return String(absence.Notes || absence.notes || '').toLowerCase().indexOf('emergency') !== -1;
}

function filterRowsByAbsenceType_(rows, absence) {
  const type = String(absence.absenceType || 'Full Day').trim();
  if (type === 'Full Day') {
    return (rows || []).map(row => Object.assign({}, row));
  }

  const startMinutes = displayTimeToMinutes_(absence.startOverride);
  const endMinutes = displayTimeToMinutes_(absence.endOverride);
  if (startMinutes == null || endMinutes == null) {
    return (rows || []).map(row => Object.assign({}, row));
  }

  return (rows || [])
    .filter(row => row.startMinutes < endMinutes && row.endMinutes > startMinutes)
    .map(row => {
      const clipped = Object.assign({}, row);
      clipped.originalStartMinutes = row.startMinutes;
      clipped.originalEndMinutes = row.endMinutes;
      clipped.startMinutes = Math.max(row.startMinutes, startMinutes);
      clipped.endMinutes = Math.min(row.endMinutes, endMinutes);
      return clipped;
    })
    .filter(row => row.endMinutes > row.startMinutes);
}

function estimateDifficulty_(absentName, blocks, coverageStaff, teacherSchedule, day, config) {
  const fullDayCandidateCount = coverageStaff.filter(candidate => candidateCanCoverAllBlocks_(candidate, absentName, blocks, teacherSchedule, day, makeEmptyState_(), config)).length;
  return {
    fullDayCandidateCount: fullDayCandidateCount,
    blocks: blocks.length
  };
}

function pickBestWholeDayCandidate_(absentName, blocks, coverageStaff, teacherSchedule, day, state, config) {
  const candidates = coverageStaff
    .filter(candidate => candidateCanCoverAllBlocks_(candidate, absentName, blocks, teacherSchedule, day, state, config))
    .map(candidate => {
      const usesEmergencyPull = blocks.some(block =>
        candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day, state).emergencyPull
      );
      return {
        name: candidate.name,
        tier: candidate.tier,
        role: candidate.role,
        canCoverAllDay: candidate.canCoverAllDay,
        emergencyPull: usesEmergencyPull,
        score: scoreCandidateForWholeDay_(candidate, absentName, blocks, state) - (usesEmergencyPull ? 55 : 0),
        reason: usesEmergencyPull ? 'Emergency pull from 7th/8th.' : 'Best whole-day fit.'
      };
    })
    .sort((a, b) => b.score - a.score || a.tier - b.tier || a.name.localeCompare(b.name));

  return candidates[0] || null;
}


function pickPrimarySplitCandidate_(absentName, blocks, coverageStaff, teacherSchedule, day, state, config) {
  const eventIds = Array.from(new Set(blocks.map(block => block.fieldTripEventId).filter(Boolean)));
  let sourceCandidates = coverageStaff;

  if (eventIds.length === 1) {
    const eventPool = coverageStaff.filter(candidate => candidateHasFieldTripEvent_(candidate, eventIds[0]));
    const eventPoolCanCover = eventPool.some(candidate =>
      blocks.some(block => candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config))
    );
    if (eventPoolCanCover) sourceCandidates = eventPool;
  }

  let candidates = sourceCandidates
    .map(candidate => {
      const coverableBlocks = blocks.filter(block =>
        candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config)
      );

      if (!coverableBlocks.length) return null;

      const availabilities = coverableBlocks.map(block =>
        candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day, state)
      );
      const usesEmergencyPull = availabilities.some(info => info.emergencyPull);
      const bestFieldTrip = availabilities
        .filter(info => info.fieldTripPriority)
        .sort((a, b) => b.fieldTripPriority - a.fieldTripPriority)[0];

      let score = coverableBlocks.length * 100;
      score += tierBaseScore_(candidate.tier);
      if (candidate.canCoverAllDay) score += 30;
      if (usesEmergencyPull) score -= 55;
      if (bestFieldTrip) score += bestFieldTrip.fieldTripPriority * 250;
      score -= (state.blocksByCandidate[candidate.name] || 0) * 3;
      score -= Object.keys(state.teachersByCandidate[candidate.name] || {}).length * 10;

      const fieldTripReason = bestFieldTrip ? bestFieldTrip.fieldTripReason : '';
      return {
        name: candidate.name,
        tier: candidate.tier,
        role: candidate.role,
        canCoverAllDay: candidate.canCoverAllDay,
        activeToday: candidate.activeToday,
        allowedGrades: candidate.allowedGrades,
        allowedSubjects: candidate.allowedSubjects,
        allowedAssignmentTypes: candidate.allowedAssignmentTypes,
        maxBlocksPerDay: candidate.maxBlocksPerDay,
        maxTeachersPerDay: candidate.maxTeachersPerDay,
        canBeSplitAcrossTeachers: candidate.canBeSplitAcrossTeachers,
        selectedStart: candidate.selectedStart,
        selectedEnd: candidate.selectedEnd,
        notes: candidate.notes,
        fieldTripEvents: candidate.fieldTripEvents || [],
        fieldTripOnly: !!candidate.fieldTripOnly,
        fieldTripReason: fieldTripReason,
        emergencyPull: usesEmergencyPull,
        coverableCount: coverableBlocks.length,
        score: score,
        reason: (fieldTripReason ? fieldTripReason + '; ' : '') +
          (usesEmergencyPull ? 'Emergency pull from 7th/8th; ' : '') +
          'Primary split candidate for ' + coverableBlocks.length + '/' + blocks.length + ' blocks'
      };
    })
    .filter(Boolean);

  if (candidates.some(candidate => !candidate.emergencyPull)) {
    candidates = candidates.filter(candidate => !candidate.emergencyPull);
  }

  candidates = candidates.sort((a, b) =>
    b.coverableCount - a.coverableCount ||
    b.score - a.score ||
    a.tier - b.tier ||
    a.name.localeCompare(b.name)
  );

  return candidates[0] || null;
}

function pickBestBlockCandidate_(absentName, block, coverageStaff, teacherSchedule, day, state, config) {
  let eligible = coverageStaff
    .filter(candidate => candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config));

  if (block.fieldTripEventId) {
    const fieldTripPool = eligible.filter(candidate => candidateHasFieldTripEvent_(candidate, block.fieldTripEventId));
    if (fieldTripPool.length) eligible = fieldTripPool;
  }

  const candidates = eligible
    .map(candidate => {
      const availability = candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day, state);
      const scoredCandidate = Object.assign({}, candidate, {
        emergencyPull: availability.emergencyPull
      });
      const scoreInfo = scoreCandidateForBlock_(scoredCandidate, absentName, block, state);
      const fieldTripBoost = Number(availability.fieldTripPriority || 0) * 250;
      const runwayMinutes = Math.max(0, Number(availability.fieldTripRunwayMinutes || 0));
      const runwayBoost = Math.min(runwayMinutes, 60);
      const fieldTripReason = availability.fieldTripReason || '';
      const runwayReason = runwayMinutes > 0
        ? runwayMinutes + ' min of released trip-grade time continues after this block'
        : '';
      return {
        name: candidate.name,
        tier: candidate.tier,
        role: candidate.role,
        canCoverAllDay: candidate.canCoverAllDay,
        activeToday: candidate.activeToday,
        allowedGrades: candidate.allowedGrades,
        allowedSubjects: candidate.allowedSubjects,
        allowedAssignmentTypes: candidate.allowedAssignmentTypes,
        maxBlocksPerDay: candidate.maxBlocksPerDay,
        maxTeachersPerDay: candidate.maxTeachersPerDay,
        canBeSplitAcrossTeachers: candidate.canBeSplitAcrossTeachers,
        selectedStart: candidate.selectedStart,
        selectedEnd: candidate.selectedEnd,
        fieldTripEvents: candidate.fieldTripEvents || [],
        fieldTripOnly: !!candidate.fieldTripOnly,
        emergencyPull: availability.emergencyPull,
        fieldTripReason: fieldTripReason,
        fieldTripBreakMove: availability.fieldTripBreakMove || null,
        fieldTripRunwayMinutes: runwayMinutes,
        score: scoreInfo.score + fieldTripBoost + runwayBoost,
        reason:
          (fieldTripReason ? fieldTripReason + '; ' : '') +
          (runwayReason ? runwayReason + '; ' : '') +
          scoreInfo.reason
      };
    })
    .sort((a, b) => b.score - a.score || a.tier - b.tier || a.name.localeCompare(b.name));

  return candidates[0] || null;
}

function candidateCanCoverAllBlocks_(candidate, absentName, blocks, teacherSchedule, day, state, config) {
  if (!candidate || !candidate.name) return false;
  if (!candidate.activeToday) return false;
  if (!candidateCanTakeTeacher_(candidate, absentName, blocks.length, state, config)) return false;
  return blocks.every(block => candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config));
}

function candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config) {
  if (!candidate || !candidate.name) return false;
  if (!candidate.activeToday) return false;
  if (candidate.fieldTripOnly && !block.fieldTripEventId) return false;
  if (candidateIsAbsentForBlock_(candidate.name, block, state)) return false;
  if (candidateHasReservedBreakConflict_(candidate.name, block, state)) return false;
  if (!candidateCanTakeTeacher_(candidate, absentName, 1, state, config)) return false;
  if (!block.emergencyOverride) {
    if (!matchesAllowedValue_(candidate.allowedAssignmentTypes, block.assignmentType)) return false;
    if (!matchesAllowedValue_(candidate.allowedSubjects, block.subject)) return false;
    if (!matchesAllowedGrade_(candidate.allowedGrades, block.grade)) return false;
  }
  if (!candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day, state).available) return false;
  if (candidateHasTimeConflict_(candidate.name, block, state)) return false;
  if ((state.blocksByCandidate[candidate.name] || 0) + 1 > candidate.maxBlocksPerDay) return false;
  return true;
}

function candidateCanTakeTeacher_(candidate, absentName, additionalBlocks, state, config) {
  const currentTeachers = state.teachersByCandidate[candidate.name] || {};
  const alreadyHasTeacher = !!currentTeachers[absentName];
  const distinctTeachers = Object.keys(currentTeachers).length + (alreadyHasTeacher ? 0 : 1);
  if (distinctTeachers > candidate.maxTeachersPerDay) return false;
  if (!candidate.canBeSplitAcrossTeachers && !alreadyHasTeacher && Object.keys(currentTeachers).length > 0) return false;
  if ((state.blocksByCandidate[candidate.name] || 0) + additionalBlocks > candidate.maxBlocksPerDay) return false;
  return true;
}

function candidateHasAvailabilityForBlock_(candidate, block, teacherSchedule, day, state) {
  return candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day, state).available;
}

function candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day, state) {
  if (!candidateAvailabilityWindowAllowsBlock_(candidate, block)) {
    return { available: false, emergencyPull: false, fieldTripPriority: 0, fieldTripReason: '', fieldTripBreakMove: null, fieldTripRunwayMinutes: 0 };
  }

  const availabilityRows = teacherSchedule
    .map(row => normalizeTeacherScheduleRow_(row))
    .filter(row => row.staffName === candidate.name && row.day === day);

  const fieldTripAvailability = candidateFieldTripAvailability_(candidate, block, availabilityRows, state);
  if (fieldTripAvailability.available) {
    return {
      available: true,
      emergencyPull: false,
      fieldTripPriority: fieldTripAvailability.fieldTripPriority,
      fieldTripReason: fieldTripAvailability.fieldTripReason,
      fieldTripBreakMove: fieldTripAvailability.fieldTripBreakMove || null,
      fieldTripRunwayMinutes: Number(fieldTripAvailability.fieldTripRunwayMinutes || 0)
    };
  }

  if (candidate.fieldTripOnly) {
    return {
      available: false,
      emergencyPull: false,
      fieldTripPriority: 0,
      fieldTripReason: fieldTripAvailability.fieldTripReason || '',
      fieldTripBreakMove: null,
      fieldTripRunwayMinutes: 0
    };
  }

  if (candidate.canCoverAllDay) {
    return { available: true, emergencyPull: false, fieldTripPriority: 0, fieldTripReason: '', fieldTripBreakMove: null, fieldTripRunwayMinutes: 0 };
  }

  if (availabilityRows.some(row =>
    row.coverEligibleThisBlock &&
    row.startMinutes <= block.startMinutes &&
    row.endMinutes >= block.endMinutes &&
    (
      !assignmentTypeIsBreak_(row) ||
      !block.fieldTripEventId ||
      !candidateHasFieldTripEvent_(candidate, block.fieldTripEventId)
    )
  )) {
    return { available: true, emergencyPull: false, fieldTripPriority: 0, fieldTripReason: '', fieldTripBreakMove: null, fieldTripRunwayMinutes: 0 };
  }

  if (!block.emergencyOverride || Number(candidate.tier) !== 3) {
    return { available: false, emergencyPull: false, fieldTripPriority: 0, fieldTripReason: '', fieldTripBreakMove: null, fieldTripRunwayMinutes: 0 };
  }

  const emergencyRow = availabilityRows.find(row =>
    isSeventhOrEighthGradeBlock_(row) &&
    row.startMinutes < block.endMinutes &&
    row.endMinutes > block.startMinutes
  );

  return {
    available: !!emergencyRow,
    emergencyPull: !!emergencyRow,
    fieldTripPriority: 0,
    fieldTripReason: '',
    fieldTripBreakMove: null,
    fieldTripRunwayMinutes: 0
  };
}

function candidateHasTimeConflict_(candidateName, block, state) {
  const assignments = state.assignmentsByCandidate[candidateName] || [];
  return assignments.some(existing => timesOverlap_(existing.startMinutes, existing.endMinutes, block.startMinutes, block.endMinutes));
}

function scoreCandidateForWholeDay_(candidate, absentName, blocks, state) {
  let score = tierBaseScore_(candidate.tier) + 100;
  if (candidate.canCoverAllDay) score += 30;
  score -= (state.blocksByCandidate[candidate.name] || 0) * 3;
  score -= Object.keys(state.teachersByCandidate[candidate.name] || {}).length * 8;
  return score;
}

function scoreCandidateForBlock_(candidate, absentName, block, state) {
  let score = tierBaseScore_(candidate.tier);
  const reasons = ['Tier ' + candidate.tier];
  if (candidate.emergencyPull) {
    score -= 55;
    reasons.push('emergency pull from 7th/8th');
  }
  if (candidate.canCoverAllDay) {
    score += 20;
    reasons.push('all-day available');
  }

  const teacherAssignments = state.teachersByCandidate[candidate.name] || {};
  const blocksByCandidate = state.assignmentsByCandidate[candidate.name] || [];
  const sameEventAssignments = block.fieldTripEventId
    ? blocksByCandidate.filter(existing => existing.fieldTripEventId === block.fieldTripEventId)
    : [];

  if (block.fieldTripEventId && sameEventAssignments.length) {
    score += 55;
    reasons.push('already helping this field trip');
  }

  if (teacherAssignments[absentName]) {
    score += block.fieldTripEventId ? 35 : 80;
    reasons.push('already covering same teacher');
  }

  const adjacentSameEvent = block.fieldTripEventId && sameEventAssignments.some(existing =>
    existing.endMinutes === block.startMinutes ||
    existing.startMinutes === block.endMinutes
  );
  const adjacentSameTeacher = blocksByCandidate.some(existing =>
    existing.absentName === absentName &&
    (existing.endMinutes === block.startMinutes || existing.startMinutes === block.endMinutes)
  );

  if (adjacentSameEvent) {
    score += 120;
    reasons.push('keeps field-trip coverage continuous');
  } else if (adjacentSameTeacher) {
    score += 30;
    reasons.push('keeps continuity');
  }

  if (!teacherAssignments[absentName] && Object.keys(teacherAssignments).length > 0) {
    if (!(block.fieldTripEventId && sameEventAssignments.length)) {
      score -= 40;
      reasons.push('new teacher handoff');
    }
  }

  if (!matchesAllowedValue_(candidate.allowedSubjects, block.subject)) {
    score -= 30;
  } else if (candidate.allowedSubjects !== '*') {
    score += 8;
    reasons.push('subject fit');
  }

  if (!matchesAllowedGrade_(candidate.allowedGrades, block.grade)) {
    score -= 30;
  } else if (candidate.allowedGrades !== '*') {
    score += 6;
    reasons.push('grade fit');
  }

  score -= (state.blocksByCandidate[candidate.name] || 0) * 4;
  score -= Object.keys(teacherAssignments).length * 8;

  return {
    score: score,
    reason: reasons.join(', ')
  };
}

function tierBaseScore_(tier) {
  if (Number(tier) === 1) return 100;
  if (Number(tier) === 2) return 60;
  return 20;
}

function isSeventhOrEighthGradeBlock_(row) {
  const grade = extractGradeNumber_(row.grade || row.className);
  if (grade !== 7 && grade !== 8) return false;
  const type = String(row.assignmentType || '').trim().toLowerCase();
  return type === 'class' || type === 'homeroom' || type === '';
}

function recordAssignment_(state, candidate, block, absentName) {
  if (!state.assignmentsByCandidate[candidate.name]) state.assignmentsByCandidate[candidate.name] = [];
  state.assignmentsByCandidate[candidate.name].push({
    absentName: absentName,
    startMinutes: block.startMinutes,
    endMinutes: block.endMinutes,
    fieldTripEventId: block.fieldTripEventId || ''
  });

  if (candidate.fieldTripBreakMove) {
    if (!state.breakReservationsByCandidate[candidate.name]) {
      state.breakReservationsByCandidate[candidate.name] = [];
    }
    const move = candidate.fieldTripBreakMove;
    const duplicate = state.breakReservationsByCandidate[candidate.name].some(existing =>
      existing.eventId === move.eventId &&
      existing.startMinutes === move.replacementStartMinutes &&
      existing.endMinutes === move.replacementEndMinutes
    );
    if (!duplicate) {
      state.breakReservationsByCandidate[candidate.name].push({
        eventId: move.eventId,
        startMinutes: move.replacementStartMinutes,
        endMinutes: move.replacementEndMinutes,
        originalBreakStartMinutes: move.originalBreakStartMinutes,
        originalBreakEndMinutes: move.originalBreakEndMinutes,
        reason: move.reason
      });
    }
  }

  state.blocksByCandidate[candidate.name] = (state.blocksByCandidate[candidate.name] || 0) + 1;
  if (!state.teachersByCandidate[candidate.name]) state.teachersByCandidate[candidate.name] = {};
  state.teachersByCandidate[candidate.name][absentName] = true;
}

function makeEmptyState_() {
  return {
    assignmentsByCandidate: {},
    blocksByCandidate: {},
    teachersByCandidate: {},
    absencesByCandidate: {},
    breakReservationsByCandidate: {}
  };
}

function buildAbsenceWindowsByStaff_(absences) {
  const map = {};

  (absences || []).forEach(absence => {
    const name = String(absence.staffName || '').trim();
    if (!name) return;
    if (!map[name]) map[name] = [];

    const type = String(absence.absenceType || 'Full Day').trim();
    if (type === 'Full Day') {
      map[name].push({
        allDay: true,
        startMinutes: null,
        endMinutes: null,
        source: String(absence.fieldTripEventId || absence.notes || 'Absence')
      });
      return;
    }

    map[name].push({
      allDay: false,
      startMinutes: displayTimeToMinutes_(absence.startOverride),
      endMinutes: displayTimeToMinutes_(absence.endOverride),
      source: String(absence.fieldTripEventId || absence.notes || 'Absence')
    });
  });

  return map;
}

function absenceWindowsForCandidate_(candidateName, state) {
  const raw = state && state.absencesByCandidate
    ? state.absencesByCandidate[String(candidateName || '').trim()]
    : null;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function candidateIsAbsentForBlock_(candidateName, block, state) {
  const windows = absenceWindowsForCandidate_(candidateName, state);
  if (!windows.length) return false;

  return windows.some(absence => {
    if (absence.allDay) return true;

    // If a partial absence is malformed, fail closed rather than scheduling
    // an absent person as coverage.
    if (absence.startMinutes == null || absence.endMinutes == null) return true;

    return timesOverlap_(
      absence.startMinutes,
      absence.endMinutes,
      block.startMinutes,
      block.endMinutes
    );
  });
}

function makePlanRow_(date, day, block, candidate, coverageMode, status, notes) {
  return {
    Date: date,
    Day: day,
    Event_ID: block.fieldTripEventId || '',
    Start: minutesToDisplay_(block.startMinutes),
    End: minutesToDisplay_(block.endMinutes),
    Absent_Staff: block.staffName,
    Class: block.className,
    Grade: block.grade,
    Subject: block.subject,
    Assignment_Type: block.assignmentType,
    Room: block.room,
    Assigned_Coverage: candidate ? candidate.name : '',
    Coverage_Mode: coverageMode,
    Coverage_Tier_Used: candidate ? String(candidate.tier || '') : '',
    Status: status,
    Notes: notes || ''
  };
}

function normalizeScheduleTerm_(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const compact = raw.toLowerCase().replace(/[.\s_-]+/g, '');

  // Full-year rows are active in both semesters. Normalize them to blank so
  // date-based semester filtering preserves them alongside the active term.
  if (
    compact === 'allyear' ||
    compact === 'fullyear' ||
    compact === 'yearlong' ||
    compact === 'annual'
  ) return '';

  if (compact === 's1' || compact === 'semester1' || compact === 'term1' || compact === 'firstsemester') return 'S1';
  if (compact === 's2' || compact === 'semester2' || compact === 'term2' || compact === 'secondsemester') return 'S2';
  return raw;
}

function activeScheduleTermForDate_(date, config) {
  const override = normalizeScheduleTerm_(
    config && (config.Schedule_Term_Override || config.Active_Term || config.Schedule_Term)
  );
  if (override) return override;

  const key = normalizeDateKey_(date);
  const parsed = key ? new Date(key + 'T12:00:00') : null;
  if (!parsed || isNaN(parsed)) return '';

  // Coverage Scheduler follows the school's academic-year pattern:
  // S1 is the fall semester; S2 is the spring semester.
  return parsed.getMonth() >= 6 ? 'S1' : 'S2';
}

function filterTeacherScheduleForDate_(rows, date, config) {
  const source = rows || [];
  const termsPresent = new Set(
    source.map(row => normalizeScheduleTerm_(row.Term)).filter(Boolean)
  );

  // Preserve backward compatibility for schedules with no semester column or
  // schedules using unrelated custom term labels.
  if (!termsPresent.has('S1') && !termsPresent.has('S2')) return source.slice();

  const activeTerm = activeScheduleTermForDate_(date, config);
  if (!activeTerm) return source.slice();

  return source.filter(row => {
    const term = normalizeScheduleTerm_(row.Term);
    return !term || term === activeTerm;
  });
}

function normalizeTeacherScheduleRow_(row) {
  const subject = String(row.Subject || '').trim();
  const rawClassName = String(row.Class || '').trim();
  const assignmentType = String(row.Assignment_Type || '').trim() || inferAssignmentType_(row);
  const className = buildClassDisplayName_(rawClassName, subject, assignmentType);

  const explicitNeeds = String(row.Needs_Coverage_If_Absent || '').trim();
  const explicitCover = String(row.Cover_Eligible_This_Block || '').trim();

  return {
    staffName: String(row.Staff_Name || '').trim(),
    role: String(row.Role || '').trim(),
    term: normalizeScheduleTerm_(row.Term),
    day: String(row.Day || '').trim(),
    startMinutes: timeToMinutes_(row.Start),
    endMinutes: timeToMinutes_(row.End),
    className: className,
    grade: String(row.Grade || '').trim() || inferGradeFromClass_(rawClassName || className),
    subject: subject,
    assignmentType: assignmentType,
    room: String(row.Room || '').trim(),
    needsCoverageIfAbsent: explicitNeeds !== ''
      ? normalizeYesNo_(explicitNeeds, false)
      : inferNeedsCoverageIfAbsent_(assignmentType, subject),
    coverEligibleThisBlock: explicitCover !== ''
      ? normalizeYesNo_(explicitCover, false)
      : inferCoverEligibleThisBlock_(assignmentType, subject)
  };
}

function buildClassDisplayName_(className, subject, assignmentType) {
  const rawClass = String(className || '').trim();
  const rawSubject = String(subject || '').trim();
  const type = String(assignmentType || '').trim();

  // Keep non-teaching blocks readable without pretending they are classes.
  if (!rawClass && !rawSubject) return type;
  if (!rawClass) return rawSubject;
  if (!rawSubject) return rawClass;

  const classLower = rawClass.toLowerCase();
  const subjectLower = rawSubject.toLowerCase();
  if (classLower === subjectLower || classLower.indexOf(subjectLower) !== -1 || subjectLower.indexOf(classLower) !== -1) {
    return rawClass;
  }
  return rawClass + ' — ' + rawSubject;
}

function inferGradeFromClass_(className) {
  const raw = String(className || '').trim();
  if (!raw) return '';
  const normalized = normalizeGradeKey_(raw);
  if (normalized !== raw) return normalized;

  const lower = raw.toLowerCase();
  if (lower.indexOf('beginner') !== -1) return 'Beg';
  if (lower.indexOf('pre-k') !== -1 || lower.indexOf('prek') !== -1 || lower.indexOf('prekind') !== -1) return 'PreK';
  if (lower.indexOf('kindergarten') !== -1) return 'K';

  const match = raw.match(/\d+/);
  return match ? String(Number(match[0])) : '';
}

function inferNeedsCoverageIfAbsent_(assignmentType, subject) {
  const type = String(assignmentType || '').trim().toLowerCase();
  const s = String(subject || '').trim().toLowerCase();

  if (type === 'break' || type === 'lunch' || type === 'planning') return false;
  if (type === 'class' || type === 'homeroom' || type === 'duty') return true;
  if (s.indexOf('break') !== -1 || s.indexOf('lunch') !== -1 || s.indexOf('plan') !== -1) return false;
  return true;
}

function inferCoverEligibleThisBlock_(assignmentType, subject) {
  const type = String(assignmentType || '').trim().toLowerCase();
  const s = String(subject || '').trim().toLowerCase();

  if (type === 'class' || type === 'homeroom' || type === 'duty') return false;
  if (type === 'planning' || type === 'break') return true;
  if (s.indexOf('plan') !== -1 || s.indexOf('break') !== -1) return true;
  if (s.indexOf('lunch') !== -1) return false;
  return false;
}

function normalizeCoverageStaffRow_(row, config) {
  const rawMaxBlocks = String(row.Max_Blocks_Per_Day || '').trim();
  const rawMaxTeachers = String(row.Max_Teachers_Per_Day || '').trim();

  return {
    name: String(row.Name || '').trim(),
    role: String(row.Role || '').trim(),
    tier: Number(row.Coverage_Tier || 3),
    canCoverAllDay: normalizeYesNo_(row.Can_Cover_All_Day, false),
    baseActive: normalizeYesNo_(row.Active_Today, true),
    activeToday: normalizeYesNo_(row.Active_Today, true),
    availableDays: normalizeAvailableDays_(row.Available_Days),
    defaultStart: timeToDisplay_(row.Default_Start),
    defaultEnd: timeToDisplay_(row.Default_End),
    selectedStart: timeToDisplay_(row.Default_Start),
    selectedEnd: timeToDisplay_(row.Default_End),
    hasDateOverride: false,
    availabilityNotes: '',
    allowedGrades: normalizeAllowedField_(row.Allowed_Grades),
    allowedSubjects: normalizeAllowedField_(row.Allowed_Subjects),
    allowedAssignmentTypes: normalizeAllowedField_(row.Allowed_Assignment_Types),
    maxBlocksPerDay: rawMaxBlocks === '' ? Infinity : Number(rawMaxBlocks),
    maxTeachersPerDay: rawMaxTeachers === '' ? Infinity : Number(rawMaxTeachers),
    canBeSplitAcrossTeachers: normalizeYesNo_(row.Can_Be_Split_Across_Teachers, true),
    notes: String(row.Notes || '').trim()
  };
}


function getFieldTripCoverageStaffForDate_(date, day) {
  const fieldTrips = getFieldTripsForDate_(date);
  if (!fieldTrips.length) return [];

  const config = getConfigMap_();
  const teacherSchedule = filterTeacherScheduleForDate_(
    readSheetObjects_('Teacher Schedule'),
    date,
    config
  );
  const configuredCoverageStaff = getCoverageStaffForDate_(date, day, config);
  const activeCoverageStaff = configuredCoverageStaff.filter(row => row.name && row.activeToday);
  return buildFieldTripCoverageCandidates_(
    fieldTrips,
    teacherSchedule,
    day,
    activeCoverageStaff,
    configuredCoverageStaff
  )
    .filter(candidate => (candidate.fieldTripEvents || []).length)
    .map(candidate => ({
      name: candidate.name,
      role: candidate.role,
      tier: candidate.tier,
      activeToday: candidate.activeToday,
      fieldTripOnly: !!candidate.fieldTripOnly,
      fieldTripEvents: (candidate.fieldTripEvents || []).map(event => ({
        eventId: event.eventId,
        name: event.name
      }))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getCoverageStaffForDate_(date, day, config) {
  const rows = readSheetObjects_(getCoverageStaffSheetName_())
    .map(row => normalizeCoverageStaffRow_(row, config));
  return applySubstituteAvailabilityOverrides_(rows, date, day);
}

function applySubstituteAvailabilityOverrides_(coverageStaff, date, day) {
  const dateKey = normalizeDateKey_(date);
  const dayCode = String(day || guessDayCodeFromDate_(dateKey) || '').trim();
  const overrides = getSubstituteAvailabilityMap_(dateKey, dayCode);

  return coverageStaff.map(candidate => {
    const dayAllowed = isAvailableOnDay_(candidate.availableDays, dayCode);
    let active = !!candidate.baseActive && dayAllowed;
    let selectedStart = candidate.defaultStart || '';
    let selectedEnd = candidate.defaultEnd || '';
    let availabilityNotes = '';
    let hasDateOverride = false;

    const override = overrides[candidate.name];
    if (override) {
      hasDateOverride = true;
      active = normalizeYesNo_(override.Available, active);
      selectedStart = timeToDisplay_(override.Start) || selectedStart;
      selectedEnd = timeToDisplay_(override.End) || selectedEnd;
      availabilityNotes = String(override.Notes || '').trim();
    }

    return Object.assign({}, candidate, {
      activeToday: active,
      selectedStart: selectedStart,
      selectedEnd: selectedEnd,
      hasDateOverride: hasDateOverride,
      availabilityNotes: availabilityNotes
    });
  });
}

function getSubstituteAvailabilityMap_(date, day) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Substitute Availability')) return {};
  const dateKey = normalizeDateKey_(date);
  const dayCode = String(day || '').trim();
  const map = {};
  readSheetObjects_('Substitute Availability')
    .filter(row => normalizeDateKey_(row.Date) === dateKey && (!dayCode || String(row.Day || '').trim() === dayCode))
    .forEach(row => {
      const name = String(row.Name || '').trim();
      if (name) map[name] = row;
    });
  return map;
}

function upsertSubstituteAvailability(payload) {
  payload = payload || {};
  const date = normalizeDateKey_(payload.date);
  const day = String(payload.day || guessDayCodeFromDate_(date) || '').trim();
  const name = String(payload.name || '').trim();
  if (!date) throw new Error('No date provided for substitute availability.');
  if (!day) throw new Error('No day code provided for substitute availability.');
  if (!name) throw new Error('No substitute name provided for availability.');
  const sheet = ensureSubstituteAvailabilitySheet_();
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(h => String(h || '').trim());
  const aliasMap = HEADER_ALIASES['Substitute Availability'];
  const dateCol = findColumnByAliases_(headers, aliasMap.Date);
  const nameCol = findColumnByAliases_(headers, aliasMap.Name);
  if (dateCol === -1 || nameCol === -1) throw new Error('Substitute Availability must include Date and Name columns.');
  const values = sheet.getDataRange().getValues();
  let targetRow = -1;
  for (let r = 1; r < values.length; r++) {
    const rowDate = normalizeDateKey_(values[r][dateCol]);
    const rowName = String(values[r][nameCol] || '').trim();
    if (rowDate === date && rowName === name) {
      targetRow = r + 1;
      break;
    }
  }
  const rowObject = {
    Date: date,
    Day: day,
    Name: name,
    Available: normalizeYesNo_(payload.available, true) ? 'Yes' : 'No',
    Start: timeToDisplay_(payload.start),
    End: timeToDisplay_(payload.end),
    Notes: String(payload.notes || '').trim()
  };
  if (targetRow === -1) targetRow = sheet.getLastRow() + 1;
  setSheetRowObject_(sheet, targetRow, headers, aliasMap, rowObject);
  return getAllCoverageStaff_(date, day);
}

function ensureSubstituteAvailabilitySheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Substitute Availability');
  if (!sheet) {
    sheet = ss.insertSheet('Substitute Availability');
    sheet.getRange(1, 1, 1, SHEET_SCHEMAS['Substitute Availability'].headers.length)
      .setValues([SHEET_SCHEMAS['Substitute Availability'].headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setSheetRowObject_(sheet, rowNumber, headers, aliasMap, rowObject) {
  Object.keys(rowObject).forEach(canonical => {
    const aliases = aliasMap[canonical] || [canonical];
    const col = findColumnByAliases_(headers, aliases);
    if (col !== -1) sheet.getRange(rowNumber, col + 1).setValue(rowObject[canonical]);
  });
}

function normalizeAvailableDays_(value) {
  const str = String(value || '').trim();
  if (!str || /^all$/i.test(str)) return '*';
  return str;
}

function isAvailableOnDay_(availableDays, day) {
  if (!availableDays || availableDays === '*') return true;
  const dayCode = normalizeDayToken_(day);
  if (!dayCode) return true;
  return String(availableDays || '')
    .split(/[;,/|\s]+/)
    .map(normalizeDayToken_)
    .filter(Boolean)
    .indexOf(dayCode) !== -1;
}

function normalizeDayToken_(value) {
  const str = String(value || '').trim().toUpperCase();
  if (!str) return '';
  if (str === 'MON' || str === 'MONDAY') return 'M';
  if (str === 'TUE' || str === 'TUES' || str === 'TUESDAY') return 'T';
  if (str === 'WED' || str === 'WEDNESDAY') return 'W';
  if (str === 'THU' || str === 'THUR' || str === 'THURS' || str === 'THURSDAY') return 'R';
  if (str === 'FRI' || str === 'FRIDAY') return 'F';
  return str.charAt(0);
}

function candidateAvailabilityWindowAllowsBlock_(candidate, block) {
  const start = timeToMinutes_(candidate.selectedStart);
  const end = timeToMinutes_(candidate.selectedEnd);
  if (start != null && block.startMinutes < start) return false;
  if (end != null && block.endMinutes > end) return false;
  return true;
}

function inferAssignmentType_(row) {
  const subject = String(row.Subject || '').toLowerCase();
  if (subject.indexOf('lunch') !== -1) return 'Lunch';
  if (subject.indexOf('break') !== -1) return 'Break';
  if (subject.indexOf('plan') !== -1) return 'Planning';
  if (subject.indexOf('duty') !== -1) return 'Duty';
  if (subject.indexOf('homeroom') !== -1) return 'Homeroom';
  return 'Class';
}

function normalizeAllowedField_(value) {
  const str = String(value || '').trim();
  if (!str || /^all$/i.test(str)) return '*';
  return str;
}

function matchesAllowedValue_(allowedField, value) {
  if (allowedField === '*') return true;
  const target = normalizeMatchText_(value);
  if (!target) return true;
  return String(allowedField || '')
    .split(',')
    .map(v => normalizeMatchText_(v))
    .filter(Boolean)
    .some(token => matchTextContainsToken_(target, token) || matchTextContainsToken_(token, target));
}

function normalizeMatchText_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchTextContainsToken_(target, token) {
  if (!target || !token) return false;
  return target === token || (' ' + target + ' ').indexOf(' ' + token + ' ') !== -1;
}

function matchesAllowedGrade_(allowedField, gradeValue) {
  if (allowedField === '*') return true;
  const targetRaw = String(gradeValue || '').trim();
  if (!targetRaw) return true;
  const target = targetRaw.toLowerCase();
  const targetNumeric = extractGradeNumber_(targetRaw);

  return String(allowedField || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .some(token => {
      const lower = token.toLowerCase();
      if (lower === target) return true;
      if (lower.indexOf('-') !== -1) {
        const parts = lower.split('-').map(s => s.trim());
        const start = gradeToComparable_(parts[0]);
        const end = gradeToComparable_(parts[1]);
        const current = gradeToComparable_(targetRaw);
        return start != null && end != null && current != null && current >= start && current <= end;
      }
      if (targetNumeric != null) {
        const tokenNumeric = extractGradeNumber_(token);
        return tokenNumeric != null && tokenNumeric === targetNumeric;
      }
      return false;
    });
}

function extractGradeNumber_(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function gradeToComparable_(value) {
  const str = String(value || '').trim().toUpperCase();
  if (str === 'K') return 0;
  const num = extractGradeNumber_(str);
  return num != null ? num : null;
}

function readSheetObjects_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const aliasMap = HEADER_ALIASES[sheetName] || (sheetName === 'Substitutes' ? HEADER_ALIASES['Coverage Staff'] : {});

  return values.slice(1).map(row => {
    const out = {};
    Object.keys(aliasMap).forEach(canonical => {
      const aliases = aliasMap[canonical];
      let foundIndex = -1;
      aliases.some(alias => {
        foundIndex = headers.indexOf(alias);
        return foundIndex !== -1;
      });
      out[canonical] = foundIndex === -1 ? '' : row[foundIndex];
    });
    return out;
  }).filter(obj => Object.keys(obj).some(key => String(obj[key] || '').trim() !== ''));
}

function writeObjectsToSheet_(sheetName, headers, rows, append) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing sheet: ' + sheetName);

  // Existing managed sheets can gain new columns over time. setup.gs appends
  // a missing header rather than reordering old columns, so always write using
  // the sheet's actual header order. This keeps migrated workbooks aligned.
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const actualHeaders = sheet.getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(value => String(value || '').trim());

  while (actualHeaders.length && !actualHeaders[actualHeaders.length - 1]) {
    actualHeaders.pop();
  }

  const writeHeaders = actualHeaders.length ? actualHeaders : headers;
  const startRow = append ? sheet.getLastRow() + 1 : 2;
  const values = rows.map(row =>
    writeHeaders.map(header => row[header] != null ? row[header] : '')
  );

  if (!values.length) return;
  sheet.getRange(startRow, 1, values.length, writeHeaders.length).setValues(values);
}

function getConfigMap_() {
  const rows = readSheetObjects_('Config');
  const map = {};
  rows.forEach(row => {
    const key = String(row.Setting || row['Setting'] || '').trim();
    const value = row.Value != null ? row.Value : row['Value'];
    if (key) map[key] = value;
  });
  return map;
}

function normalizeYesNo_(value, defaultValue) {
  if (value === '' || value == null) return !!defaultValue;
  const str = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].indexOf(str) !== -1) return true;
  if (['no', 'n', 'false', '0'].indexOf(str) !== -1) return false;
  return !!defaultValue;
}

function normalizeDateKey_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed)) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return str;
}

function guessDayCodeFromDate_(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return ['U', 'M', 'T', 'W', 'R', 'F', 'S'][day] || '';
}

function timeToMinutes_(value) {
  if (value == null || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return value.getHours() * 60 + value.getMinutes();
  }
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridian = (match[3] || '').toUpperCase();
    if (meridian === 'PM' && hour < 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }
  return null;
}

function displayTimeToMinutes_(value) {
  return timeToMinutes_(value);
}

function timeToDisplay_(value) {
  if (value == null || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'h:mm a');
  }
  const mins = timeToMinutes_(value);
  return mins == null ? String(value) : minutesToDisplay_(mins);
}

function minutesToDisplay_(mins) {
  if (mins == null) return '';
  let hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const meridian = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return hours + ':' + Utilities.formatString('%02d', minutes) + ' ' + meridian;
}

function timesOverlap_(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}


function backfillTeacherScheduleDerivedFields() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teacher Schedule');
  if (!sheet) throw new Error('Missing Teacher Schedule sheet.');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = values[0].map(h => String(h || '').trim());
  const required = ['Grade', 'Assignment_Type', 'Needs_Coverage_If_Absent', 'Cover_Eligible_This_Block'];

  required.forEach(h => {
    if (headers.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      headers.push(h);
    }
  });

  const idx = {};
  headers.forEach((h, i) => idx[h] = i);

  const out = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    const normalized = normalizeTeacherScheduleRow_(obj);

    const newRow = new Array(headers.length).fill('');
    headers.forEach((h, i) => newRow[i] = row[i] || '');

    newRow[idx['Grade']] = normalized.grade;
    newRow[idx['Assignment_Type']] = normalized.assignmentType;
    newRow[idx['Needs_Coverage_If_Absent']] = normalized.needsCoverageIfAbsent ? 'Yes' : 'No';
    newRow[idx['Cover_Eligible_This_Block']] = normalized.coverEligibleThisBlock ? 'Yes' : 'No';

    return newRow;
  });

  sheet.getRange(2, 1, out.length, headers.length).setValues(out);
}


function createCoverageHandoutDocFromLatestPreview() {
  const preview = getLatestPreview_();
  const rows = (preview.rows || []).filter(r => String(r.Status || '').trim() === 'Assigned');

  if (!rows.length) {
    throw new Error('No assigned preview rows found to build handouts.');
  }

  const date = normalizeDateKey_(rows[0].Date) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const day = String(rows[0].Day || '').trim();

  return createCoverageHandoutDoc_(rows, date, day);
}

function createCoverageHandoutDocFromCoverageOutput(date, day) {
  let rows = readSheetObjects_('Coverage Output');

  if (date) rows = rows.filter(r => normalizeDateKey_(r.Date) === normalizeDateKey_(date));
  if (day) rows = rows.filter(r => String(r.Day || '').trim() === String(day).trim());

  rows = rows.filter(r => String(r.Status || '').trim() === 'Assigned');

  if (!rows.length) {
    throw new Error('No assigned rows found in Coverage Output for that selection.');
  }

  const finalDate = normalizeDateKey_(rows[0].Date) || normalizeDateKey_(date) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const finalDay = String(rows[0].Day || day || '').trim();

  return createCoverageHandoutDoc_(rows, finalDate, finalDay);
}

function formatHandoutDocPage_(body) {
  body.setPageWidth(792);
  body.setPageHeight(612);
  body.setMarginTop(24);
  body.setMarginBottom(24);
  body.setMarginLeft(24);
  body.setMarginRight(24);
}

function formatHandoutTimeRange_(startValue, endValue) {
  const start = timeToDisplay_(startValue);
  const end = timeToDisplay_(endValue);
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return start + '–' + end;
}

function styleHandoutTable_(table) {
  table.setColumnWidth(0, 108);
  table.setColumnWidth(1, 150);
  table.setColumnWidth(2, 180);
  table.setColumnWidth(3, 80);

  const headerRow = table.getRow(0);
  for (let c = 0; c < headerRow.getNumCells(); c++) {
    headerRow.getCell(c).editAsText().setBold(true);
  }
}

function createCoverageHandoutDoc_(rows, date, day) {
  const grouped = {};

  rows.forEach(row => {
    const person = String(row.Assigned_Coverage || '').trim() || 'UNASSIGNED';
    if (!grouped[person]) grouped[person] = [];
    grouped[person].push(row);
  });

  const names = Object.keys(grouped)
    .filter(name => name !== 'UNASSIGNED')
    .sort((a, b) => a.localeCompare(b));

  const doc = DocumentApp.create('Coverage Handouts - ' + date + (day ? ' - ' + day : ''));
  const body = doc.getBody();
  formatHandoutDocPage_(body);

  names.forEach((name, index) => {
    const personRows = grouped[name].slice().sort((a, b) => timeToMinutes_(a.Start) - timeToMinutes_(b.Start));

    body.appendParagraph(name)
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    body.appendParagraph('Coverage assignments for ' + date + (day ? ' (' + day + ')' : ''));

    const tableData = [['Time', 'Absent Teacher', 'Subject', 'Room']];

    personRows.forEach(r => {
      tableData.push([
        formatHandoutTimeRange_(r.Start, r.End),
        String(r.Absent_Staff || ''),
        String(r.Subject || ''),
        String(r.Room || '')
      ]);
    });

    const table = body.appendTable(tableData);
    styleHandoutTable_(table);

    if (index < names.length - 1) {
      body.appendPageBreak();
    }
  });

  const unfilled = rows.filter(r => !String(r.Assigned_Coverage || '').trim());
  if (unfilled.length) {
    if (names.length) body.appendPageBreak();

    body.appendParagraph('Unfilled Coverage')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    body.appendParagraph('Items still unfilled for ' + date + (day ? ' (' + day + ')' : ''));

    const tableData = [['Time', 'Absent Teacher', 'Subject', 'Room']];

    unfilled
      .sort((a, b) => timeToMinutes_(a.Start) - timeToMinutes_(b.Start))
      .forEach(r => {
        tableData.push([
          formatHandoutTimeRange_(r.Start, r.End),
          String(r.Absent_Staff || ''),
          String(r.Subject || ''),
          String(r.Room || '')
        ]);
      });

    const table = body.appendTable(tableData);
    styleHandoutTable_(table);
  }

  doc.saveAndClose();

  return {
    id: doc.getId(),
    url: doc.getUrl(),
    name: doc.getName()
  };
}
