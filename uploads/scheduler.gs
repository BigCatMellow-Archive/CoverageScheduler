const HEADER_ALIASES = {
  'Teacher Schedule': {
    Staff_Name: ['Staff_Name', 'Teacher', 'Teacher_Name', 'Name'],
    Role: ['Role'],
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
  'Coverage Output': {
    Date: ['Date'],
    Day: ['Day'],
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

function getCoverageStaffSheetName_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Coverage Staff')) return 'Coverage Staff';
  if (ss.getSheetByName('Substitutes')) return 'Substitutes';
  throw new Error('Missing sheet: Coverage Staff (or Substitutes)');
}

function getAllSchedulableStaff_(dayCode) {
  const rows = readSheetObjects_('Teacher Schedule');
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

function generateCoveragePreview(payload) {
  payload = payload || {};
  const date = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const day = payload.day || guessDayCodeFromDate_(date);

  const config = getConfigMap_();
  const teacherSchedule = readSheetObjects_('Teacher Schedule');
  const coverageStaff = getCoverageStaffForDate_(date, day, config)
    .filter(row => row.name && row.activeToday);
  const absences = getDailyAbsencesForDate_(date, day);

  const needsByTeacher = buildCoverageNeedsByTeacher_(absences, teacherSchedule, day);

  const state = makeEmptyState_();
  const planRows = [];
  const summary = {
    totalAbsentStaff: 0,
    totalBlocks: 0,
    assignedBlocks: 0,
    unfilledBlocks: 0,
    wholeDayAssignments: 0,
    splitAssignments: 0
  };

  // ── Handle manual/preferred assignments first ──
  const manualNames = new Set();
  absences.filter(a => a.preferredCoverage).forEach(absence => {
    const absentName = absence.staffName;
    const preferred = absence.preferredCoverage;
    const blocks = needsByTeacher[absentName];
    if (!blocks || !blocks.length) return;

    const candidate = coverageStaff.find(c => c.name === preferred);
    const candidateInfo = candidate
      ? { name: candidate.name, tier: candidate.tier, role: candidate.role }
      : { name: preferred, tier: '', role: '' };

    blocks.forEach(block => {
      planRows.push(makePlanRow_(date, day, block, candidateInfo, 'Manual', 'Assigned', 'Manually assigned to ' + preferred + '.'));
      if (candidate) recordAssignment_(state, candidate, block, absentName);
    });

    summary.totalBlocks += blocks.length;
    summary.assignedBlocks += blocks.length;
    manualNames.add(absentName);
  });

  // ── Auto-assign remaining absences ──
  const orderedNeeds = Object.keys(needsByTeacher)
    .filter(name => !manualNames.has(name))
    .map(absentName => ({
      absentName: absentName,
      blocks: needsByTeacher[absentName],
      difficulty: estimateDifficulty_(absentName, needsByTeacher[absentName], coverageStaff, teacherSchedule, day, config)
    }))
    .sort((a, b) => a.difficulty.fullDayCandidateCount - b.difficulty.fullDayCandidateCount || b.blocks.length - a.blocks.length || a.absentName.localeCompare(b.absentName));

  summary.totalAbsentStaff = orderedNeeds.length + manualNames.size;

  orderedNeeds.forEach(item => {
    const absentName = item.absentName;
    const blocks = item.blocks.slice().sort((a, b) => a.startMinutes - b.startMinutes);
    summary.totalBlocks += blocks.length;
    if (!blocks.length) return;

    let assignedWholeDay = false;
    if (normalizeYesNo_(config.Whole_Day_First, true)) {
      const fullDayCandidate = pickBestWholeDayCandidate_(absentName, blocks, coverageStaff, teacherSchedule, day, state, config);
      if (fullDayCandidate) {
        blocks.forEach(block => {
          const planRow = makePlanRow_(date, day, block, fullDayCandidate, 'Whole Day', 'Assigned', fullDayCandidate.reason || 'Whole-day assignment.');
          planRows.push(planRow);
          recordAssignment_(state, fullDayCandidate, block, absentName);
        });
        assignedWholeDay = true;
        summary.assignedBlocks += blocks.length;
        summary.wholeDayAssignments += 1;
      }
    }

    if (!assignedWholeDay) {
      if (!normalizeYesNo_(config.Allow_Split_Coverage, true)) {
        blocks.forEach(block => {
          planRows.push(makePlanRow_(date, day, block, null, 'Unfilled', 'Unfilled', 'Split coverage disabled and no full-day match found.'));
          summary.unfilledBlocks += 1;
        });
        return;
      }

      let usedSomeone = false;
      const remainingBlocks = [];

      const primary = pickPrimarySplitCandidate_(absentName, blocks, coverageStaff, teacherSchedule, day, state, config);

      if (primary) {
        blocks.forEach(block => {
          if (candidateCanCoverBlock_(primary, absentName, block, teacherSchedule, day, state, config)) {
            planRows.push(
              makePlanRow_(date, day, block, primary, 'Split Coverage', 'Assigned', primary.reason)
            );
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
        const best = pickBestBlockCandidate_(absentName, block, coverageStaff, teacherSchedule, day, state, config);
        if (best) {
          planRows.push(
            makePlanRow_(date, day, block, best, 'Split Coverage', 'Assigned', best.reason)
          );
          recordAssignment_(state, best, block, absentName);
          summary.assignedBlocks += 1;
          usedSomeone = true;
        } else {
          planRows.push(
            makePlanRow_(date, day, block, null, 'Split Coverage', 'Unfilled', 'No eligible coverage person found.')
          );
          summary.unfilledBlocks += 1;
        }
      });

      if (usedSomeone) summary.splitAssignments += 1;
    }
  });

  writePreview_(planRows);

  return {
    date: date,
    day: day,
    summary: summary,
    rows: planRows,
    absences: absences,
    activeCoverageStaff: coverageStaff.map(row => ({ name: row.name, tier: row.tier, role: row.role, allDay: row.canCoverAllDay }))
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

function buildCoverageNeedsByTeacher_(absences, teacherSchedule, day) {
  const needs = {};
  absences.forEach(absence => {
    const name = absence.staffName;
    const relevantRows = teacherSchedule
      .map(row => normalizeTeacherScheduleRow_(row))
      .filter(row => row.staffName === name && row.day === day && row.needsCoverageIfAbsent);

    const filteredRows = filterRowsByAbsenceType_(relevantRows, absence);
    if (filteredRows.length) {
      needs[name] = filteredRows.map(row => {
        row.emergencyOverride = !!absence.emergency;
        return row;
      });
    }
  });
  return needs;
}

function isEmergencyAbsence_(absence) {
  return String(absence.Notes || absence.notes || '').toLowerCase().indexOf('emergency') !== -1;
}

function filterRowsByAbsenceType_(rows, absence) {
  const type = String(absence.absenceType || 'Full Day').trim();
  if (type === 'Full Day') return rows;
  const startMinutes = displayTimeToMinutes_(absence.startOverride);
  const endMinutes = displayTimeToMinutes_(absence.endOverride);
  if (startMinutes == null || endMinutes == null) return rows;
  return rows.filter(row => row.startMinutes < endMinutes && row.endMinutes > startMinutes);
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
        candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day).emergencyPull
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
  let candidates = coverageStaff
    .map(candidate => {
      const coverableBlocks = blocks.filter(block =>
        candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config)
      );

      if (!coverableBlocks.length) return null;

      const usesEmergencyPull = coverableBlocks.some(block =>
        candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day).emergencyPull
      );
      let score = coverableBlocks.length * 100;
      score += tierBaseScore_(candidate.tier);
      if (candidate.canCoverAllDay) score += 30;
      if (usesEmergencyPull) score -= 55;
      score -= (state.blocksByCandidate[candidate.name] || 0) * 3;
      score -= Object.keys(state.teachersByCandidate[candidate.name] || {}).length * 10;

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
        notes: candidate.notes,
        emergencyPull: usesEmergencyPull,
        coverableCount: coverableBlocks.length,
        score: score,
        reason: (usesEmergencyPull ? 'Emergency pull from 7th/8th; ' : '') + 'Primary split candidate for ' + coverableBlocks.length + '/' + blocks.length + ' blocks'
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
  const candidates = coverageStaff
    .filter(candidate => candidateCanCoverBlock_(candidate, absentName, block, teacherSchedule, day, state, config))
    .map(candidate => {
      const availability = candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day);
      const scoredCandidate = Object.assign({}, candidate, {
        emergencyPull: availability.emergencyPull
      });
      const scoreInfo = scoreCandidateForBlock_(scoredCandidate, absentName, block, state);
      return {
        name: candidate.name,
        tier: candidate.tier,
        role: candidate.role,
        canCoverAllDay: candidate.canCoverAllDay,
        emergencyPull: availability.emergencyPull,
        score: scoreInfo.score,
        reason: scoreInfo.reason
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
  if (!candidateCanTakeTeacher_(candidate, absentName, 1, state, config)) return false;
  if (!block.emergencyOverride) {
    if (!matchesAllowedValue_(candidate.allowedAssignmentTypes, block.assignmentType)) return false;
    if (!matchesAllowedValue_(candidate.allowedSubjects, block.subject)) return false;
    if (!matchesAllowedGrade_(candidate.allowedGrades, block.grade)) return false;
  }
  if (!candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day).available) return false;
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

function candidateHasAvailabilityForBlock_(candidate, block, teacherSchedule, day) {
  return candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day).available;
}

function candidateAvailabilityForBlock_(candidate, block, teacherSchedule, day) {
  if (!candidateAvailabilityWindowAllowsBlock_(candidate, block)) return { available: false, emergencyPull: false };
  if (candidate.canCoverAllDay) return { available: true, emergencyPull: false };
  const availabilityRows = teacherSchedule
    .map(row => normalizeTeacherScheduleRow_(row))
    .filter(row => row.staffName === candidate.name && row.day === day);

  if (availabilityRows.some(row => row.coverEligibleThisBlock && row.startMinutes <= block.startMinutes && row.endMinutes >= block.endMinutes)) {
    return { available: true, emergencyPull: false };
  }

  if (!block.emergencyOverride || Number(candidate.tier) !== 3) {
    return { available: false, emergencyPull: false };
  }

  const emergencyRow = availabilityRows.find(row =>
    isSeventhOrEighthGradeBlock_(row) &&
    row.startMinutes < block.endMinutes &&
    row.endMinutes > block.startMinutes
  );

  return {
    available: !!emergencyRow,
    emergencyPull: !!emergencyRow
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
  if (teacherAssignments[absentName]) {
    score += 80;
    reasons.push('already covering same teacher');
  }

  const blocksByCandidate = state.assignmentsByCandidate[candidate.name] || [];
  const adjacent = blocksByCandidate.some(existing => existing.absentName === absentName && (existing.endMinutes === block.startMinutes || existing.startMinutes === block.endMinutes));
  if (adjacent) {
    score += 30;
    reasons.push('keeps continuity');
  }

  if (!teacherAssignments[absentName] && Object.keys(teacherAssignments).length > 0) {
    score -= 40;
    reasons.push('new teacher handoff');
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
    endMinutes: block.endMinutes
  });
  state.blocksByCandidate[candidate.name] = (state.blocksByCandidate[candidate.name] || 0) + 1;
  if (!state.teachersByCandidate[candidate.name]) state.teachersByCandidate[candidate.name] = {};
  state.teachersByCandidate[candidate.name][absentName] = true;
}

function makeEmptyState_() {
  return {
    assignmentsByCandidate: {},
    blocksByCandidate: {},
    teachersByCandidate: {}
  };
}

function makePlanRow_(date, day, block, candidate, coverageMode, status, notes) {
  return {
    Date: date,
    Day: day,
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
  const match = String(className || '').match(/\d+/);
  return match ? match[0] : '';
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
  const startRow = append ? sheet.getLastRow() + 1 : 2;
  const values = rows.map(row => headers.map(header => row[header] != null ? row[header] : ''));
  if (!values.length) return;
  sheet.getRange(startRow, 1, values.length, headers.length).setValues(values);
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
