const APP_TITLE = 'Coverage Scheduler';
const COVERAGE_SPREADSHEET_ID = '1tLR_QPQyHD-w_FlAjb1HYtjxY6NLVy4E-WLmIln8AK8';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_TITLE)
    .addItem('Set up workbook', 'setupCoverageWorkbookFromTeacherSchedule')
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

function doGet() {
  activateCoverageSpreadsheetForWeb_();
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function activateCoverageSpreadsheetForWeb_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && active.getId() === COVERAGE_SPREADSHEET_ID) return active;
  const ss = SpreadsheetApp.openById(COVERAGE_SPREADSHEET_ID);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  return ss;
}

function ensureCoverageWorkbookForWeb_() {
  const ss = activateCoverageSpreadsheetForWeb_();
  const required = [
    'Teacher Schedule',
    'Coverage Staff',
    'Substitute Availability',
    'Daily Absences',
    'Coverage Output',
    'Lists',
    'Config',
    '_Preview'
  ];
  const missing = required.filter(name => !ss.getSheetByName(name));
  if (missing.length) {
    setupCoverageWorkbookFromTeacherSchedule();
  }
  return ss;
}

function webGetBootstrap(payload) {
  ensureCoverageWorkbookForWeb_();
  return getSidebarBootstrap(payload || {});
}

function webSaveAbsences(payload) {
  ensureCoverageWorkbookForWeb_();
  return replaceDailyAbsences(payload || {});
}

function webGenerateCoverage(payload) {
  ensureCoverageWorkbookForWeb_();
  return generateCoveragePreview(payload || {});
}

function webToggleCoverageStaff(payload) {
  ensureCoverageWorkbookForWeb_();
  return toggleCoverageStaffActive(payload || {});
}

function webSaveCoverage(rows) {
  ensureCoverageWorkbookForWeb_();
  return saveCoveragePlan({ rows: rows || [] });
}

function webCreateHandout() {
  ensureCoverageWorkbookForWeb_();
  const preview = getLatestPreview_();
  const first = preview.rows && preview.rows.length ? preview.rows[0] : null;
  return createCoverageHandoutDocFromCoverageOutput(
    first ? first.Date : '',
    first ? first.Day : ''
  );
}

function webValidateTeacherSchedule() {
  ensureCoverageWorkbookForWeb_();
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
