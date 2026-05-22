const SCRIPT_PROP = PropertiesService.getScriptProperties();
const TZ = "Asia/Kolkata";

/** Returns an IST ISO string like "2026-05-22T10:15:30.000+05:30" */
function istNow() {
  const now = new Date();
  return Utilities.formatDate(now, TZ, "yyyy-MM-dd'T'HH:mm:ss.SSS") + "+05:30";
}

/** Returns a human-readable IST string like "22 May 2026, 10:15 AM IST" */
function istFormatted() {
  const now = new Date();
  return Utilities.formatDate(now, TZ, "dd MMM yyyy, hh:mm a") + " IST";
}

/** Returns IST date string for "Timestamp (IST)" column, like "May 22, 2026, 10:15:30 AM" */
function istLogTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, TZ, "MMM dd, yyyy, hh:mm:ss a");
}

function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty("key", doc.getId());
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "ping") {
      return response(true, "pong - version 2 with session tracking");
    }

    const sheetName = e.parameter.sheet;

    if (!sheetName) {
      return response(false, "Missing sheet parameter");
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
        if (header === "Created At") return istNow();
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
  const nowTS = istNow();

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
      if (header === "Login Time") return nowTS;
      if (header === "Last Active") return nowTS;
      if (header === "Status") return "Online";
      if (header === "Created At") return nowTS;
      return "";
    });
    sheet.appendRow(newRow);
  } else {
    const updateRow = headers.map((header, idx) => {
      if (header === "User ID") return data["User ID"];
      if (header === "Full Name") return data["Full Name"] || sheetData[rowIndex-1][idx];
      if (header === "Email") return data["Email"] || sheetData[rowIndex-1][idx];
      if (header === "Role") return sheetData[rowIndex-1][idx];
      if (header === "Login Time") return nowTS;
      if (header === "Last Active") return nowTS;
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
      if (h === "Timestamp (IST)") return istLogTimestamp();
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
      if (h === "Login Time") return nowTS;
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
  const nowTS = istNow();

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
    if (header === "Logout Time") return nowTS;
    if (header === "Status") return "Offline";
    if (header === "Last Active") return nowTS;
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
      if (h === "Timestamp (IST)") return istLogTimestamp();
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
          if (h === "Logout Time") return nowTS;
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

  const now = istNow();
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

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now = istNow();
  const userId = data.userId || "";
  const category = data.category || "info";
  const title = data.title || "";
  if (userId && title) {
    const sheetData = sheet.getDataRange().getValues();
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const rowUserId = row[headers.indexOf("userId")] || "";
      const rowCategory = row[headers.indexOf("category")] || "";
      const rowTitle = row[headers.indexOf("title")] || "";
      const rowCreatedAt = row[headers.indexOf("createdAt")] || "";
      const rowStatus = row[headers.indexOf("status")] || "";
      if (
        rowUserId === userId &&
        rowCategory === category &&
        rowTitle === title &&
        rowStatus === "unread" &&
        rowCreatedAt
      ) {
        const rowTime = new Date(rowCreatedAt).getTime();
        const diff = new Date(now).getTime() - rowTime;
        if (diff >= 0 && diff < duplicateWindow) {
          // Update the existing notification's createdAt to keep it fresh
          const createdAtCol = headers.indexOf("createdAt") + 1;
          sheet.getRange(i + 1, createdAtCol).setValue(now);
          return response(true, "Notification deduplicated", null);
        }
      }
    }
  }

  const newRow = headers.map(function(header) {
    if (header === "notificationId") return Utilities.getUuid();
    if (header === "organizationId") return data.organizationId || "ssp-global";
    if (header === "branchId") return data.branchId || "";
    if (header === "userId") return userId;
    if (header === "actorId") return data.actorId || userId;
    if (header === "sourceModule") return data.sourceModule || "system";
    if (header === "category") return category;
    if (header === "priority") return data.priority || "medium";
    if (header === "title") return title;
    if (header === "message") return data.message || "";
    if (header === "actionUrl") return data.actionUrl || "";
    if (header === "actionType") return data.actionType || "none";
    if (header === "metadata") return data.metadata || "{}";
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
  if (sheetData.length <= 1) return response(true, "Success", []);

  const headers = sheetData[0];
  const userId = data.userId || "";
  const statusFilter = data.status || null;
  const limit = data.limit ? parseInt(data.limit) : 50;
  const offset = data.offset ? parseInt(data.offset) : 0;

  const notifications = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    const rowUserId = row[headers.indexOf("userId")] || "";
    const rowIsDeleted = row[headers.indexOf("isDeleted")] || "FALSE";
    const rowStatus = row[headers.indexOf("status")] || "unread";

    if (rowUserId !== userId && rowUserId !== "") continue;
    if (rowIsDeleted === "TRUE") continue;
    if (statusFilter && rowStatus !== statusFilter) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    notifications.push(obj);
  }

  notifications.sort(function(a, b) {
    if (a["createdAt"] < b["createdAt"]) return 1;
    if (a["createdAt"] > b["createdAt"]) return -1;
    return 0;
  });

  const paginated = notifications.slice(offset, offset + limit);

  return response(true, "Success", {
    notifications: paginated,
    total: notifications.length,
    unreadCount: notifications.filter(function(n) { return n["status"] === "unread"; }).length,
  });
}

function handleMarkNotificationRead(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const notifId = data.notificationId;
  const notifCol = headers.indexOf("notificationId");
  const statusCol = headers.indexOf("status");

  if (notifCol === -1 || statusCol === -1) {
    return response(false, "Invalid sheet structure");
  }

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][notifCol] === notifId) {
      sheet.getRange(i + 1, statusCol + 1).setValue("read");
      return response(true, "Notification marked as read");
    }
  }

  return response(false, "Notification not found");
}

