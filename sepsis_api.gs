/**
 * ============================================================
 *  SEPSIS REGISTRY — Google Apps Script Web App (API)
 *  ใช้คู่กับ sepsis-registry.html
 *
 *  วิธี Deploy:
 *  1. เปิด https://script.google.com → New project
 *  2. วางโค้ดนี้ทั้งหมด → Save
 *  3. Deploy → New deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. คัดลอก URL ที่ได้ไปใส่ในหน้าแอป (ปุ่ม ⚙️ ตั้งค่า)
 * ============================================================
 */

const COLS = [
  'id','hn','name','age','sex','ward','admitDate','diagnosisType',
  'source','organism','sofa','lactate','vasopressor','ventilator',
  'outcome','los','note'
];

// ── ดึง/สร้าง Sheet ─────────────────────────────────────────
function getSheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');
  let ss;

  if (ssId) {
    try { ss = SpreadsheetApp.openById(ssId); } catch(e) { ssId = null; }
  }
  if (!ssId) {
    ss = SpreadsheetApp.create('Sepsis Registry — ข้อมูลผู้ป่วย ' + new Date().getFullYear());
    props.setProperty('SPREADSHEET_ID', ss.getId());
    Logger.log('📊 สร้าง Spreadsheet ใหม่: ' + ss.getUrl());
  }

  let sheet = ss.getSheetByName('patients');
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName('patients');
    sheet.getRange(1, 1, 1, COLS.length).setValues([COLS])
      .setBackground('#1a3c5e').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 140); // id
    sheet.setColumnWidth(3, 160); // name
  }
  return sheet;
}

// ── GET: ดึงข้อมูลทั้งหมด ────────────────────────────────────
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return jsonOut({ status: 'ok', patients: [] });
    }

    const patients = data.slice(1).map(row => {
      const p = {};
      COLS.forEach((col, i) => {
        const val = row[i];
        if (col === 'vasopressor' || col === 'ventilator') {
          p[col] = (val === true || val === 'TRUE' || val === 'true');
        } else if (['age','sofa','los'].includes(col)) {
          p[col] = val === '' || val === null ? '' : Number(val) || '';
        } else {
          p[col] = (val === null || val === undefined) ? '' : String(val);
        }
      });
      return p;
    });

    return jsonOut({ status: 'ok', patients });
  } catch(err) {
    return jsonOut({ status: 'error', message: err.toString() });
  }
}

// ── POST: ซิงค์ข้อมูลทั้งหมด ────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    if (body.action === 'sync') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

      if (body.patients && body.patients.length > 0) {
        const rows = body.patients.map(p =>
          COLS.map(col => {
            const v = p[col];
            return (v === undefined || v === null) ? '' : v;
          })
        );
        sheet.getRange(2, 1, rows.length, COLS.length).setValues(rows);
      }
    }

    return jsonOut({ status: 'ok', count: (body.patients || []).length });
  } catch(err) {
    return jsonOut({ status: 'error', message: err.toString() });
  }
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
