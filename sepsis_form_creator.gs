/**
 * ========================================================
 *  SEPSIS REGISTRY — Google Apps Script
 *  สร้าง Google Form + Google Sheet อัตโนมัติ
 *  วิธีใช้: วางโค้ดนี้ใน Google Apps Script แล้วกด Run
 * ========================================================
 */

function createSepsisForm() {
  // ── 1. สร้าง Form ──────────────────────────────────────
  var form = FormApp.create("🦠 Sepsis Registry — ICU / Med Ward");
  form.setDescription(
    "แบบฟอร์มบันทึกข้อมูลผู้ป่วย Sepsis\n" +
    "Ward: ICU · Internal Medicine\n" +
    "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (*)"
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setShuffleQuestions(false);

  // ── 2. SECTION 1: ข้อมูลพื้นฐาน ───────────────────────
  form.addSectionHeaderItem()
    .setTitle("📋 ส่วนที่ 1 — ข้อมูลผู้ป่วย")
    .setHelpText("กรอกข้อมูลทั่วไปของผู้ป่วย");

  form.addTextItem()
    .setTitle("HN (Hospital Number) *")
    .setHelpText("กรอก HN ของผู้ป่วย เช่น 12345678")
    .setRequired(true);

  form.addTextItem()
    .setTitle("ชื่อ-นามสกุล *")
    .setRequired(true);

  form.addTextItem()
    .setTitle("อายุ (ปี) *")
    .setHelpText("กรอกตัวเลขอายุเป็นปี")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("เพศ *")
    .setChoiceValues(["ชาย", "หญิง"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Ward *")
    .setChoiceValues(["ICU", "Med"])
    .setRequired(true);

  form.addDateItem()
    .setTitle("วันที่รับไว้ในโรงพยาบาล (Admit Date) *")
    .setRequired(true);

  // ── 3. SECTION 2: การวินิจฉัย ──────────────────────────
  form.addPageBreakItem()
    .setTitle("🔬 ส่วนที่ 2 — การวินิจฉัยและแหล่งติดเชื้อ");

  form.addMultipleChoiceItem()
    .setTitle("Diagnosis *")
    .setChoiceValues(["Sepsis", "Severe Sepsis", "Septic Shock"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Source of Infection (แหล่งติดเชื้อ) *")
    .setChoiceValues([
      "Lung (ปอด/ปอดอักเสบ)",
      "Abdomen (ช่องท้อง)",
      "UTI (ทางเดินปัสสาวะ)",
      "SSTI (ผิวหนัง/เนื้อเยื่ออ่อน)",
      "Line (สายสวนหลอดเลือด)",
      "Unknown (ไม่ทราบแหล่ง)",
      "Other (อื่นๆ)"
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Organism / เชื้อก่อโรค")
    .setHelpText("เช่น E.coli, Klebsiella, MRSA, S.aureus, Pseudomonas, Unknown")
    .setRequired(false);

  // ── 4. SECTION 3: ความรุนแรง ───────────────────────────
  form.addPageBreakItem()
    .setTitle("📊 ส่วนที่ 3 — ความรุนแรงของโรค");

  form.addTextItem()
    .setTitle("SOFA Score *")
    .setHelpText("ช่วง 0–24 คะแนน")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Lactate (mmol/L)")
    .setHelpText("เช่น 2.5")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("ใช้ Vasopressor *")
    .setChoiceValues(["ใช้", "ไม่ใช้"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("ใช้ Ventilator / เครื่องช่วยหายใจ *")
    .setChoiceValues(["ใช้", "ไม่ใช้"])
    .setRequired(true);

  // ── 5. SECTION 4: ผลลัพธ์ ──────────────────────────────
  form.addPageBreakItem()
    .setTitle("🏥 ส่วนที่ 4 — ผลการรักษา");

  form.addMultipleChoiceItem()
    .setTitle("Outcome *")
    .setChoiceValues(["Alive (รอดชีวิต)", "Dead (เสียชีวิต)", "Transfer (ส่งต่อ)"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("ระยะเวลานอนโรงพยาบาล LOS (วัน)")
    .setHelpText("จำนวนวันที่นอนโรงพยาบาล")
    .setRequired(false);

  form.addTextItem()
    .setTitle("ผู้กรอกข้อมูล (RN/พยาบาล)")
    .setHelpText("ชื่อย่อหรือรหัสพยาบาล")
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle("หมายเหตุเพิ่มเติม")
    .setRequired(false);

  // ── 6. เชื่อม Google Sheet ─────────────────────────────
  var sheet = SpreadsheetApp.create("Sepsis Registry — ข้อมูลผู้ป่วย " + new Date().getFullYear());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  // ── 7. จัดรูปแบบ Sheet ────────────────────────────────
  Utilities.sleep(2000); // รอ Sheet สร้าง
  formatSheet(sheet);

  // ── 8. สร้าง Dashboard Sheet ───────────────────────────
  createDashboardSheet(sheet);

  // ── 9. แสดงลิ้งค์ ─────────────────────────────────────
  var formUrl = form.getPublishedUrl();
  var sheetUrl = sheet.getUrl();

  Logger.log("✅ สร้างสำเร็จ!");
  Logger.log("📝 ลิ้งค์ฟอร์ม (แชร์ให้ RN): " + formUrl);
  Logger.log("📊 ลิ้งค์ Google Sheet: " + sheetUrl);

  // แสดง popup
  var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;
  Browser.msgBox(
    "✅ สร้าง Sepsis Form สำเร็จ!\n\n" +
    "📝 ลิ้งค์ฟอร์ม (แชร์ให้ RN):\n" + formUrl + "\n\n" +
    "📊 ลิ้งค์ Google Sheet:\n" + sheetUrl
  );

  return { formUrl: formUrl, sheetUrl: sheetUrl };
}

// ── จัดรูปแบบ Sheet หลัก ──────────────────────────────────
function formatSheet(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  var dataSheet = sheets[0];
  if (!dataSheet) return;

  dataSheet.setName("ข้อมูลผู้ป่วย");

  // Header row styling
  var headerRange = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn());
  headerRange.setBackground("#1a3c5e");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  dataSheet.setFrozenRows(1);

  // Column widths
  dataSheet.setColumnWidth(1, 180); // Timestamp
  dataSheet.setColumnWidth(2, 100); // HN
  dataSheet.setColumnWidth(3, 160); // ชื่อ
  dataSheet.setColumnWidth(4, 60);  // อายุ
  dataSheet.setColumnWidth(5, 60);  // เพศ
  dataSheet.setColumnWidth(6, 60);  // Ward
  dataSheet.setColumnWidth(7, 120); // Admit Date
  dataSheet.setColumnWidth(8, 130); // Diagnosis
  dataSheet.setColumnWidth(9, 180); // Source
  dataSheet.setColumnWidth(10, 160); // Organism
  dataSheet.setColumnWidth(11, 80);  // SOFA
  dataSheet.setColumnWidth(12, 100); // Lactate
  dataSheet.setColumnWidth(13, 100); // Vasopressor
  dataSheet.setColumnWidth(14, 110); // Ventilator
  dataSheet.setColumnWidth(15, 130); // Outcome
  dataSheet.setColumnWidth(16, 80);  // LOS
  dataSheet.setColumnWidth(17, 130); // ผู้กรอก
  dataSheet.setColumnWidth(18, 200); // หมายเหตุ

  // Alternating row colors (apply to first 200 rows)
  for (var i = 2; i <= 200; i++) {
    var rowRange = dataSheet.getRange(i, 1, 1, 20);
    if (i % 2 === 0) {
      rowRange.setBackground("#f0f7ff");
    } else {
      rowRange.setBackground("#ffffff");
    }
  }
}

// ── สร้าง Dashboard / Summary Sheet ──────────────────────
function createDashboardSheet(spreadsheet) {
  var dash = spreadsheet.insertSheet("📊 Dashboard");
  dash.setTabColor("#1a3c5e");

  // Title
  dash.getRange("A1").setValue("🦠 SEPSIS REGISTRY — สรุปสถิติ");
  dash.getRange("A1").setFontSize(18).setFontWeight("bold").setFontColor("#1a3c5e");
  dash.getRange("A2").setValue("อัปเดตล่าสุด: =TEXT(NOW(),\"DD/MM/YYYY HH:MM\")");
  dash.getRange("A2").setFontColor("#666666").setFontSize(10);

  dash.getRange("A1:H1").merge().setBackground("#e8f4fd");
  dash.getRange("A2:H2").merge().setBackground("#e8f4fd");

  // Summary stats
  var statsData = [
    ["", "", "", "", "", "", "", ""],
    ["📊 สถิติรวม", "", "", "", "", "", "", ""],
    ["ผู้ป่วยทั้งหมด", "=COUNTA('ข้อมูลผู้ป่วย'!B:B)-1", "", "Septic Shock", "=COUNTIF('ข้อมูลผู้ป่วย'!H:H,\"Septic Shock\")", "", "", ""],
    ["ICU", "=COUNTIF('ข้อมูลผู้ป่วย'!F:F,\"ICU\")", "", "Mortality", "=IF(COUNTA('ข้อมูลผู้ป่วย'!B:B)-1>0,TEXT(COUNTIF('ข้อมูลผู้ป่วย'!O:O,\"Dead (เสียชีวิต)\")/(COUNTA('ข้อมูลผู้ป่วย'!B:B)-1),\"0.0%\"),\"N/A\")", "", "", ""],
    ["Med", "=COUNTIF('ข้อมูลผู้ป่วย'!F:F,\"Med\")", "", "Vasopressor", "=COUNTIF('ข้อมูลผู้ป่วย'!M:M,\"ใช้\")", "", "", ""],
    ["Sepsis", "=COUNTIF('ข้อมูลผู้ป่วย'!H:H,\"Sepsis\")", "", "Ventilator", "=COUNTIF('ข้อมูลผู้ป่วย'!N:N,\"ใช้\")", "", "", ""],
    ["Severe Sepsis", "=COUNTIF('ข้อมูลผู้ป่วย'!H:H,\"Severe Sepsis\")", "", "รอดชีวิต", "=COUNTIF('ข้อมูลผู้ป่วย'!O:O,\"Alive (รอดชีวิต)\")", "", "", ""],
  ];

  dash.getRange(3, 1, statsData.length, 8).setValues(statsData);

  // Style stats header
  dash.getRange("A4").setFontWeight("bold").setFontSize(13).setFontColor("#1a3c5e");
  dash.getRange("A4:H4").merge().setBackground("#1a3c5e").setFontColor("#ffffff");

  // Style stat rows
  var statLabels = ["A5","A6","A7","A8","A9","A10"];
  statLabels.forEach(function(cell) {
    dash.getRange(cell).setFontColor("#444444").setFontWeight("bold");
  });
  var statValues = ["B5","B6","B7","B8","B9","B10","E5","E6","E7","E8","E9","E10"];
  statValues.forEach(function(cell) {
    dash.getRange(cell).setFontColor("#1a3c5e").setFontWeight("bold").setFontSize(14);
  });

  // Source breakdown table
  var sourceRow = 12;
  dash.getRange(sourceRow, 1).setValue("🦠 แหล่งติดเชื้อ (Source of Infection)");
  dash.getRange(sourceRow, 1, 1, 4).merge()
    .setBackground("#1a3c5e").setFontColor("#ffffff").setFontWeight("bold");

  var sources = [
    "Lung (ปอด/ปอดอักเสบ)",
    "Abdomen (ช่องท้อง)",
    "UTI (ทางเดินปัสสาวะ)",
    "SSTI (ผิวหนัง/เนื้อเยื่ออ่อน)",
    "Line (สายสวนหลอดเลือด)",
    "Unknown (ไม่ทราบแหล่ง)",
    "Other (อื่นๆ)"
  ];
  sources.forEach(function(src, i) {
    var r = sourceRow + 1 + i;
    dash.getRange(r, 1).setValue(src);
    dash.getRange(r, 2).setFormula('=COUNTIF(\'ข้อมูลผู้ป่วย\'!I:I,"' + src + '")');
    dash.getRange(r, 3).setValue("ราย");
    if (i % 2 === 0) dash.getRange(r, 1, 1, 4).setBackground("#f0f7ff");
  });

  // Monthly count table
  var monthRow = 21;
  dash.getRange(monthRow, 1).setValue("📅 จำนวนผู้ป่วยรายเดือน (ปีปัจจุบัน)");
  dash.getRange(monthRow, 1, 1, 5).merge()
    .setBackground("#1a3c5e").setFontColor("#ffffff").setFontWeight("bold");

  var monthHeaders = [["เดือน", "รวม", "ICU", "Med", "เสียชีวิต"]];
  dash.getRange(monthRow + 1, 1, 1, 5).setValues(monthHeaders)
    .setBackground("#dde8f5").setFontWeight("bold");

  var monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
                    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  var year = new Date().getFullYear();
  monthNames.forEach(function(mn, i) {
    var r = monthRow + 2 + i;
    var m = String(i + 1).padStart(2, "0");
    var datePattern = year + "/" + m;
    dash.getRange(r, 1).setValue(mn);
    dash.getRange(r, 2).setFormula(
      '=COUNTIFS(\'ข้อมูลผู้ป่วย\'!G:G,">="&DATE(' + year + ',' + (i+1) + ',1),\'ข้อมูลผู้ป่วย\'!G:G,"<"&DATE(' + year + ',' + (i+2) + ',1))'
    );
    dash.getRange(r, 3).setFormula(
      '=COUNTIFS(\'ข้อมูลผู้ป่วย\'!G:G,">="&DATE(' + year + ',' + (i+1) + ',1),\'ข้อมูลผู้ป่วย\'!G:G,"<"&DATE(' + year + ',' + (i+2) + ',1),\'ข้อมูลผู้ป่วย\'!F:F,"ICU")'
    );
    dash.getRange(r, 4).setFormula(
      '=COUNTIFS(\'ข้อมูลผู้ป่วย\'!G:G,">="&DATE(' + year + ',' + (i+1) + ',1),\'ข้อมูลผู้ป่วย\'!G:G,"<"&DATE(' + year + ',' + (i+2) + ',1),\'ข้อมูลผู้ป่วย\'!F:F,"Med")'
    );
    dash.getRange(r, 5).setFormula(
      '=COUNTIFS(\'ข้อมูลผู้ป่วย\'!G:G,">="&DATE(' + year + ',' + (i+1) + ',1),\'ข้อมูลผู้ป่วย\'!G:G,"<"&DATE(' + year + ',' + (i+2) + ',1),\'ข้อมูลผู้ป่วย\'!O:O,"Dead (เสียชีวิต)")'
    );
    if (i % 2 === 0) dash.getRange(r, 1, 1, 5).setBackground("#f0f7ff");
  });

  // Column widths for dashboard
  dash.setColumnWidth(1, 220);
  dash.setColumnWidth(2, 100);
  dash.setColumnWidth(3, 100);
  dash.setColumnWidth(4, 100);
  dash.setColumnWidth(5, 120);

  Logger.log("✅ Dashboard sheet created");
}

/**
 * ── วิธีใช้งาน ────────────────────────────────────────────
 *
 * 1. เปิด https://script.google.com
 * 2. คลิก "New project"
 * 3. วางโค้ดทั้งหมดนี้แทนที่โค้ดเดิม
 * 4. กดปุ่ม ▶ Run (เลือก function: createSepsisForm)
 * 5. อนุญาต Permission ที่ Google ขอ
 * 6. รอสักครู่ จะมี popup แสดงลิ้งค์ฟอร์มและ Sheet
 * 7. คัดลอกลิ้งค์ฟอร์มแชร์ให้ RN ได้เลย
 *
 * ── หมายเหตุ ─────────────────────────────────────────────
 * - ข้อมูลจะเข้า Google Sheet ทันทีที่ RN กด Submit
 * - ดูสถิติได้ที่ Sheet "📊 Dashboard"
 * - สามารถแก้ไข Form เพิ่มเติมได้ที่ Google Forms ภายหลัง
 * ─────────────────────────────────────────────────────────
 */
