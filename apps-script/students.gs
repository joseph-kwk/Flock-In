/**
 * 🐑 Flock In - Student Roster Services
 */

function getActiveStudents() {
  var sheet = getSheetByName(SHEETS.STUDENTS);
  var data = sheet.getDataRange().getValues();
  var students = [];
  
  if (data.length <= 1) return students;
  
  // Header: [Student ID, Name, Active]
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    var name = data[i][1];
    var active = data[i][2];
    
    if (id && name && (active === true || active === 'TRUE' || active === 'true')) {
      students.push({
        id: String(id).trim(),
        name: String(name).trim(),
        active: true
      });
    }
  }
  
  // Sort alphabetically by student name
  students.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });
  
  return students;
}

function getStudentById(studentId) {
  var students = getActiveStudents();
  for (var i = 0; i < students.length; i++) {
    if (students[i].id === studentId) {
      return students[i];
    }
  }
  return null;
}

function addStudentRecord(name) {
  if (!name || !String(name).trim()) {
    return { success: false, error: 'Name is required.' };
  }
  
  var cleanName = String(name).trim();
  var sheet = getSheetByName(SHEETS.STUDENTS);
  var data = sheet.getDataRange().getValues();
  
  var nextNum = data.length;
  var newId = 'STU-' + (nextNum < 10 ? '00' : nextNum < 100 ? '0' : '') + nextNum;
  
  sheet.appendRow([newId, cleanName, true]);
  
  return {
    success: true,
    student: { id: newId, name: cleanName, active: true }
  };
}

function deleteStudentRecord(studentId) {
  if (!studentId) {
    return { success: false, error: 'Student ID is required.' };
  }
  
  var sheet = getSheetByName(SHEETS.STUDENTS);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return { success: false, error: 'Roster is empty.' };
  
  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][0]).trim();
    if (rowId === studentId) {
      // Mark as inactive in Google Sheets
      sheet.getRange(i + 1, 3).setValue(false);
      return { success: true, deletedStudentId: studentId };
    }
  }
  
  return { success: false, error: 'Student not found.' };
}
