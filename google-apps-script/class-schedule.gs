/**
 * Class Schedule support.
 *
 * Teacher Schedule says where each adult is. Class Schedule says where each
 * student group (section) is and who is with them:
 *
 *   Class | Term | Day | Start | End | Teacher | Subject | Room
 *
 * The scheduler uses it for one thing at runtime: when a Teacher Schedule row
 * has no Class (e.g. "(Art Thursdays)"), the section that teacher has at that
 * time tells us the grade, so a field trip for that grade correctly cancels
 * the row and releases the teacher. Everything else here is reporting:
 * "Validate teacher schedule" compares the two sheets and lists mismatches in
 * a Schedule Check sheet.
 *
 * Teacher cells may list several people ("Greene / Stephens"). Periods where a
 * section splits between teachers (math levels, electives, languages, PE) can
 * be marked "Split" in the Teacher cell; blank Lunch rows are expected.
 */

const CLASS_SCHEDULE_SHEET_NAMES_ = ['Class Schedule', 'Copy of Class Schedule'];
const CLASS_SCHEDULE_ALIASES_ = {
  Class: ['Class', 'Section', 'Homeroom', 'Class_Name', 'Class Name'],
  Term: ['Term', 'Semester', 'Schedule_Term', 'Schedule Term'],
  Day: ['Day'],
  Start: ['Start', 'Start_Time', 'Start Time'],
  End: ['End', 'End_Time', 'End Time'],
  Teacher: ['Teacher', 'Teachers', 'Staff', 'Staff_Name'],
  Subject: ['Subject', 'Course', 'Activity'],
  Room: ['Room']
};
const CLASS_SCHEDULE_SPLIT_PATTERN_ = /^(split|various|multiple|mixed)\b/i;
const SCHEDULE_CHECK_SHEET_ = 'Schedule Check';

// Built once per server call.
let CLASS_SCHEDULE_CACHE_ = null;

function classScheduleSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
  for (let i = 0; i < CLASS_SCHEDULE_SHEET_NAMES_.length; i++) {
    const sheet = ss.getSheetByName(CLASS_SCHEDULE_SHEET_NAMES_[i]);
    if (sheet) return sheet;
  }
  return null;
}

function splitTeacherList_(text) {
  const raw = String(text || '').trim();
  if (!raw || CLASS_SCHEDULE_SPLIT_PATTERN_.test(raw)) return [];
  return raw.split(/\s*(?:\/|&|;|\+|\band\b)\s*/i).map(part => part.trim()).filter(Boolean);
}

function readClassScheduleRows_() {
  const sheet = classScheduleSheet_();
  if (!sheet) return { sheetName: '', rows: [], error: '' };
  const sheetName = sheet.getName();
  if (sheet.getLastRow() < 2) return { sheetName: sheetName, rows: [], error: '' };

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const col = {};
  Object.keys(CLASS_SCHEDULE_ALIASES_).forEach(key => {
    col[key] = findColumnByAliases_(headers, CLASS_SCHEDULE_ALIASES_[key]);
  });
  if (col.Class === -1 || col.Day === -1 || col.Start === -1 || col.End === -1) {
    return { sheetName: sheetName, rows: [], error: sheetName + ' needs Class, Day, Start, and End columns.' };
  }

  const cell = (row, key) => (col[key] === -1 ? '' : row[col[key]]);
  const rows = [];
  values.slice(1).forEach((row, i) => {
    const section = String(cell(row, 'Class') || '').trim();
    if (!section) return;
    const teacherText = String(cell(row, 'Teacher') || '').trim();
    const subject = String(cell(row, 'Subject') || '').trim();
    rows.push({
      rowNumber: i + 2,
      section: section,
      grade: inferGradeFromClass_(section),
      term: normalizeScheduleTerm_(cell(row, 'Term')),
      day: String(cell(row, 'Day') || '').trim(),
      startMinutes: timeToMinutes_(cell(row, 'Start')),
      endMinutes: timeToMinutes_(cell(row, 'End')),
      teacherText: teacherText,
      teacherTokens: splitTeacherList_(teacherText),
      staffNames: [],
      subject: subject,
      room: String(cell(row, 'Room') == null ? '' : cell(row, 'Room')).trim(),
      isSplit: CLASS_SCHEDULE_SPLIT_PATTERN_.test(teacherText),
      isLunch: /lunch/i.test(subject)
    });
  });
  return { sheetName: sheetName, rows: rows, error: '' };
}

// ── Name matching ─────────────────────────────────────────────────────────
// The two sheets write names differently ("Linane,C." vs "Caroline Linane",
// "Boissiere Leslie" with no comma, "Mazloomdoost" alone). A token matches a
// Teacher Schedule name only when exactly one person fits; anything
// ambiguous (e.g. a bare "Cassis" when there is a Cassis, L. and a Cassis, N.)
// is reported, never guessed.

