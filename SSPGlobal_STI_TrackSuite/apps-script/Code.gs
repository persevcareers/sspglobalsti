const SCRIPT_PROP = PropertiesService.getScriptProperties();

function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty("key", doc.getId());
}

function doGet(e) {
  try {
    const action = e?.parameter?.action;

    if (action === "ping") {
      return response(true, "pong - version 2 with session tracking");
    }

    if (!action) {
      return response(true, "SSP Global STI TrackSuite API is running. Use ?action=read&sheet=SheetName or ?action=ping");
    }

    const sheetName = e.parameter.sheet;

    if (!sheetName) {
      return response(false, "Missing sheet parameter. Use ?action=read&sheet=SheetName");
    }

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(sheetName);

    if (!sheet) {
      return response(false, "Sheet not found");
    }

    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return response(true, "Success", []);
    }

    const headers = data[0];
    const rows = data.slice(1);

    const result = rows.map((row) => {
      let obj = {};
      row.forEach((val, idx) => {
        obj[headers[idx]] = val;
      });
      return obj;
    });

    return response(true, "Success", result);

  } catch (error) {
    return response(false, error.toString());
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const sheetName = postData.sheet;
    const data = postData.data;

    if (action === "loginUser") return handleLogin(data);
    if (action === "logoutUser") return handleLogout(data);
    if (action === "updateLastActive") return handleUpdateLastActive(data);
    if (action === "updateUserRole") return handleUpdateUserRole(data);
    if (action === "getOnlineUsers") return handleGetOnlineUsers();
    if (action === "createNotification") return handleCreateNotification(data);
    if (action === "getNotifications") return handleGetNotifications(data);
    if (action === "markNotificationRead") return handleMarkNotificationRead(data);
    if (action === "markAllNotificationsRead") return handleMarkAllNotificationsRead(data);
    if (action === "archiveNotifications") return handleArchiveNotifications(data);
    if (action === "cleanupNotifications") return handleCleanupNotifications(data);
    if (action === "getCachedMetrics") return handleGetCachedMetrics();
    if (action === "computeAndStoreMetrics") return handleComputeAndStoreMetrics();
    if (action === "getRoles") return handleGetRoles();
    if (action === "getRoutesForRole") return handleGetRoutesForRole(data);

    if (!sheetName || !action || !data) {
      return response(false, "Missing required parameters");
    }

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(sheetName);

    if (!sheet) {
      return response(false, "Sheet not found");
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (action === "create") {
      const newRow = headers.map(header => {
        if (header === "Created At") return new Date().toISOString();
        if (header.includes("ID") && !data[header]) return Utilities.getUuid();
        return data[header] !== undefined ? data[header] : "";
      });
      sheet.appendRow(newRow);
      return response(true, "Created successfully");
    }

    else if (action === "update") {
      const idField = headers[0];
      const idToUpdate = data[idField];

      if (!idToUpdate) return response(false, "ID missing for update");

      const sheetData = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < sheetData.length; i++) {
        if (sheetData[i][0] == idToUpdate) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) return response(false, "Record not found");

      const updateRow = headers.map((header, idx) => {
        if (header === idField) return idToUpdate;
        if (header === "Created At") return sheetData[rowIndex-1][idx];
        return data[header] !== undefined ? data[header] : sheetData[rowIndex-1][idx];
      });

      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateRow]);
      return response(true, "Updated successfully");
    }

    else if (action === "delete") {
      const idField = headers[0];
      const idToDelete = data[idField];

      if (!idToDelete) return response(false, "ID missing for delete");

      const sheetData = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < sheetData.length; i++) {
        if (sheetData[i][0] == idToDelete) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) return response(false, "Record not found");

      sheet.deleteRow(rowIndex);
      return response(true, "Deleted successfully");
    }

    return response(false, "Invalid action");

  } catch (error) {
    return response(false, error.toString());
  }
}

