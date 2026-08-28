function createCoverageHandoutDocWideFromLatestPreview_() {
  const preview = getLatestPreview_();
  const rows = (preview.rows || []).filter(r => String(r.Status || '').trim() === 'Assigned');

  if (!rows.length) {
    throw new Error('No assigned preview rows found to build handouts.');
  }

  const date = normalizeDateKey_(rows[0].Date) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const day = String(rows[0].Day || '').trim();
  return createCoverageHandoutDocWide_(rows, date, day);
}

function createCoverageHandoutDocWide_(rows, date, day) {
  const grouped = {};

  rows.forEach(row => {
    const person = String(row.Assigned_Coverage || '').trim();
    if (!person) return;
    if (!grouped[person]) grouped[person] = [];
    grouped[person].push(row);
  });

  const names = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  if (!names.length) {
    throw new Error('No assigned coverage staff found to build handouts.');
  }

  const doc = DocumentApp.create('Coverage Handouts - ' + date + (day ? ' - ' + day : ''));
  const body = doc.getBody();
  formatWideHandoutPage_(body);

  names.forEach((name, index) => {
    const personRows = grouped[name]
      .slice()
      .sort((a, b) => timeToMinutes_(a.Start) - timeToMinutes_(b.Start));

    appendWideHandoutHeader_(body, name, date, personRows.length);

    const tableData = [['Time', 'Absent Teacher', 'Subject', 'Room']];
    personRows.forEach(row => {
      tableData.push([
        formatWideHandoutTimeRange_(row.Start, row.End),
        String(row.Absent_Staff || ''),
        String(row.Subject || row.Assignment_Type || ''),
        String(row.Room || '')
      ]);
    });

    const table = body.appendTable(tableData);
    styleWideHandoutTable_(table);

    if (index < names.length - 1) body.appendPageBreak();
  });

  doc.saveAndClose();

  return {
    id: doc.getId(),
    url: doc.getUrl(),
    name: doc.getName()
  };
}

function formatWideHandoutPage_(body) {
  // Letter landscape: 11 x 8.5 inches at 72 points per inch.
  body.setPageWidth(792);
  body.setPageHeight(612);

  // Small, print-safe margins leave 756 pt for the assignment table.
  body.setMarginTop(22);
  body.setMarginBottom(22);
  body.setMarginLeft(18);
  body.setMarginRight(18);
}

function appendWideHandoutHeader_(body, name, date, assignmentCount) {
  const eyebrow = body.appendParagraph('COVERAGE ASSIGNMENTS');
  eyebrow
    .setSpacingBefore(0)
    .setSpacingAfter(2);
  eyebrow.editAsText()
    .setFontSize(8)
    .setBold(true)
    .setForegroundColor('#64748B');

  const title = body.appendParagraph(name);
  title
    .setSpacingBefore(0)
    .setSpacingAfter(2);
  title.editAsText()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor('#0F172A');

  const prettyDate = formatWideHandoutDate_(date);
  const countText = assignmentCount + ' assignment' + (assignmentCount === 1 ? '' : 's');
  const subtitle = body.appendParagraph(prettyDate + '  •  ' + countText);
  subtitle
    .setSpacingBefore(0)
    .setSpacingAfter(10);
  subtitle.editAsText()
    .setFontSize(9)
    .setForegroundColor('#475569');
}

function formatWideHandoutDate_(date) {
  const key = normalizeDateKey_(date);
  if (!key) return String(date || '');

  const parsed = new Date(key + 'T12:00:00');
  if (isNaN(parsed)) return key;

  return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'EEEE, MMMM d, yyyy');
}

function formatWideHandoutTimeRange_(startValue, endValue) {
  const start = timeToDisplay_(startValue);
  const end = timeToDisplay_(endValue);
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return start + '–' + end;
}

function styleWideHandoutTable_(table) {
  // Usable page width is 756 pt. These widths intentionally consume all of it.
  // The Time column is deliberately generous so normal ranges stay on one line.
  table.setColumnWidth(0, 150);
  table.setColumnWidth(1, 195);
  table.setColumnWidth(2, 315);
  table.setColumnWidth(3, 96);
  table.setBorderColor('#CBD5E1');
  table.setBorderWidth(0.75);

  for (let r = 0; r < table.getNumRows(); r++) {
    const row = table.getRow(r);
    row.setMinimumHeight(r === 0 ? 24 : 26);

    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);
      cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
      cell.setPaddingTop(3);
      cell.setPaddingBottom(3);
      cell.setPaddingLeft(6);
      cell.setPaddingRight(6);

      if (r === 0) {
        cell.setBackgroundColor('#E2E8F0');
      } else if (r % 2 === 0) {
        cell.setBackgroundColor('#F8FAFC');
      }

      for (let p = 0; p < cell.getNumChildren(); p++) {
        const child = cell.getChild(p);
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
          child.asParagraph()
            .setSpacingBefore(0)
            .setSpacingAfter(0)
            .setLineSpacing(1);
        }
      }

      const text = cell.editAsText();
      text.setFontSize(r === 0 ? 9 : 10);
      text.setForegroundColor(r === 0 ? '#334155' : '#0F172A');
      text.setBold(r === 0 || (r > 0 && c === 0));
    }
  }
}