function handleMarkAllNotificationsRead(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const userId = data.userId || "";
  const userIdCol = headers.indexOf("userId");
  const statusCol = headers.indexOf("status");

  if (userIdCol === -1 || statusCol === -1) {
    return response(false, "Invalid sheet structure");
  }

  var count = 0;
  for (let i = 1; i < sheetData.length; i++) {
    const rowUserId = sheetData[i][userIdCol] || "";
    const rowStatus = sheetData[i][statusCol] || "";
    if (rowUserId === userId && rowStatus === "unread") {
      sheet.getRange(i + 1, statusCol + 1).setValue("read");
      count++;
    }
  }

  return response(true, count + " notifications marked as read");
}

function handleArchiveNotifications(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const userId = data.userId || "";
  const userIdCol = headers.indexOf("userId");
  const statusCol = headers.indexOf("status");
  const createdAtCol = headers.indexOf("createdAt");
  const olderThanDays = data.olderThanDays ? parseInt(data.olderThanDays) : 30;

  if (userIdCol === -1 || statusCol === -1) {
    return response(false, "Invalid sheet structure");
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const cutoffTime = cutoff.getTime();

  var count = 0;
  for (let i = 1; i < sheetData.length; i++) {
    const rowUserId = sheetData[i][userIdCol] || "";
    const rowStatus = sheetData[i][statusCol] || "";
    const rowCreatedAt = sheetData[i][createdAtCol] || "";

    if (userId && rowUserId !== userId) continue;
    if (rowStatus === "archived" || rowStatus === "deleted") continue;

    if (rowCreatedAt) {
      const createdTime = new Date(rowCreatedAt).getTime();
      if (createdTime < cutoffTime) {
        sheet.getRange(i + 1, statusCol + 1).setValue("archived");
        count++;
      }
    }
  }

  return response(true, count + " notifications archived");
}

function handleCleanupNotifications(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const statusCol = headers.indexOf("status");
  const isDeletedCol = headers.indexOf("isDeleted");
  const expiresAtCol = headers.indexOf("expiresAt");

  var count = 0;

  // Soft-delete expired notifications
  if (expiresAtCol !== -1) {
    const now = istNow();
    for (let i = 1; i < sheetData.length; i++) {
      const rowExpires = sheetData[i][expiresAtCol] || "";
      const rowStatus = sheetData[i][statusCol] || "";
      if (rowExpires && rowExpires <= now && rowStatus !== "deleted") {
        sheet.getRange(i + 1, statusCol + 1).setValue("deleted");
        if (isDeletedCol !== -1) {
          sheet.getRange(i + 1, isDeletedCol + 1).setValue("TRUE");
        }
        count++;
      }
    }
  }

  // Hard-delete archived + old (>90 days) notifications
  if (statusCol !== -1) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    var deleteRows = [];
    for (let i = sheetData.length - 1; i >= 1; i--) {
      const rowStatus = sheetData[i][statusCol] || "";
      const rowCreatedAt = sheetData[i][headers.indexOf("createdAt")] || "";
      if (rowStatus === "archived") {
        if (rowCreatedAt) {
          const createdTime = new Date(rowCreatedAt).getTime();
          if (createdTime < cutoff.getTime()) {
            deleteRows.push(i + 1);
          }
        }
      }
    }
    for (var k = 0; k < deleteRows.length; k++) {
      sheet.deleteRow(deleteRows[k]);
      count++;
    }
  }

  return response(true, count + " notifications cleaned up");
}

function response(success, message, data = null) {
  const res = { success, message };
  if (data !== null) res.data = data;

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