function nameKey_(value) {
  return String(value || '').toLowerCase().replace(/[^a-z]/g, '');
}

function nameReadings_(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  if (raw.indexOf(',') !== -1) {
    const parts = raw.split(',');
    return [{ last: nameKey_(parts[0]), initial: nameKey_(parts.slice(1).join(',')).charAt(0) }];
  }
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length === 1) return [{ last: nameKey_(words[0]), initial: '' }];
  // No comma: could be "First Last" or "Last First", so accept either.
  return [
    { last: nameKey_(words[words.length - 1]), initial: nameKey_(words[0]).charAt(0) },
    { last: nameKey_(words[0]), initial: nameKey_(words[words.length - 1]).charAt(0) }
  ];
}

function buildStaffNameResolver_(staffNames) {
  const exact = {};
  const byLast = {};
  (staffNames || []).forEach(name => {
    exact[nameKey_(name)] = name;
    nameReadings_(name).forEach(reading => {
      if (!reading.last) return;
      (byLast[reading.last] || (byLast[reading.last] = [])).push({ name: name, initial: reading.initial });
    });
  });

  return function resolve(token) {
    const key = nameKey_(token);
    if (!key) return { name: '', reason: 'unmatched', candidates: [] };
    if (exact[key]) return { name: exact[key] };
    const matches = {};
    nameReadings_(token).forEach(reading => {
      (byLast[reading.last] || []).forEach(entry => {
        if (reading.initial && entry.initial && reading.initial !== entry.initial) return;
        matches[entry.name] = true;
      });
    });
    const names = Object.keys(matches).sort();
    if (names.length === 1) return { name: names[0] };
    return { name: '', reason: names.length ? 'ambiguous' : 'unmatched', candidates: names };
  };
}

// ── Index ─────────────────────────────────────────────────────────────────

function classScheduleIndex_() {
  if (CLASS_SCHEDULE_CACHE_) return CLASS_SCHEDULE_CACHE_;
  const index = { sheetName: '', rows: [], byStaffDay: {}, unresolved: {}, error: '' };
  // Set before reading so a failure part-way can never cause a retry loop.
  CLASS_SCHEDULE_CACHE_ = index;
  try {
    const read = readClassScheduleRows_();
    index.sheetName = read.sheetName;
    index.rows = read.rows;
    index.error = read.error;
    if (!index.rows.length) return index;

    const staffNames = Array.from(new Set(
      readSheetObjects_('Teacher Schedule')
        .map(row => String(row.Staff_Name || '').trim())
        .filter(Boolean)
    ));
    const resolve = buildStaffNameResolver_(staffNames);

    index.rows.forEach(row => {
      row.teacherTokens.forEach(token => {
        const result = resolve(token);
        if (result.name) {
          if (row.staffNames.indexOf(result.name) !== -1) return;
          row.staffNames.push(result.name);
          const key = result.name + '\u0000' + row.day;
          (index.byStaffDay[key] || (index.byStaffDay[key] = [])).push(row);
          return;
        }
        const entry = index.unresolved[token] || (index.unresolved[token] = {
          token: token,
          reason: result.reason,
          candidates: result.candidates || [],
          count: 0,
          example: row
        });
        entry.count++;
      });
    });
  } catch (err) {
    index.rows = [];
    index.byStaffDay = {};
    index.error = 'Class Schedule could not be read: ' + err.message;
  }
  return index;
}

// The grade of the students a teacher has during a Teacher Schedule row,
// according to Class Schedule. Returns a grade only when every section the
// teacher has at that time is in the same grade; a mixed group has no single
// grade and stays uncancellable (covered, never silently dropped).
function classScheduleGradeFor_(row) {
  if (!row || !row.staffName || !row.day || row.startMinutes == null || row.endMinutes == null) return null;
  const candidates = classScheduleIndex_().byStaffDay[row.staffName + '\u0000' + row.day] || [];
  const hits = candidates.filter(c =>
    c.startMinutes != null &&
    c.endMinutes != null &&
    c.startMinutes < row.endMinutes &&
    c.endMinutes > row.startMinutes &&
    (!c.term || !row.term || c.term === row.term)
  );
  if (!hits.length) return null;
  const grades = Array.from(new Set(hits.map(c => normalizeGradeKey_(c.grade))));
  const sections = Array.from(new Set(hits.map(c => c.section))).sort();
  return {
    grade: grades.length === 1 && grades[0] ? grades[0] : '',
    sections: sections,
    mixed: grades.length > 1
  };
}

// ── Consistency check ─────────────────────────────────────────────────────

