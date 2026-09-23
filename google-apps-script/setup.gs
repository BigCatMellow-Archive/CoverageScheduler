const SHEET_SCHEMAS = {
  'Teacher Schedule': {
    headers: [
      'Staff_Name',
      'Role',
      'Day',
      'Start',
      'End',
      'Class',
      'Grade',
      'Subject',
      'Assignment_Type',
      'Room',
      'Needs_Coverage_If_Absent',
      'Cover_Eligible_This_Block'
    ]
  },
  'Coverage Staff': {
    headers: [
      'Name',
      'Role',
      'Coverage_Tier',
      'Can_Cover_All_Day',
      'Active_Today',
      'Available_Days',
      'Default_Start',
      'Default_End',
      'Allowed_Grades',
      'Allowed_Subjects',
      'Allowed_Assignment_Types',
      'Max_Blocks_Per_Day',
      'Max_Teachers_Per_Day',
      'Can_Be_Split_Across_Teachers',
      'Notes'
    ]
  },
  'Substitute Availability': {
    headers: [
      'Date',
      'Day',
      'Name',
      'Available',
      'Start',
      'End',
      'Notes'
    ]
  },
  'Daily Absences': {
    headers: [
      'Date',
      'Day',
      'Staff_Name',
      'Absence_Type',
      'Start_Override',
      'End_Override',
      'Notes',
      'Preferred_Coverage'
    ]
  },
  'Field Trips': {
    headers: [
      'Event_ID',
      'Name',
      'Date',
      'End_Date',
      'Start',
      'End',
      'Grades',
      'Staff',
      'Notes'
    ]
  },
  'Coverage Output': {
    headers: [
      'Date',
      'Day',
      'Event_ID',
      'Start',
      'End',
      'Absent_Staff',
      'Class',
      'Grade',
      'Subject',
      'Assignment_Type',
      'Room',
      'Assigned_Coverage',
      'Coverage_Mode',
      'Coverage_Tier_Used',
      'Status',
      'Notes'
    ]
  },
  'Lists': {
    headers: ['List_Name', 'Value', 'Sort_Order']
  },
  'Config': {
    headers: ['Setting', 'Value', 'Description']
  },
  '_Preview': {
    headers: [
      'Date',
      'Day',
      'Event_ID',
      'Start',
      'End',
      'Absent_Staff',
      'Class',
      'Grade',
      'Subject',
      'Assignment_Type',
      'Room',
      'Assigned_Coverage',
      'Coverage_Mode',
      'Coverage_Tier_Used',
      'Status',
      'Notes'
    ]
  }
};

const DEFAULT_LISTS = {
  Day: ['M', 'T', 'W', 'R', 'F'],
  YesNo: ['Yes', 'No'],
  AbsenceType: ['Full Day', 'Partial Day', 'Custom Range'],
  AssignmentType: ['Class', 'Homeroom', 'Duty', 'Break', 'Lunch', 'Planning', 'Meeting', 'Other'],
  CoverageTier: ['1', '2', '3'],
  Role: ['Teacher', 'Substitute', 'Specialist', 'Support', 'Administrator', 'Counselor', 'Other']
};

const DEFAULT_CONFIG = [
  ['Whole_Day_First', 'TRUE', 'Try to assign one coverage person to the entire absent day before splitting blocks.'],
  ['Allow_Split_Coverage', 'TRUE', 'Allow split coverage across multiple people when needed.'],
  ['Default_Max_Blocks_Per_Day', '8', 'Most blocks one Coverage Staff person covers per day when their own Max_Blocks_Per_Day is blank. Leave this blank for no limit.'],
  ['Default_Max_Teachers_Per_Day', '2', 'Most different absent teachers one Coverage Staff person covers per day when their own Max_Teachers_Per_Day is blank. Leave this blank for no limit.'],
  ['Use_Lunch_For_Coverage', 'FALSE', 'TRUE: people can be assigned during their lunch unless Cover_Eligible_This_Block says No. FALSE: lunch is protected unless a row is explicitly marked Cover_Eligible_This_Block = Yes.'],
  ['Availability_Override_Mode', 'DATE', 'DATE: Substitute Availability rows and the web app availability switches override Coverage Staff defaults for that date. OFF: ignore them and use Coverage Staff defaults only.'],
  ['Script_Time_Zone', Session.getScriptTimeZone(), 'Time zone for reading and showing dates and times, e.g. America/New_York. Keep it equal to the spreadsheet time zone (File > Settings). Unrecognized names are ignored.']
];

function setupCoverageWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const desiredOrder = ['Teacher Schedule', 'Coverage Staff', 'Substitute Availability', 'Daily Absences', 'Field Trips', 'Coverage Output', 'Lists', 'Config', '_Preview'];

  desiredOrder.forEach((name, index) => {
    const schema = SHEET_SCHEMAS[name];
    const sheet = ensureSheet_(ss, name, index + 1);
    ensureHeaderRow_(sheet, schema.headers);
    formatSheet_(sheet);
  });

  seedLists_();
  seedConfig_();
  applyDataValidation_();
  hideHelperSheets_();

  ss.toast('Coverage Scheduler workbook is ready.', APP_TITLE, 5);
}