function handleLogin(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Users");
  const logSheet = doc.getSheetByName("LoginLogs");
  const sessionSheet = doc.getSheetByName("SessionLogs");

  if (!sheet) return response(false, "Users sheet not found");

  const now = new Date();
  const nowISO = now.toISOString();

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  let rowIndex = -1;

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] == data["User ID"]) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    const newRow = headers.map(header => {
      if (header === "User ID") return data["User ID"];
      if (header === "Full Name") return data["Full Name"] || "";
      if (header === "Email") return data["Email"] || "";
      if (header === "Role") return data["Role"] || "Pending";
      if (header === "Login Time") return nowISO;
      if (header === "Last Active") return nowISO;
      if (header === "Status") return "Online";
      if (header === "Created At") return nowISO;
      return "";
    });
    sheet.appendRow(newRow);
  } else {
    const updateRow = headers.map((header, idx) => {
      if (header === "User ID") return data["User ID"];
      if (header === "Full Name") return data["Full Name"] || sheetData[rowIndex-1][idx];
      if (header === "Email") return data["Email"] || sheetData[rowIndex-1][idx];
      if (header === "Role") return sheetData[rowIndex-1][idx];
      if (header === "Login Time") return nowISO;
      if (header === "Last Active") return nowISO;
      if (header === "Status") return "Online";
      if (header === "Created At") return sheetData[rowIndex-1][idx];
      return sheetData[rowIndex-1][idx];
    });
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateRow]);
  }

  if (logSheet) {
    const logHeaders = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
    const logRow = logHeaders.map(h => {
      if (h === "Log ID") return Utilities.getUuid();
      if (h === "User ID") return data["User ID"];
      if (h === "Email") return data["Email"] || "";
      if (h === "Name") return data["Full Name"] || "";
      if (h === "Action") return "Login";
      if (h === "Timestamp (IST)") return now.toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" });
      return "";
    });
    logSheet.appendRow(logRow);
  }

  if (sessionSheet) {
    const sessionHeaders = sessionSheet.getRange(1, 1, 1, sessionSheet.getLastColumn()).getValues()[0];
    const sessionRow = sessionHeaders.map(h => {
      if (h === "Log ID") return Utilities.getUuid();
      if (h === "User ID") return data["User ID"];
      if (h === "Email") return data["Email"] || "";
      if (h === "Login Time") return nowISO;
      if (h === "Logout Time") return "";
      if (h === "Duration") return "";
      if (h === "Device") return data["Device"] || "";
      if (h === "Browser") return data["Browser"] || "";
      if (h === "IP") return data["IP"] || "";
      return "";
    });
    sessionSheet.appendRow(sessionRow);
  }

  return response(true, "Login recorded successfully");
}

function handleLogout(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Users");
  const logSheet = doc.getSheetByName("LoginLogs");
  const sessionSheet = doc.getSheetByName("SessionLogs");

  if (!sheet) return response(false, "Users sheet not found");

  const now = new Date();
  const nowISO = now.toISOString();

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  let rowIndex = -1;

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] == data["User ID"]) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return response(false, "User not found");

  const updateRow = headers.map((header, idx) => {
    if (header === "Logout Time") return nowISO;
    if (header === "Status") return "Offline";
    if (header === "Last Active") return nowISO;
    return sheetData[rowIndex-1][idx];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateRow]);

  if (logSheet) {
    const logHeaders = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
    const logRow = logHeaders.map(h => {
      if (h === "Log ID") return Utilities.getUuid();
      if (h === "User ID") return data["User ID"];
      if (h === "Email") return data["Email"] || "";
      if (h === "Name") return data["Full Name"] || "";
      if (h === "Action") return "Logout";
      if (h === "Timestamp (IST)") return now.toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" });
      return "";
    });
    logSheet.appendRow(logRow);
  }

  if (sessionSheet) {
    const sessionData = sessionSheet.getDataRange().getValues();
    for (let i = sessionData.length - 1; i >= 1; i--) {
      if (sessionData[i][1] == data["User ID"] && (sessionData[i][4] === "" || !sessionData[i][4])) {
        const loginTime = new Date(sessionData[i][3]);
        const durationMs = now.getTime() - loginTime.getTime();
        const durationMin = Math.floor(durationMs / 60000);
        const durationStr = durationMin >= 60
          ? Math.floor(durationMin / 60) + "h " + (durationMin % 60) + "m"
          : durationMin + "m";

        const updateHeaders = sessionSheet.getRange(1, 1, 1, sessionSheet.getLastColumn()).getValues()[0];
        const updateRow = updateHeaders.map((h, idx) => {
          if (h === "Logout Time") return nowISO;
          if (h === "Duration") return durationStr;
          return sessionData[i][idx];
        });
        sessionSheet.getRange(i + 1, 1, 1, updateHeaders.length).setValues([updateRow]);
        break;
      }
    }
  }

  return response(true, "Logout recorded successfully");
}

function handleUpdateLastActive(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Users");

  if (!sheet) return response(false, "Users sheet not found");

  const now = new Date().toISOString();
  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] == data["User ID"]) {
      const rowIndex = i + 1;
      const updateRow = headers.map((header, idx) => {
        if (header === "Last Active") return now;
        if (header === "Status") return "Online";
        return sheetData[i][idx];
      });
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateRow]);
      return response(true, "Last active updated");
    }
  }

  return response(false, "User not found");
}

