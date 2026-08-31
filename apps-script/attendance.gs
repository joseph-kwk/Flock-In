/**
 * 🐑 Flock In - Attendance Logic & Admin Reporting
 */

function recordCheckIn(studentId, meetingId) {
  if (!studentId) {
    return { success: false, error: 'Student ID is required.' };
  }
  
  var meeting = getCurrentMeeting();
  if (meeting.status !== 'OPEN') {
    return { success: false, error: 'Check-in is currently CLOSED for this class session.' };
  }
  
  var targetMeetingId = meetingId || meeting.id;
  var student = getStudentById(studentId);
  if (!student) {
    return { success: false, error: 'Student not found in active roster.' };
  }
  
  var existingCheckIn = findExistingCheckIn(studentId, targetMeetingId);
  if (existingCheckIn) {
    return {
      success: true,
      alreadyCheckedIn: true,
      message: "You're already checked in!",
      timestamp: existingCheckIn.timestamp,
      studentName: student.name
    };
  }
  
  var sheet = getSheetByName(SHEETS.ATTENDANCE);
  var checkInTime = formatCurrentTime();
  
  // Header: [Meeting ID, Student ID, Name, Check-In Time]
  sheet.appendRow([targetMeetingId, student.id, student.name, checkInTime]);
  
  return {
    success: true,
    alreadyCheckedIn: false,
    message: "You're in! Welcome to the flock.",
    timestamp: checkInTime,
    studentName: student.name
  };
}

function undoCheckInRecord(studentId, meetingId) {
  var meeting = getCurrentMeeting();
  var targetMeetingId = meetingId || meeting.id;
  var sheet = getSheetByName(SHEETS.ATTENDANCE);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return { success: true };
  
  for (var i = data.length - 1; i >= 1; i--) {
    var rowMeetingId = String(data[i][0]).trim();
    var rowStudentId = String(data[i][1]).trim();
    
    if (rowMeetingId === targetMeetingId && rowStudentId === studentId) {
      sheet.deleteRow(i + 1);
      return { success: true, removedStudentId: studentId };
    }
  }
  
  return { success: true };
}

function findExistingCheckIn(studentId, meetingId) {
  var sheet = getSheetByName(SHEETS.ATTENDANCE);
  var data = sheet.getDataRange().getDisplayValues();
  
  if (data.length <= 1) return null;
  
  for (var i = 1; i < data.length; i++) {
    var rowMeetingId = String(data[i][0]).trim();
    var rowStudentId = String(data[i][1]).trim();
    var timestamp = cleanTimeString(data[i][3]);
    
    if (rowMeetingId === meetingId && rowStudentId === studentId) {
      return {
        meetingId: rowMeetingId,
        studentId: rowStudentId,
        timestamp: timestamp
      };
    }
  }
  
  return null;
}

function getAttendanceSummary(dateFilter) {
  var meeting = getCurrentMeeting();
  var students = getActiveStudents();
  var sheet = getSheetByName(SHEETS.ATTENDANCE);
  var data = sheet.getDataRange().getDisplayValues();
  
  var targetMeetingId = meeting.id;
  
  // If dateFilter is provided, find corresponding meeting ID for that date if exists
  if (dateFilter) {
    var meetingsSheet = getSheetByName(SHEETS.MEETINGS);
    var meetingsData = meetingsSheet.getDataRange().getDisplayValues();
    for (var m = 1; m < meetingsData.length; m++) {
      if (String(meetingsData[m][1]).trim() === dateFilter) {
        targetMeetingId = String(meetingsData[m][0]).trim();
        meeting = {
          id: targetMeetingId,
          date: String(meetingsData[m][1]).trim(),
          start: String(meetingsData[m][2]).trim(),
          end: String(meetingsData[m][3]).trim(),
          status: String(meetingsData[m][4]).trim().toUpperCase()
        };
        break;
      }
    }
  }
  
  var attendanceMap = {};
  
  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      var rowMeetingId = String(data[i][0]).trim();
      var rowStudentId = String(data[i][1]).trim();
      var timestamp = cleanTimeString(data[i][3]);
      
      if (rowMeetingId === targetMeetingId) {
        attendanceMap[rowStudentId] = timestamp;
      }
    }
  }
  
  var present = [];
  var missing = [];
  
  students.forEach(function(student) {
    if (attendanceMap[student.id]) {
      present.push({
        id: student.id,
        name: student.name,
        time: attendanceMap[student.id]
      });
    } else {
      missing.push({
        id: student.id,
        name: student.name
      });
    }
  });
  
  var total = students.length;
  var presentCount = present.length;
  var missingCount = missing.length;
  var percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
  
  return {
    success: true,
    meeting: meeting,
    stats: {
      total: total,
      present: presentCount,
      missing: missingCount,
      percentage: percentage
    },
    present: present,
    missing: missing
  };
}
