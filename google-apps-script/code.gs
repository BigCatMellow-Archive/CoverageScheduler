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

  // Keep the web app aligned with the shared Nysmith school-project theme.
  output.append(getSchoolThemeCss_());

  // Give all noticeable server actions one consistent working/progress state.
  output.append(getWorkingOverlayUi_());

  // Append the small Handout-link enhancement to the already-evaluated output.
  // Do not rebuild a second HtmlOutput from getContent(); doing so can interfere
  // with the Apps Script client/server bridge used by google.script.run.
  output.append(getHandoutOpenLinkUi_());

  return output
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Shared school-project visual language. This intentionally overrides the old
 * indigo/purple accents in index.html without changing the scheduler layout.
 */
function getSchoolThemeCss_() {
  return [
    '<style>',
    ':root{',
    '  --primary:#214289;',
    '  --primary-hover:#1a356c;',
    '  --accent:#f6b756;',
    '  --accent-light:rgba(246,183,86,.12);',
    '  --bg:#f0f2f7;',
    '  --surface:#ffffff;',
    '  --border:#e2e5eb;',
    '  --text:#1f2937;',
    '  --text-muted:#6b7280;',
    '  --success:#059669;',
    '  --error:#dc2626;',
    '  --called-color:#f59e0b;',
    '  --dismissed-color:#059669;',
    '  --returned-color:#6b7280;',
    '  --radius:14px;',
    '  --radius-sm:10px;',
    '  --shadow-card:0 2px 5px rgba(0,0,0,.06),0 1px 3px rgba(0,0,0,.04);',
    '  --shadow-lifted:0 10px 30px rgba(0,0,0,.12),0 3px 8px rgba(0,0,0,.06);',
    '  --shadow-sheet:0 -10px 35px rgba(0,0,0,.18);',
    '  --bottom-nav-h:80px;',
    '  --header-h:72px;',
    '  --safe-bottom:env(safe-area-inset-bottom,0px);',
    '  --ink:var(--text);',
    '  --muted:var(--text-muted);',
    '  --line:var(--border);',
    '  --panel:var(--surface);',
    '  --soft:#f7f8fb;',
    '  --indigo:var(--primary);',
    '  --indigo-dark:var(--primary-hover);',
    '  --green:var(--success);',
    '  --red:var(--error);',
    '  --amber:var(--called-color);',
    '}',
    'body{background:var(--bg);color:var(--text)}',
    '.topbar{background:var(--primary);border-bottom:3px solid var(--accent);box-shadow:0 2px 8px rgba(33,66,137,.16)}',
    '.brand-icon{background:var(--accent);color:var(--primary);border-radius:var(--radius-sm)}',
    '.day-tag{background:var(--accent-light);color:#ffe0aa;border:1px solid rgba(246,183,86,.28)}',
    '.btn-primary{background:var(--accent);color:var(--primary)}',
    '.btn-primary:hover{background:#efaa3f;color:var(--primary-hover)}',
    '.btn-ghost{border-color:rgba(255,255,255,.22)}',
    '.panel-left,.panel-right,.pnl-hd,.plan-hd,.pnl-search{background:var(--surface)}',
    '.panel-center{background:var(--bg)}',
    '.panel-left{border-right-color:var(--border)}',
    '.panel-right{border-left-color:var(--border)}',
    '.pnl-hd,.plan-hd,.pnl-search{border-bottom-color:var(--border)}',
    '.pnl-hd h2,.plan-hd h2,.fl,.section-title{color:var(--text-muted)}',
    '.pnl-count{background:#edf0f5;color:var(--text-muted)}',
    '.mini-add{background:var(--accent-light);color:var(--primary);border:1px solid rgba(246,183,86,.4)}',
    '.mini-add:hover{background:rgba(246,183,86,.22)}',
    '.link-btn{color:var(--primary)}',
    '.link-btn:hover{color:var(--primary-hover)}',
    '.add-btn{border-color:#c8ced8;color:var(--text-muted);border-radius:var(--radius-sm)}',
    '.add-btn:hover{border-color:var(--primary);color:var(--primary);background:rgba(33,66,137,.045)}',
    '.abs-row:hover,.staff-row:hover,.plan-tbl tbody tr:hover td{background:#f7f8fb}',
    '.t1{background:rgba(33,66,137,.10);color:var(--primary)}',
    '.t2{background:var(--accent-light);color:#9a650e}',
    '.t3{background:#eef0f4;color:var(--returned-color)}',
    '.vtabs{background:#e7eaf0;border-radius:var(--radius-sm)}',
    '.vtab{color:var(--text-muted)}',
    '.vtab.on{background:var(--surface);color:var(--primary);box-shadow:var(--shadow-card)}',
    '.spinner{border-color:#d9dee7;border-top-color:var(--primary)}',
    '.plan-tbl,.sub-card{background:var(--surface);border-radius:var(--radius-sm);box-shadow:var(--shadow-card)}',
    '.plan-tbl th,.sub-card-hd{background:#f7f8fb;border-color:var(--border)}',
    '.plan-tbl th{color:#566171}',
    '.tl-track{background:#e9ecf2}',
    '.modal{background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow-lifted)}',
    '.m-hd{background:var(--surface);border-bottom-color:var(--border)}',
    '.m-ft{background:#f7f8fb;border-top-color:var(--border)}',
    '.fi,.fs,.fta,.t-opt,.day-check span,.btn-cancel{border-color:#d7dce5;border-radius:var(--radius-sm)}',
    '.fi:focus,.fs:focus,.fta:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(33,66,137,.10)}',
    '.t-opt.sel{border-color:var(--primary);background:rgba(33,66,137,.08);color:var(--primary)}',
    '.checkline input{accent-color:var(--primary)}',
    '.day-check input:checked+span{background:rgba(33,66,137,.08);border-color:var(--primary);color:var(--primary)}',
    '.advanced{border-color:var(--border);border-radius:var(--radius-sm)}',
    '.advanced summary{background:#f7f8fb;color:#566171;border-radius:var(--radius-sm)}',
    '.advanced[open] summary{border-bottom-color:var(--border)}',
    '.btn-save{background:var(--primary);color:#fff;border-radius:var(--radius-sm)}',
    '.btn-save:hover{background:var(--primary-hover)}',
    '.btn-cancel,.btn-del{border-radius:var(--radius-sm)}',
    '.block-info{background:#f7f8fb;border-radius:var(--radius-sm)}',
    '.error-box{border-radius:var(--radius);box-shadow:var(--shadow-card)}',
    '</style>'
  ].join('\n');
}

