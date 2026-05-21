/**
 * Utilities for Date & Time Formatting, Parsing, Duration Calculations,
 * and Status determination using the standardized IST format.
 */

// Formats a Date object to: "DD - Day - Month Name - YYYY"
// Example: "21 - Wednesday - May - 2026"
export const formatToISTDate = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    weekday: "long",
    month: "long",
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${partMap.day} - ${partMap.weekday} - ${partMap.month} - ${partMap.year}`;
};

// Formats a Date object to: "HH:MM AM/PM IST"
// Example: "07:30 PM IST"
export const formatToISTTime = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  
  let hour = partMap.hour || "";
  if (hour.length === 1) hour = "0" + hour;
  const minute = partMap.minute || "00";
  const dayPeriod = (partMap.dayPeriod || "AM").toUpperCase();
  return `${hour}:${minute} ${dayPeriod} IST`;
};

// Formats a Date object to: "DD - Day - Month Name - YYYY | HH:MM AM/PM IST"
// Example: "21 - Wednesday - May - 2026 | 07:30 PM IST"
export const formatToISTDateTime = (date: Date): string => {
  return `${formatToISTDate(date)} | ${formatToISTTime(date)}`;
};

// Formats a raw date string "YYYY-MM-DD" to "DD - Day - Month Name - YYYY" safely
export const formatRawDateToISTDate = (rawDateStr: string): string => {
  if (!rawDateStr) return "";
  const d = new Date(`${rawDateStr}T12:00:00+05:30`);
  return formatToISTDate(d);
};

// Formats a raw time string "HH:MM" (24h) to "HH:MM AM/PM IST" mathematically
export const formatRawTimeToISTTime = (rawTimeStr: string): string => {
  if (!rawTimeStr) return "";
  const [hours24, minutes] = rawTimeStr.split(":").map(Number);
  const period = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const hrStr = String(hours12).padStart(2, "0");
  const minStr = String(minutes).padStart(2, "0");
  return `${hrStr}:${minStr} ${period} IST`;
};

// Parses "DD - Day - Month Name - YYYY" back to "YYYY-MM-DD" for date inputs
export const parseFormattedDate = (str: string): string => {
  if (!str) return "";
  const parts = str.split(" - ").map((s) => s.trim());
  if (parts.length < 4) return "";
  
  const day = parts[0];
  const monthName = parts[2];
  const year = parts[3];
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIdx = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
  if (monthIdx === -1) return "";
  
  const month = String(monthIdx + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Parses "HH:MM AM/PM IST" (or similar) back to "HH:MM" for time inputs
export const parseFormattedTime = (str: string): string => {
  if (!str) return "";
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "";
  
  let [_, hoursStr, minutesStr, period] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// Parses a combined date & time string or separate components into a JS Date object set to IST timezone
export const parseToISTDateObject = (dateStr: string, timeStr: string): Date | null => {
  try {
    const cleanDate = dateStr.includes(" - ") ? parseFormattedDate(dateStr) : dateStr;
    const cleanTime = timeStr.includes("IST") || timeStr.includes("AM") || timeStr.includes("PM")
      ? parseFormattedTime(timeStr)
      : timeStr;
      
    if (!cleanDate || !cleanTime) return null;
    return new Date(`${cleanDate}T${cleanTime}:00+05:30`);
  } catch (e) {
    return null;
  }
};

// Calculates duration between two time strings (supports raw time "HH:MM" or formatted "HH:MM AM/PM IST")
// Returns duration in format like "1 hr 30 mins" or "45 mins"
export const calculateDuration = (startTimeStr: string, endTimeStr: string): string => {
  if (!startTimeStr || !endTimeStr) return "";
  
  const getMinutes = (timeStr: string) => {
    const formattedMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (formattedMatch) {
      let [_, hr, min, period] = formattedMatch;
      let hours = parseInt(hr, 10);
      const minutes = parseInt(min, 10);
      if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    
    const rawMatch = timeStr.match(/(\d+):(\d+)/);
    if (rawMatch) {
      const hours = parseInt(rawMatch[1], 10);
      const minutes = parseInt(rawMatch[2], 10);
      return hours * 60 + minutes;
    }
    return null;
  };
  
  const startMin = getMinutes(startTimeStr);
  const endMin = getMinutes(endTimeStr);
  
  if (startMin === null || endMin === null) return "";
  
  let diff = endMin - startMin;
  if (diff < 0) {
    diff += 24 * 60; // handles crossing midnight
  }
  
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  
  if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins > 0 ? `${mins} min${mins > 1 ? "s" : ""}` : ""}`.trim();
  }
  return `${mins} min${mins > 1 ? "s" : ""}`;
};

// Determines current status based on current time (IST) relative to Start and End times.
// If manual status is set to Cancelled, Holiday, or Postponed, it preserves it.
export const determineAutoStatus = (
  scheduleDate: string,
  startTime: string,
  endTime: string,
  manualStatus?: string
): "Scheduled" | "Running" | "Completed" | "Cancelled" | "Holiday" | "Postponed" | "PAP" => {
  if (manualStatus === "Cancelled" || manualStatus === "Holiday" || manualStatus === "Postponed" || manualStatus === "PAP") {
    return manualStatus as any;
  }
  
  const now = new Date();
  const startDateTime = parseToISTDateObject(scheduleDate, startTime);
  const endDateTime = endTime ? parseToISTDateObject(scheduleDate, endTime) : null;
  
  if (!startDateTime) {
    return "Scheduled";
  }
  
  const nowMs = now.getTime();
  const startMs = startDateTime.getTime();
  
  if (nowMs < startMs) {
    return "Scheduled";
  }
  
  if (endDateTime) {
    const endMs = endDateTime.getTime();
    if (nowMs >= startMs && nowMs < endMs) {
      return "Running";
    }
    if (nowMs >= endMs) {
      return "Completed";
    }
  } else {
    // End Time is blank and start time has passed
    return "Running";
  }
  
  return "Scheduled";
};
