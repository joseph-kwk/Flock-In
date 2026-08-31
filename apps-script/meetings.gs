/**
 * 🐑 Flock In - Meeting Session Management
 */

function getCurrentMeeting() {
  var sheet = getSheetByName(SHEETS.MEETINGS);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createDefaultMeeting();
  }
  
  // Header: [Meeting ID, Date, Start, End, Status]
  // Find open meeting or last row meeting
  for (var i = data.length - 1; i >= 1; i--) {
    var status = String(data[i][4]).trim().toUpperCase();
    if (status === 'OPEN') {
      return {
        id: String(data[i][0]).trim(),
        date: String(data[i][1]).trim(),
        start: String(data[i][2]).trim(),
        end: String(data[i][3]).trim(),
        status: 'OPEN'
      };
    }
  }
  
  // Fallback to most recent meeting row
  var lastRow = data[data.length - 1];
  return {
    id: String(lastRow[0]).trim(),
    date: String(lastRow[1]).trim(),
    start: String(lastRow[2]).trim(),
    end: String(lastRow[3]).trim(),
    status: String(lastRow[4]).trim().toUpperCase()
  };
}

function createDefaultMeeting() {
  var sheet = getSheetByName(SHEETS.MEETINGS);
  var today = formatCurrentDate();
  var defaultId = 'MTG-' + today.replace(/-/g, '');
  
  var meeting = {
    id: defaultId,
    date: today,
    start: '11:00 AM',
    end: '12:00 PM',
    status: 'OPEN'
  };
  
  sheet.appendRow([meeting.id, meeting.date, meeting.start, meeting.end, meeting.status]);
  return meeting;
}

function toggleMeetingStatus(newStatus) {
  var sheet = getSheetByName(SHEETS.MEETINGS);
  var data = sheet.getDataRange().getValues();
  
  if (data.length > 1) {
    var lastRowIndex = data.length;
    var targetStatus = (newStatus || 'CLOSED').toUpperCase();
    sheet.getRange(lastRowIndex, 5).setValue(targetStatus);
    return { success: true, status: targetStatus };
  }
  return { success: false, error: 'No meeting found to update.' };
}
