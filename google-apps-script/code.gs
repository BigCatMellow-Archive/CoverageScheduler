const APP_TITLE = 'Coverage Scheduler';
const COVERAGE_SPREADSHEET_PROPERTY = 'COVERAGE_SPREADSHEET_ID';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_TITLE)
    .addItem('Set up workbook', 'setupCoverageScheduler')
    .addItem('Validate teacher schedule', 'menuValidateTeacherScheduleSource')
    .addItem('Open coverage panel', 'openCoveragePanel')
    .addSeparator()
    .addItem('Generate preview for selected day', 'generateCoveragePreviewFromPrompt')
    .addItem('Create handout doc from latest preview', 'menuCreateHandoutDoc')
    .addItem('Clear Coverage Output', 'clearCoverageOutput')
    .addToUi();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupCoverageScheduler() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Open the Google Sheet that will hold Coverage Scheduler, then run setup again from Extensions → Apps Script.');
  }

  PropertiesService.getScriptProperties()
    .setProperty(COVERAGE_SPREADSHEET_PROPERTY, ss.getId());

  SpreadsheetApp.setActiveSpreadsheet(ss);
  return setupCoverageWorkbookFromTeacherSchedule();
}

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function activateCoverageSpreadsheetForWeb_() {
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty(COVERAGE_SPREADSHEET_PROPERTY);

  if (!spreadsheetId) {
    throw new Error(
      'Coverage Scheduler has not been connected to a workbook yet. Open the target Google Sheet, reload it, then choose Coverage Scheduler → Set up workbook before using the web app.'
    );
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  return ss;
}

function ensureCoverageWorkbookReadyForWeb_() {
  const ss = activateCoverageSpreadsheetForWeb_();
  const requiredSheets = [
    'Teacher Schedule',
    'Coverage Staff',
    'Substitute Availability',
    'Daily Absences',
    'Coverage Output',
    'Lists',
    'Config',
    '_Preview'
  ];

  const missing = requiredSheets.filter(name => !ss.getSheetByName(name));
  if (missing.length) {
    setupCoverageWorkbookFromTeacherSchedule();
  }
  return ss;
}

function webGetBootstrap(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  payload = payload || {};
  const today = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const dayCode = payload.day || guessDayCodeFromDate_(today);

  return {
    today: today,
    day: dayCode,
    allStaff: getWebStaffRoster_(dayCode),
    allCoverageStaff: getAllCoverageStaff_(today, dayCode),
    currentAbsences: getDailyAbsencesForDate_(today, dayCode),
    currentPreview: getLatestPreview_(today, dayCode),
    config: getConfigMap_()
  };
}

function webSaveAbsences(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  return replaceDailyAbsences(payload || {});
}

function webGenerateCoverage(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  return generateCoveragePreview(payload || {});
}

function webToggleCoverageStaff(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  return toggleCoverageStaffActive(payload || {});
}

function webSaveCoverageStaff(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  return saveCoverageStaffFromWeb_(payload || {});
}

function webDeleteCoverageStaff(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  return deleteCoverageStaffFromWeb_(payload || {});
}

function webSaveCoverage(rows) {
  ensureCoverageWorkbookReadyForWeb_();
  return saveCoveragePlan({ rows: rows || [] });
}

function webCreateHandout() {
  ensureCoverageWorkbookReadyForWeb_();
  return createCoverageHandoutDocFromLatestPreview();
}

function webValidateTeacherSchedule() {
  ensureCoverageWorkbookReadyForWeb_();
  return validateTeacherScheduleSource_();
}

function openCoveragePanel() {
  const html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle(APP_TITLE)
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

function generateCoveragePreviewFromPrompt() {
  const ui = SpreadsheetApp.getUi();
  const datePrompt = ui.prompt('Generate Coverage Preview', 'Enter date as YYYY-MM-DD', ui.ButtonSet.OK_CANCEL);
  if (datePrompt.getSelectedButton() !== ui.Button.OK) return;
  const dateStr = (datePrompt.getResponseText() || '').trim();
  if (!dateStr) return;

  const dayCode = guessDayCodeFromDate_(dateStr);
  if (!dayCode) {
    ui.alert('Could not derive a day code from that date. Use YYYY-MM-DD, such as 2026-04-27.');
    return;
  }

  const result = generateCoveragePreview({ date: dateStr, day: dayCode });
  ui.alert(
    'Preview complete',
    'Generated ' + result.summary.totalBlocks + ' block(s). Open the sidebar to review or save the plan.',
    ui.ButtonSet.OK
  );
}

function getSidebarBootstrap(payload) {
  payload = payload || {};
  const today = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const dayCode = payload.day || guessDayCodeFromDate_(today);

  return {
    today: today,
    day: dayCode,
    allStaff: getAllSchedulableStaff_(dayCode),
    allCoverageStaff: getAllCoverageStaff_(today, dayCode),
    currentAbsences: getDailyAbsencesForDate_(today, dayCode),
    currentPreview: getLatestPreview_(today, dayCode),
    config: getConfigMap_()
  };
}

function menuValidateTeacherScheduleSource() {
  const result = validateTeacherScheduleSource_();
  const warningText = result.warnings.length
    ? '\n\nWarnings:\n- ' + result.warnings.join('\n- ')
    : '\n\nNo structural issues found.';

  SpreadsheetApp.getUi().alert(
    'Teacher Schedule check',
    'Rows: ' + result.rowCount +
      '\nTeachers: ' + result.teacherCount +
      '\nTerms: ' + (result.terms.length ? result.terms.join(', ') : 'none') +
      warningText,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuCreateHandoutDoc() {
  const result = createCoverageHandoutDocFromLatestPreview();
  SpreadsheetApp.getUi().alert(
    'Handout doc created',
    result.name + '\n\n' + result.url,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