function handleUpdateUserRole(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Users");

  if (!sheet) return response(false, "Users sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] == data["User ID"]) {
      const rowIndex = i + 1;
      const roleCol = headers.indexOf("Role");
      if (roleCol === -1) return response(false, "Role column not found");

      sheet.getRange(rowIndex, roleCol + 1).setValue(data["Role"]);
      return response(true, "Role updated successfully");
    }
  }

  return response(false, "User not found");
}

function handleGetOnlineUsers() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Users");

  if (!sheet) return response(false, "Users sheet not found");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return response(true, "Success", []);

  const headers = data[0];
  const statusCol = headers.indexOf("Status");
  if (statusCol === -1) return response(true, "Success", []);

  const onlineUsers = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][statusCol] === "Online") {
      let obj = {};
      data[i].forEach((val, idx) => {
        obj[headers[idx]] = val;
      });
      onlineUsers.push(obj);
    }
  }

  return response(true, "Success", onlineUsers);
}

function handleCreateNotification(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const now = new Date().toISOString();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Dedup: same userId + category + title within 5 min refreshes createdAt
  const existing = sheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    const row = existing[i];
    const rowUserId = String(row[headers.indexOf("userId")] || "");
    const rowCategory = String(row[headers.indexOf("category")] || "");
    const rowTitle = String(row[headers.indexOf("title")] || "");
    const rowCreated = String(row[headers.indexOf("createdAt")] || "");

    if (rowUserId === data.userId && rowCategory === data.category && rowTitle === data.title) {
      if (rowCreated) {
        const elapsed = new Date().getTime() - new Date(rowCreated).getTime();
        if (elapsed < 300000) {
          const createdAtCol = headers.indexOf("createdAt");
          if (createdAtCol >= 0) {
            sheet.getRange(i + 1, createdAtCol + 1).setValue(now);
          }
          return response(true, "Notification refreshed (duplicate)");
        }
      }
    }
  }

  const newRow = headers.map(header => {
    if (header === "notificationId") return Utilities.getUuid();
    if (header === "userId") return data.userId || data["User ID"] || "";
    if (header === "actorId") return data.actorId || "";
    if (header === "sourceModule") return data.sourceModule || "system";
    if (header === "category") return data.category || "info";
    if (header === "priority") return data.priority || "low";
    if (header === "title") return data.title || data["Title"] || "";
    if (header === "message") return data.message || data["Message"] || "";
    if (header === "actionUrl") return data.actionUrl || data["Link"] || "";
    if (header === "actionType") return data.actionType || "";
    if (header === "metadata") return data.metadata || "";
    if (header === "status") return "unread";
    if (header === "isDeleted") return "FALSE";
    if (header === "createdAt") return now;
    if (header === "expiresAt") return data.expiresAt || "";
    if (header === "deviceInfo") return data.deviceInfo || "";
    if (header === "sessionId") return data.sessionId || "";
    return "";
  });

  sheet.appendRow(newRow);
  return response(true, "Notification created");
}

function handleGetNotifications(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  if (sheetData.length <= 1) return response(true, "Success", { notifications: [], total: 0, unreadCount: 0 });

  const headers = sheetData[0];
  const userId = data.userId || data["User ID"] || "";
  const limit = data.limit || 50;
  const offset = data.offset || 0;
  const statusFilter = data.status || "";

  const allNotifications = [];
  let unreadCount = 0;

  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    const rowUserId = String(row[headers.indexOf("userId")] || "");
    const rowIsDeleted = String(row[headers.indexOf("isDeleted")] || "");
    const rowStatus = String(row[headers.indexOf("status")] || "");

    if (rowIsDeleted === "TRUE") continue;
    if (userId && rowUserId !== userId && rowUserId !== "") continue;
    if (statusFilter && rowStatus !== statusFilter) continue;

    let obj = {};
    row.forEach((val, idx) => { if (idx < headers.length) obj[headers[idx]] = val; });
    allNotifications.push(obj);
    if (rowStatus === "unread") unreadCount++;
  }

  allNotifications.sort((a, b) => {
    if (a.createdAt < b.createdAt) return 1;
    if (a.createdAt > b.createdAt) return -1;
    return 0;
  });

  const paginated = allNotifications.slice(offset, offset + limit);

  return response(true, "Success", { notifications: paginated, total: allNotifications.length, unreadCount });
}

