/**
 * 🐑 Flock In - Configuration & Helper Utilities
 */

var SHEETS = {
  STUDENTS: 'Students',
  MEETINGS: 'Meetings',
  ATTENDANCE: 'Attendance',
  SETTINGS: 'Settings'
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetByName(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet "' + name + '" was not found in spreadsheet.');
  }
  return sheet;
}

function formatCurrentTime() {
  var now = new Date();
  var timeZone = getSetting('Timezone') || Session.getScriptTimeZone();
  return Utilities.formatDate(now, timeZone, 'hh:mm:ss a');
}

function formatCurrentDate() {
  var now = new Date();
  var timeZone = getSetting('Timezone') || Session.getScriptTimeZone();
  return Utilities.formatDate(now, timeZone, 'yyyy-MM-dd');
}

function cleanTimeString(raw) {
  if (!raw) return '';
  var str = String(raw).trim();
  
  // If string contains full date representation like "Sat Dec 30 1899 09:31:20", extract time part
  var timeMatch = str.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
  if (timeMatch) {
    return timeMatch[1].trim();
  }
  return str;
}

function getSetting(key) {
  try {
    var sheet = getSheetByName(SHEETS.SETTINGS);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
  } catch (e) {
    // Return null if settings sheet is missing
  }
  return null;
}
