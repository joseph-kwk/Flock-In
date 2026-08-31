/**
 * 🐑 Flock In - Main API Dispatcher & Entry Points
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = e ? e.parameter : {};
    var postData = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback to URL encoded or parameter parsing
      }
    }
    
    var action = params.action || postData.action || 'getStudents';
    var result = {};
    
    switch (action) {
      case 'getStudents':
        result = { success: true, data: getActiveStudents() };
        break;
        
      case 'getCurrentMeeting':
        result = { success: true, data: getCurrentMeeting() };
        break;
        
      case 'checkIn':
        var studentId = params.studentId || postData.studentId;
        var meetingId = params.meetingId || postData.meetingId;
        result = recordCheckIn(studentId, meetingId);
        break;
        
      case 'undoCheckIn':
        var studentId = params.studentId || postData.studentId;
        var meetingId = params.meetingId || postData.meetingId;
        result = undoCheckInRecord(studentId, meetingId);
        break;

      case 'addStudent':
        var name = params.name || postData.name;
        result = addStudentRecord(name);
        break;

      case 'deleteStudent':
        var studentId = params.studentId || postData.studentId;
        result = deleteStudentRecord(studentId);
        break;
        
      case 'getAttendanceSummary':
        var date = params.date || postData.date;
        result = getAttendanceSummary(date);
        break;
        
      case 'toggleMeetingStatus':
        var status = params.status || postData.status;
        result = toggleMeetingStatus(status);
        break;
        
      default:
        result = { success: false, error: 'Invalid action requested: ' + action };
    }
    
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