function handleMarkNotificationRead(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const notifId = data.notificationId || data["Notification ID"];
  const notifCol = headers.indexOf("notificationId");
  const statusCol = headers.indexOf("status");

  for (let i = 1; i < sheetData.length; i++) {
    if (String(sheetData[i][notifCol]) === notifId) {
      if (sheetData[i][statusCol] === "unread") {
        sheet.getRange(i + 1, statusCol + 1).setValue("read");
      }
      return response(true, "Notification marked as read");
    }
  }

  return response(false, "Notification not found");
}

function handleArchiveNotifications(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const userId = data.userId || data["User ID"] || "";
  const userIdCol = headers.indexOf("userId");
  const createdAtCol = headers.indexOf("createdAt");
  const statusCol = headers.indexOf("status");
  const daysOld = data.daysOld || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  let archived = 0;
  for (let i = 1; i < sheetData.length; i++) {
    const matchesUser = !userId || String(sheetData[i][userIdCol]) === userId;
    if (!matchesUser) continue;
    if (sheetData[i][statusCol] !== "read" && sheetData[i][statusCol] !== "unread") continue;
    const created = new Date(sheetData[i][createdAtCol]);
    if (created < cutoff) {
      sheet.getRange(i + 1, statusCol + 1).setValue("archived");
      archived++;
    }
  }

  return response(true, `Archived ${archived} notifications`);
}

function handleCleanupNotifications(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const expiresAtCol = headers.indexOf("expiresAt");
  const statusCol = headers.indexOf("status");
  const isDelCol = headers.indexOf("isDeleted");
  const createdAtCol = headers.indexOf("createdAt");

  const now = new Date();

  // Soft-delete expired notifications
  for (let i = 1; i < sheetData.length; i++) {
    const expiresAt = sheetData[i][expiresAtCol];
    if (expiresAt && new Date(expiresAt) < now) {
      if (String(sheetData[i][isDelCol] || "") !== "TRUE") {
        sheet.getRange(i + 1, isDelCol + 1).setValue("TRUE");
      }
    }
  }

  // Hard-delete archived + 90d old
  const hardCutoff = new Date();
  hardCutoff.setDate(hardCutoff.getDate() - 90);
  let deleted = 0;
  // Collect rows to delete (iterate backwards)
  for (let i = sheetData.length - 1; i >= 1; i--) {
    if (sheetData[i][statusCol] === "archived") {
      const created = new Date(sheetData[i][createdAtCol]);
      if (created < hardCutoff) {
        sheet.deleteRow(i + 1);
        deleted++;
      }
    }
  }

  return response(true, `Cleaned up: soft-deleted expired, hard-deleted ${deleted} old archived rows`);
}

function handleMarkAllNotificationsRead(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const userId = data.userId || data["User ID"] || "";
  const userIdCol = headers.indexOf("userId");
  const statusCol = headers.indexOf("status");
  const isDelCol = headers.indexOf("isDeleted");

  for (let i = 1; i < sheetData.length; i++) {
    const matchesUser = !userId || String(sheetData[i][userIdCol]) === userId;
    if (matchesUser && sheetData[i][statusCol] === "unread" && String(sheetData[i][isDelCol] || "") !== "TRUE") {
      sheet.getRange(i + 1, statusCol + 1).setValue("read");
    }
  }

  return response(true, "All notifications marked as read");
}

function handleGetCachedMetrics() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Analytics");
  if (!sheet) return response(false, "Analytics sheet not found");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return response(true, "Success", {});

  const headers = data[0];
  const metricNameIdx = headers.indexOf("Metric Name");
  const valueIdx = headers.indexOf("Value");
  if (metricNameIdx === -1 || valueIdx === -1) return response(false, "Invalid Analytics sheet headers");

  const metrics = {};
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][metricNameIdx]).trim();
    const val = Number(data[i][valueIdx]);
    if (name) metrics[name] = val;
  }

  return response(true, "Success", metrics);
}

