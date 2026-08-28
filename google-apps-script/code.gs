const APP_TITLE = 'Coverage Scheduler';
const COVERAGE_SPREADSHEET_PROPERTY = 'COVERAGE_SPREADSHEET_ID';

function onOpen() {
  // Because this project is spreadsheet-bound, simply opening/reloading the
  // workbook is enough to remember it for the standalone web app.
  rememberCoverageSpreadsheet_();

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

/**
 * Remembers the currently open bound spreadsheet for standalone web-app calls.
 * Safe to call repeatedly; it simply refreshes the stored spreadsheet id.
 */
function rememberCoverageSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;

  PropertiesService.getScriptProperties()
    .setProperty(COVERAGE_SPREADSHEET_PROPERTY, ss.getId());

  return ss;
}

/**
 * One-time setup entry point. Run this from the spreadsheet that should own the
 * scheduler. It remembers that spreadsheet for the standalone web app and then
 * creates/repairs the scheduler-managed tabs.
 */
function setupCoverageScheduler() {
  const ss = rememberCoverageSpreadsheet_();
  if (!ss) {
    throw new Error('Open the Google Sheet that will hold Coverage Scheduler, then run setup again from Extensions → Apps Script.');
  }

  SpreadsheetApp.setActiveSpreadsheet(ss);
  return setupCoverageWorkbookFromTeacherSchedule();
}

function doGet() {
  const output = HtmlService.createTemplateFromFile('index')
    .evaluate();

  // Append the small Handout-link enhancement to the already-evaluated output.
  // Do not rebuild a second HtmlOutput from getContent(); doing so can interfere
  // with the Apps Script client/server bridge used by google.script.run.
  output.append(getHandoutOpenLinkUi_());

  return output
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * The main index keeps its generic notification banner. This small injected
 * override makes the Handout action display the returned Google Doc URL as an
 * immediate Open Handout action, without changing the rest of the UI flow.
 */
function getHandoutOpenLinkUi_() {
  return [
    '<style>',
    '.notif .handout-open{display:inline-flex;align-items:center;margin-left:6px;padding:4px 8px;border-radius:6px;background:#166534;color:#fff;text-decoration:none;font-size:11px;font-weight:800;white-space:nowrap}',
    '.notif .handout-open:hover{background:#14532d}',
    '</style>',
    '<script>',
    'handout = async function(){',
    '  try{',
    "    const r=await gas('webCreateHandout',{});",
    "    const n=$('notif');",
    "    const name=(r&&r.name)?r.name:'Google Doc';",
    "    const url=(r&&r.url)?r.url:'';",
    "    n.className='notif ok';",
    "    n.innerHTML='✓ Handout created: '+esc(name)+(url?' <a class=\"handout-open\" href=\"'+esc(url)+'\" target=\"_blank\" rel=\"noopener noreferrer\">Open Handout ↗</a>':'')+'<button onclick=\"this.parentElement.classList.add(\\\'hidden\\\')\">×</button>';",
    "    n.classList.remove('hidden');",
    "    clearTimeout(flash.t);",
    '  }catch(e){fail(e)}',
    '};',
    '</script>'
  ].join('\n');
}

/**
 * Web-app executions do not have a user-visible spreadsheet selected. The
 * bound spreadsheet stores its id in Script Properties so every web request
 * can reopen the correct workbook without hard-coding a private id.
 */
function activateCoverageSpreadsheetForWeb_() {
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty(COVERAGE_SPREADSHEET_PROPERTY);

  if (!spreadsheetId) {
    throw new Error(
      'Coverage Scheduler has not been connected to a workbook yet. Reload the Google Sheet that contains this Apps Script project, then reopen the web app.'
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

  ensureStaffListSheet_();
  return ss;
}

/**
 * Convert the bootstrap response into a plain JSON-safe object before handing
 * it to google.script.run. Spreadsheet cells can contain Date values and other
 * Apps Script values that should not leak into the client payload directly.
 */
function makeWebSafe_(value) {
  return JSON.parse(JSON.stringify(value, function(key, item) {
    if (typeof item === 'number' && !isFinite(item)) return '';
    return item;
  }));
}

function webGetBootstrap(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  const data = getSidebarBootstrap(payload || {});
  if (!data) {
    throw new Error('Coverage Scheduler could not build its startup data.');
  }
  return makeWebSafe_(data);
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
  return createCoverageHandoutDocWideFromLatestPreview_();
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
    allStaff: typeof getWebStaffRoster_ === 'function'
      ? getWebStaffRoster_(dayCode)
      : getAllSchedulableStaff_(dayCode),
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
  const result = createCoverageHandoutDocWideFromLatestPreview_();
  SpreadsheetApp.getUi().alert(
    'Handout doc created',
    result.name + '\n\n' + result.url,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