function classScheduleConsistency_(teacherRows) {
  const index = classScheduleIndex_();
  const findings = [];
  if (!index.sheetName) return { sheetName: '', error: index.error, findings: findings };

  const byStaffDay = {};
  const byDay = {};
  (teacherRows || []).forEach(row => {
    if (!row.staffName || row.startMinutes == null || row.endMinutes == null) return;
    const key = row.staffName + '\u0000' + row.day;
    (byStaffDay[key] || (byStaffDay[key] = [])).push(row);
    (byDay[row.day] || (byDay[row.day] = [])).push(row);
  });

  const termOk = (a, b) => !a || !b || a === b;
  const overlaps = (a, b) => a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes;
  const add = (severity, type, c, teacher, detail) => findings.push({
    severity: severity,
    type: type,
    section: c ? c.section : '',
    day: c ? c.day : '',
    start: c && c.startMinutes != null ? minutesToDisplay_(c.startMinutes) : '',
    end: c && c.endMinutes != null ? minutesToDisplay_(c.endMinutes) : '',
    subject: c ? c.subject : '',
    teacher: teacher || '',
    detail: detail,
    row: c ? c.rowNumber : ''
  });

  Object.keys(index.unresolved).forEach(token => {
    const u = index.unresolved[token];
    if (u.reason === 'ambiguous') {
      add('Fix', 'Ambiguous teacher name', u.example, token,
        'Could be ' + u.candidates.join(' or ') + '. Write it as it appears in Teacher Schedule (e.g. add the first initial). Used ' + u.count + ' time(s).');
    } else {
      add('Fix', 'Teacher not found', u.example, token,
        'Nobody with this name in Teacher Schedule. Check spelling/format, or add their schedule. Used ' + u.count + ' time(s).');
    }
  });

  index.rows.forEach(c => {
    if (c.startMinutes == null || c.endMinutes == null) return;

    c.staffNames.forEach(name => {
      const mine = (byStaffDay[name + '\u0000' + c.day] || []).filter(t => termOk(t.term, c.term) && overlaps(t, c));
      if (!mine.length) {
        add('Fix', 'Missing from Teacher Schedule', c, name,
          name + ' has no Teacher Schedule row at this time, so if they are absent ' + c.section + ' gets no coverage.');
      } else if (!mine.some(t => t.needsCoverageIfAbsent)) {
        add('Fix', 'Schedules disagree', c, name,
          'Teacher Schedule has ' + name + ' on ' + mine.map(t => t.className || t.assignmentType).join(', ') +
          ' (never covered), but Class Schedule has them with ' + c.section + '.');
      }
    });

    if (c.isLunch || c.teacherTokens.length || !c.grade) return;
    const gradeKey = normalizeGradeKey_(c.grade);
    const serving = (byDay[c.day] || []).filter(t =>
      t.needsCoverageIfAbsent && t.grade && normalizeGradeKey_(t.grade) === gradeKey &&
      termOk(t.term, c.term) && overlaps(t, c)
    );
    if (!serving.length) {
      add('Fix', 'Students with no teacher', c, c.teacherText,
        'No Teacher Schedule row has grade ' + c.grade + ' students at this time, so this period can never be covered.');
    } else if (!c.isSplit) {
      const names = Array.from(new Set(serving.map(t => t.staffName))).slice(0, 4);
      add('Info', 'Unmarked split period', c, '',
        'Grade ' + c.grade + ' is with ' + names.join(', ') + (serving.length > names.length ? ' and others' : '') +
        '. If students split between teachers here, put "Split" in the Teacher cell so real gaps stand out.');
    }
  });

  return { sheetName: index.sheetName, error: index.error, findings: findings };
}

function writeScheduleCheckSheet_(findings) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SCHEDULE_CHECK_SHEET_) || ss.insertSheet(SCHEDULE_CHECK_SHEET_);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  sheet.getRange(1, 1, lastRow, lastCol).clearContent();

  const header = ['Severity', 'Issue', 'Class', 'Day', 'Start', 'End', 'Subject', 'Teacher', 'Detail', 'Class Schedule Row'];
  const dayOrder = { M: 1, T: 2, W: 3, R: 4, F: 5 };
  const sorted = (findings || []).slice().sort((a, b) =>
    (a.severity === b.severity ? 0 : a.severity === 'Fix' ? -1 : 1) ||
    a.type.localeCompare(b.type) ||
    String(a.section).localeCompare(String(b.section)) ||
    (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9) ||
    (timeToMinutes_(a.start) || 0) - (timeToMinutes_(b.start) || 0)
  );
  const values = [header].concat(sorted.map(f => [f.severity, f.type, f.section, f.day, f.start, f.end, f.subject, f.teacher, f.detail, f.row]));
  if (values.length === 1) values.push(['', 'No issues found', '', '', '', '', '', '', 'Teacher Schedule and Class Schedule agree.', '']);
  sheet.getRange(1, 1, values.length, header.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
  return sheet;
}