function handleComputeAndStoreMetrics() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Analytics");
  if (!sheet) return response(false, "Analytics sheet not found");

  const computed = {
    totalStudents: 0, activeStudents: 0, completedStudents: 0, droppedStudents: 0,
    totalLeads: 0, convertedLeads: 0, conversionRate: 0,
    totalCourses: 0, activeCourses: 0,
    totalBatches: 0, ongoingBatches: 0, completedBatches: 0, upcomingBatches: 0,
    totalTrainers: 0, activeTrainers: 0,
  };

  const studentsSheet = doc.getSheetByName("Students");
  if (studentsSheet && studentsSheet.getLastRow() > 1) {
    const sData = studentsSheet.getDataRange().getValues();
    const sHeaders = sData[0];
    const statusCol = sHeaders.indexOf("Status");
    computed.totalStudents = sData.length - 1;
    for (let i = 1; i < sData.length; i++) {
      const status = String(sData[i][statusCol] || "");
      if (status === "Active") computed.activeStudents++;
      else if (status === "Completed") computed.completedStudents++;
      else if (status === "Dropped") computed.droppedStudents++;
    }
  }

  const leadsSheet = doc.getSheetByName("Leads");
  if (leadsSheet && leadsSheet.getLastRow() > 1) {
    const lData = leadsSheet.getDataRange().getValues();
    const lHeaders = lData[0];
    const statusCol = lHeaders.indexOf("Status");
    computed.totalLeads = lData.length - 1;
    for (let i = 1; i < lData.length; i++) {
      if (String(lData[i][statusCol] || "") === "Converted") computed.convertedLeads++;
    }
    computed.conversionRate = computed.totalLeads > 0
      ? Math.round((computed.convertedLeads / computed.totalLeads) * 100) : 0;
  }

  const coursesSheet = doc.getSheetByName("Courses");
  if (coursesSheet && coursesSheet.getLastRow() > 1) {
    const cData = coursesSheet.getDataRange().getValues();
    const cHeaders = cData[0];
    const statusCol = cHeaders.indexOf("Status");
    computed.totalCourses = cData.length - 1;
    for (let i = 1; i < cData.length; i++) {
      if (String(cData[i][statusCol] || "") === "Active") computed.activeCourses++;
    }
  }

  const batchesSheet = doc.getSheetByName("Batches");
  if (batchesSheet && batchesSheet.getLastRow() > 1) {
    const bData = batchesSheet.getDataRange().getValues();
    const bHeaders = bData[0];
    const statusCol = bHeaders.indexOf("Status");
    computed.totalBatches = bData.length - 1;
    for (let i = 1; i < bData.length; i++) {
      const status = String(bData[i][statusCol] || "");
      if (status === "Ongoing") computed.ongoingBatches++;
      else if (status === "Completed") computed.completedBatches++;
      else if (status === "Upcoming") computed.upcomingBatches++;
    }
  }

  const trainersSheet = doc.getSheetByName("Trainers");
  if (trainersSheet && trainersSheet.getLastRow() > 1) {
    const tData = trainersSheet.getDataRange().getValues();
    const tHeaders = tData[0];
    const statusCol = tHeaders.indexOf("Status");
    computed.totalTrainers = tData.length - 1;
    for (let i = 1; i < tData.length; i++) {
      if (String(tData[i][statusCol] || "") === "Active") computed.activeTrainers++;
    }
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).clearContent();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

  const now = new Date().toISOString();
  const metricRows = Object.entries(computed).map(([name, value]) => [name, value, now]);
  if (metricRows.length > 0) {
    sheet.getRange(2, 1, metricRows.length, 3).setValues(metricRows);
  }

  sheet.setFrozenRows(1);

  return response(true, "Metrics computed and stored", computed);
}

function handleGetRoles() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Roles");
  if (!sheet) return response(false, "Roles sheet not found");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return response(true, "Success", []);

  const headers = data[0];
  const roleNameCol = headers.indexOf("Role Name");
  const permissionsCol = headers.indexOf("Permissions");
  if (roleNameCol === -1 || permissionsCol === -1) return response(false, "Invalid Roles sheet headers");

  const roles = [];
  for (let i = 1; i < data.length; i++) {
    roles.push({
      roleName: String(data[i][roleNameCol] || ""),
      permissions: String(data[i][permissionsCol] || "").split(",").map(p => p.trim()).filter(Boolean),
    });
  }

  return response(true, "Success", roles);
}

function handleGetRoutesForRole(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Roles");
  if (!sheet) return response(false, "Roles sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const roleNameCol = headers.indexOf("Role Name");
  const permissionsCol = headers.indexOf("Permissions");
  if (roleNameCol === -1 || permissionsCol === -1) return response(false, "Invalid Roles sheet headers");

  const roleName = data.roleName || "";
  for (let i = 1; i < sheetData.length; i++) {
    if (String(sheetData[i][roleNameCol] || "") === roleName) {
      const perms = String(sheetData[i][permissionsCol] || "").split(",").map(p => p.trim()).filter(Boolean);
      return response(true, "Success", { roleName, permissions: perms });
    }
  }

  return response(false, "Role not found");
}

function response(success, message, data = null) {
  const res = { success, message };
  if (data !== null) res.data = data;

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