/**
 * Adds a single modal working state for server actions that may take long enough
 * for a user to wonder whether their click registered. It wraps the existing
 * gas() helper so every current and future caller gets the same behavior.
 */
function getWorkingOverlayUi_() {
  return [
    '<style>',
    '.working-overlay{position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:20px;background:rgba(15,23,42,.34);backdrop-filter:blur(2px)}',
    '.working-overlay.hidden{display:none!important}',
    '.working-card{display:flex;align-items:center;gap:14px;min-width:280px;max-width:92vw;padding:20px 22px;background:var(--surface,#fff);border:1px solid var(--border,#e2e5eb);border-radius:var(--radius,14px);box-shadow:var(--shadow-lifted,0 10px 30px rgba(0,0,0,.12))}',
    '.working-spinner{width:32px;height:32px;flex:0 0 32px;border:3px solid #dce2eb;border-top-color:var(--primary,#214289);border-radius:50%;animation:working-spin .72s linear infinite}',
    '.working-title{font-size:13px;font-weight:800;color:var(--text,#1f2937);line-height:1.25}',
    '.working-sub{margin-top:4px;font-size:10px;color:var(--text-muted,#6b7280);line-height:1.35}',
    '@keyframes working-spin{to{transform:rotate(360deg)}}',
    '</style>',
    '<script>',
    '(function(){',
    '  var workingCount=0;',
    '  var messages={',
    "    webGenerateCoverage:['Generating coverage plan…','Matching schedules and available coverage staff.'],",
    "    webCreateHandout:['Building handout…','Creating and formatting the Google Doc.'],",
    "    webSaveCoverage:['Saving coverage plan…','Writing the plan to Coverage Output.'],",
    "    webSaveAbsences:['Saving absences…','Updating the selected day.'],",
    "    webSaveCoverageStaff:['Saving coverage staff…','Updating the coverage team.'],",
    "    webDeleteCoverageStaff:['Removing coverage staff…','Updating the coverage team.'],",
    "    webToggleCoverageStaff:['Updating availability…','Saving the daily availability change.'],",
    "    webValidateTeacherSchedule:['Checking teacher schedule…','Validating the schedule source.']",
    '  };',
    '  function ensureOverlay(){',
    "    var el=document.getElementById('workingOverlay');",
    '    if(el)return el;',
    "    el=document.createElement('div');",
    "    el.id='workingOverlay';",
    "    el.className='working-overlay hidden';",
    "    el.setAttribute('role','status');",
    "    el.setAttribute('aria-live','polite');",
    "    el.innerHTML='<div class=\"working-card\"><div class=\"working-spinner\" aria-hidden=\"true\"></div><div><div id=\"workingTitle\" class=\"working-title\">Working…</div><div id=\"workingSub\" class=\"working-sub\">This can take a few seconds.</div></div></div>';",
    '    document.body.appendChild(el);',
    '    return el;',
    '  }',
    '  window.showWorking=function(title,sub){',
    '    workingCount++;',
    '    var el=ensureOverlay();',
    "    document.getElementById('workingTitle').textContent=title||'Working…';",
    "    document.getElementById('workingSub').textContent=sub||'This can take a few seconds.';",
    "    el.classList.remove('hidden');",
    '  };',
    '  window.hideWorking=function(){',
    '    workingCount=Math.max(0,workingCount-1);',
    '    if(workingCount===0){',
    "      var el=document.getElementById('workingOverlay');",
    "      if(el)el.classList.add('hidden');",
    '    }',
    '  };',
    "  if(typeof gas==='function'){",
    '    var baseGas=gas;',
    '    gas=function(method,payload){',
    '      var message=messages[method];',
    '      if(!message)return baseGas(method,payload);',
    '      window.showWorking(message[0],message[1]);',
    '      return baseGas(method,payload).then(function(result){',
    '        window.hideWorking();',
    '        return result;',
    '      },function(error){',
    '        window.hideWorking();',
    '        throw error;',
    '      });',
    '    };',
    '  }',
    "  if(typeof setLoading==='function' && typeof renderPlan==='function'){",
    '    var baseSetLoading=setLoading;',
    '    setLoading=function(on){',
    '      baseSetLoading(on);',
    '      if(!on){',
    "        var body=document.getElementById('planBody');",
    "        if(body && body.querySelector('.spinner')) renderPlan();",
    '      }',
    '    };',
    '  }',
    '})();',
    '</script>'
  ].join('\n');
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
 * google.script.run only accepts primitives plus objects/arrays made from
 * primitives. Native Sheets dates/times arrive in Apps Script as Date objects,
 * so recursively convert them before returning anything to the browser.
 * Sheets stores time-only cells on an 1899/1900 date, so preserve those as
 * display-time strings rather than ISO timestamps.
 */
function makeWebSafe_(value) {
  if (value === null || value === undefined) return value === undefined ? null : value;

  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return '';
    const timeZone = Session.getScriptTimeZone();
    const year = Number(Utilities.formatDate(value, timeZone, 'yyyy'));
    return year <= 1900
      ? Utilities.formatDate(value, timeZone, 'h:mm a')
      : Utilities.formatDate(value, timeZone, 'yyyy-MM-dd');
  }

  if (Array.isArray(value)) {
    return value.map(item => makeWebSafe_(item));
  }

  if (typeof value === 'number') {
    return isFinite(value) ? value : '';
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(key => {
      out[key] = makeWebSafe_(value[key]);
    });
    return out;
  }

  return String(value);
}

function webGetBootstrap(payload) {
  ensureCoverageWorkbookReadyForWeb_();
  const data = getSidebarBootstrap(payload || {});
  if (!data) {
    throw new Error('Coverage Scheduler could not build its startup data.');
  }

  const safe = makeWebSafe_(data);
  if (!safe || !safe.today) {
    throw new Error('Coverage Scheduler startup data was invalid before it reached the browser.');
  }

  return safe;
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