function clearCoverageOutput() {
  clearSheetDataKeepingHeader_('Coverage Output');
  SpreadsheetApp.getActiveSpreadsheet().toast('Coverage Output cleared.', APP_TITLE, 5);
}

function ensureSheet_(ss, name, position) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, position - 1);
  }
  return sheet;
}

function ensureHeaderRow_(sheet, headers) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(v => String(v || '').trim());
  const existingSet = new Set(existing.filter(Boolean));
  const missing = headers.filter(h => !existingSet.has(h));

  const hasAnyHeader = existing.some(v => v !== '');
  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
}

function formatSheet_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, lastCol)
    .setFontWeight('bold')
    .setBackground('#d9eaf7')
    .setWrap(true);
  for (let col = 1; col <= lastCol; col++) {
    sheet.setColumnWidth(col, 145);
  }
  if (sheet.getName() === '_Preview' || sheet.getName() === 'Lists' || sheet.getName() === 'Config') {
    return;
  }
  sheet.setRowHeights(1, Math.max(sheet.getMaxRows(), 2), 24);
}

function hideHelperSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Lists', '_Preview'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && !sheet.isSheetHidden()) sheet.hideSheet();
  });
}

function seedLists_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lists');
  if (!sheet) return;

  const existingRows = Math.max(sheet.getLastRow() - 1, 0);
  const values = [];
  Object.keys(DEFAULT_LISTS).forEach(listName => {
    DEFAULT_LISTS[listName].forEach((value, index) => {
      values.push([listName, value, index + 1]);
    });
  });

  if (existingRows === 0) {
    sheet.getRange(2, 1, values.length, 3).setValues(values);
  }
}

function seedConfig_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet) return;

  const existing = Math.max(sheet.getLastRow() - 1, 0)
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String)
    : [];

  const rowsToAdd = DEFAULT_CONFIG.filter(row => existing.indexOf(row[0]) === -1);
  if (rowsToAdd.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 3).setValues(rowsToAdd);
  }

  // Keep descriptions of known settings current (values are never touched),
  // so the sheet explains what each setting actually does.
  existing.forEach((name, index) => {
    const known = DEFAULT_CONFIG.find(row => row[0] === String(name).trim());
    if (!known) return;
    const cell = sheet.getRange(index + 2, 3);
    if (String(cell.getValue() || '') !== known[2]) cell.setValue(known[2]);
  });
  COVERAGE_CONFIG_CACHE_ = null;
}

function applyDataValidation_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const listsSheet = ss.getSheetByName('Lists');
  if (!listsSheet) return;

  const listRanges = buildListRanges_(listsSheet);

  setValidationByHeader_('Teacher Schedule', 'Day', listRanges.Day);
  setValidationByHeader_('Teacher Schedule', 'Role', listRanges.Role);
  setValidationByHeader_('Teacher Schedule', 'Assignment_Type', listRanges.AssignmentType);
  setValidationByHeader_('Teacher Schedule', 'Needs_Coverage_If_Absent', listRanges.YesNo);
  setValidationByHeader_('Teacher Schedule', 'Cover_Eligible_This_Block', listRanges.YesNo);

  setValidationByHeader_('Coverage Staff', 'Role', listRanges.Role);
  setValidationByHeader_('Coverage Staff', 'Coverage_Tier', listRanges.CoverageTier);
  setValidationByHeader_('Coverage Staff', 'Can_Cover_All_Day', listRanges.YesNo);
  setValidationByHeader_('Coverage Staff', 'Active_Today', listRanges.YesNo);
  setValidationByHeader_('Coverage Staff', 'Can_Be_Split_Across_Teachers', listRanges.YesNo);

  setValidationByHeader_('Substitute Availability', 'Day', listRanges.Day);
  setValidationByHeader_('Substitute Availability', 'Available', listRanges.YesNo);

  setValidationByHeader_('Daily Absences', 'Day', listRanges.Day);
  setValidationByHeader_('Daily Absences', 'Absence_Type', listRanges.AbsenceType);
}

function buildListRanges_(listsSheet) {
  const data = listsSheet.getDataRange().getValues();
  const out = {};
  const groups = {};
  data.slice(1).forEach(row => {
    const listName = String(row[0] || '').trim();
    const value = String(row[1] || '').trim();
    if (!listName || !value) return;
    if (!groups[listName]) groups[listName] = [];
    groups[listName].push(value);
  });

  const listRows = data.slice(1);
  Object.keys(DEFAULT_LISTS).forEach(listName => {
    let startRow = -1;
    let endRow = -1;
    listRows.forEach((row, idx) => {
      if (String(row[0] || '').trim() === listName) {
        if (startRow === -1) startRow = idx + 2;
        endRow = idx + 2;
      }
    });
    if (startRow !== -1) {
      out[listName] = listsSheet.getRange(startRow, 2, endRow - startRow + 1, 1);
    }
  });
  return out;
}

function setValidationByHeader_(sheetName, headerName, listRange) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || !listRange) return;
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  const col = headers.indexOf(headerName) + 1;
  if (!col) return;
  const rule = SpreadsheetApp.newDataValidation().requireValueInRange(listRange, true).setAllowInvalid(true).build();
  sheet.getRange(2, col, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function clearSheetDataKeepingHeader_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}
