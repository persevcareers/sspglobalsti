const SCRIPT_PROP = PropertiesService.getScriptProperties();

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
  const newRow = headers.map(header => {
    if (header === "Notification ID") return Utilities.getUuid();
    if (header === "User ID") return data["User ID"] || "";
    if (header === "Title") return data["Title"] || "";
    if (header === "Message") return data["Message"] || "";
    if (header === "Type") return data["Type"] || "info";
    if (header === "Link") return data["Link"] || "";
    if (header === "Is Read") return "FALSE";
    if (header === "Created At") return now;
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
  const userId = data["User ID"];
  const unreadOnly = data["Unread Only"] === true;

  const notifications = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (userId && row[headers.indexOf("User ID")] !== userId && row[headers.indexOf("User ID")] !== "") continue;
    if (unreadOnly && row[headers.indexOf("Is Read")] === "TRUE") continue;

    let obj = {};
    row.forEach((val, idx) => { obj[headers[idx]] = val; });
    notifications.push(obj);
  }

  notifications.sort((a, b) => {
    if (a["Created At"] < b["Created At"]) return 1;
    if (a["Created At"] > b["Created At"]) return -1;
    return 0;
  });

  return response(true, "Success", notifications);
}

function handleMarkNotificationRead(data) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName("Notifications");

  if (!sheet) return response(false, "Notifications sheet not found");

  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const notifId = data["Notification ID"];
  const notifCol = headers.indexOf("Notification ID");
  const readCol = headers.indexOf("Is Read");

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][notifCol] === notifId) {
      sheet.getRange(i + 1, readCol + 1).setValue("TRUE");
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
  const userId = data["User ID"];
  const userIdCol = headers.indexOf("User ID");
  const readCol = headers.indexOf("Is Read");

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][userIdCol] === userId && sheetData[i][readCol] !== "TRUE") {
      sheet.getRange(i + 1, readCol + 1).setValue("TRUE");
    }
  }

  return response(true, "All notifications marked as read");
}

function response(success, message, data = null) {
  const res = { success, message };
  if (data !== null) res.data = data;

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
