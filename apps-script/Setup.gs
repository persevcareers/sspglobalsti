function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = {
    "Students": ["Student ID", "Full Name", "Email", "Phone Number", "Course", "Batch", "Start Date", "End Date", "Status", "Progress Percentage", "Created At"],
    "Courses": ["Course ID", "Course Name", "Modules", "Duration", "Status", "Created At"],
    "DailySchedules": ["Task ID", "Batch Name", "Schedule Date", "Start Time", "End Time", "Status", "Duration", "Last Updated Timestamp (IST)", "Notes", "Created Time (IST)", "Modified Time (IST)", "Last Status Change Time (IST)"],
    "Leads": ["Lead ID", "Lead Name", "Contact", "Source", "Interested Course", "Status", "Follow-up Date", "Created At"],
    "Trainers": ["Trainer ID", "Name", "Email", "Phone", "Specialization", "Status", "Created At"],
    "Batches": ["Batch ID", "Batch Name", "Course", "Trainer", "Start Date", "Status", "Created At"],
    "Analytics": ["Metric Name", "Value", "Last Updated"],
    "Users": ["User ID", "Full Name", "Email", "Role", "Login Time", "Logout Time", "Last Active", "Status", "Created At"],
    "LoginLogs": ["Log ID", "User ID", "Email", "Name", "Action", "Timestamp (IST)"],
    "SessionLogs": ["Log ID", "User ID", "Email", "Login Time", "Logout Time", "Duration", "Device", "Browser", "IP"],
    "Roles": ["Role Name", "Permissions"],
    "Notifications": ["notificationId", "organizationId", "branchId", "userId", "actorId", "sourceModule", "category", "priority", "title", "message", "actionUrl", "actionType", "metadata", "status", "isDeleted", "createdAt", "expiresAt", "deviceInfo", "sessionId"]
  };

  for (const [sheetName, headers] of Object.entries(sheetsConfig)) {
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).clearContent();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  seedRoles(ss);

  const sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && sheet1.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }
}

function seedRoles(ss) {
  const sheet = ss.getSheetByName("Roles");
  if (!sheet) return;

  const existing = sheet.getDataRange().getValues();
  if (existing.length > 1) return;

  const roles = [
    ["Super Admin", "ALL"],
    ["Admin", "MANAGE_STUDENTS,MANAGE_TRAINERS,MANAGE_SCHEDULES,MANAGE_COURSES,MANAGE_BATCHES,MANAGE_LEADS,VIEW_ANALYTICS,MANAGE_USERS,MANAGE_ROLES"],
    ["Trainer", "MANAGE_BATCHES,MANAGE_SCHEDULES,VIEW_STUDENTS"],
    ["Student", "VIEW_COURSES,VIEW_SCHEDULES"],
    ["HR", "MANAGE_LEADS,VIEW_STUDENTS,VIEW_SCHEDULES"],
    ["Staff", "VIEW_STUDENTS,VIEW_SCHEDULES,VIEW_LEADS"],
  ];

  roles.forEach(row => sheet.appendRow(row));
}
