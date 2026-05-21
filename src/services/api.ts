import { toast } from "sonner";

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string;

export type ActionType = "create" | "update" | "delete" | "read";
export type SheetName = "Students" | "Courses" | "DailySchedules" | "Leads" | "Trainers" | "Batches" | "Analytics" | "Users" | "LoginLogs" | "SessionLogs" | "Roles" | "Notifications";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface SessionApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 30000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(sheetName: string): string {
  return `sheet:${sheetName}`;
}

function getCached<T>(sheetName: string): T[] | null {
  const key = getCacheKey(sheetName);
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data as T[];
  }
  cache.delete(key);
  return null;
}

function setCache<T>(sheetName: string, data: T[]): void {
  const key = getCacheKey(sheetName);
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

export function invalidateCache(sheetName?: string): void {
  if (sheetName) {
    cache.delete(getCacheKey(sheetName));
  } else {
    cache.clear();
  }
}

class GoogleAppsScriptError extends Error {
  constructor(message: string, public readonly rawResponse?: string) {
    super(message);
    this.name = "GoogleAppsScriptError";
  }
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, { redirect: "follow", ...options });

  console.log(`[API] Response Status: ${response.status}`);
  console.log(`[API] Content-Type: ${response.headers.get("content-type")}`);

  const text = await response.text();

  if (text.startsWith("<!DOCTYPE") || text.startsWith("<html") || text.startsWith("<HTML")) {
    console.error("[API] Received HTML instead of JSON:", text.substring(0, 200));
    throw new GoogleAppsScriptError(
      "Google Apps Script returned an HTML page. The deployment may be misconfigured or the URL may be wrong.",
      text.substring(0, 500)
    );
  }

  if (!response.ok) {
    throw new GoogleAppsScriptError(`HTTP Error: ${response.status} ${response.statusText}`, text);
  }

  Object.defineProperty(response, "text", { value: async () => text });
  Object.defineProperty(response, "json", {
    value: async () => {
      try {
        return JSON.parse(text);
      } catch {
        throw new GoogleAppsScriptError(
          `Invalid JSON response. Expected JSON but received: ${text.substring(0, 200)}`,
          text.substring(0, 500)
        );
      }
    },
  });

  return response;
}

export const fetchSheetData = async <T>(sheetName: SheetName): Promise<T[]> => {
  if (!SCRIPT_URL) {
    console.warn("NEXT_PUBLIC_GOOGLE_SCRIPT_URL is not set");
    return [];
  }

  const cached = getCached<T>(sheetName);
  if (cached) return cached;

  const key = getCacheKey(sheetName);
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T[]>;
  }

  const promise = (async () => {
    try {
      const url = new URL(SCRIPT_URL);
      url.searchParams.append("action", "read");
      url.searchParams.append("sheet", sheetName);

      const response = await safeFetch(url.toString(), { method: "GET" });
      const result: ApiResponse<T[]> = await response.json();

      if (result.success && result.data) {
        setCache(sheetName, result.data);
        return result.data;
      }
      console.error(`[API] Error fetching "${sheetName}":`, result.message);
      return [];
    } catch (error) {
      if (error instanceof GoogleAppsScriptError) {
        console.error(`[API] Apps Script error for "${sheetName}":`, error.message);
        toast.error(`Failed to load ${sheetName} data`, { description: error.message });
      } else {
        console.error(`[API] Network error fetching "${sheetName}":`, error);
        toast.error(`Network error loading ${sheetName}`, { description: "Check your connection and try again." });
      }
      return [];
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
};

export const modifySheetData = async <T>(
  action: "create" | "update" | "delete",
  sheetName: SheetName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<ApiResponse<T>> => {
  if (!SCRIPT_URL) {
    toast.error("Configuration error", { description: "Google Script URL is not configured." });
    throw new Error("NEXT_PUBLIC_GOOGLE_SCRIPT_URL is not set");
  }

  try {
    const response = await safeFetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action, sheet: sheetName, data }),
    });

    const result: ApiResponse<T> = await response.json();

    if (result.success) {
      invalidateCache(sheetName);
    } else {
      console.error(`[API] ${action} failed for "${sheetName}":`, result.message);
      toast.error(`Failed to ${action} ${sheetName}`, { description: result.message });
    }

    return result;
  } catch (error) {
    if (error instanceof GoogleAppsScriptError) {
      console.error(`[API] Apps Script error during ${action} "${sheetName}":`, error.message);
      toast.error(`Failed to ${action} ${sheetName}`, { description: error.message });
    } else {
      console.error(`[API] Network error during ${action} "${sheetName}":`, error);
      toast.error(`Network error saving ${sheetName}`, { description: "Check your connection and try again." });
    }
    return { success: false, message: "Network error occurred" };
  }
};

export const callSessionAction = async <T>(
  action: "loginUser" | "logoutUser" | "updateLastActive" | "updateUserRole" | "getOnlineUsers" | "createNotification" | "getNotifications" | "markNotificationRead" | "markAllNotificationsRead",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
): Promise<SessionApiResponse<T>> => {
  if (!SCRIPT_URL) {
    toast.error("Configuration error", { description: "Google Script URL is not configured." });
    throw new Error("NEXT_PUBLIC_GOOGLE_SCRIPT_URL is not set");
  }

  try {
    const response = await safeFetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action, data }),
    });

    const result: SessionApiResponse<T> = await response.json();

    if (result.success && (action === "loginUser" || action === "logoutUser")) {
      invalidateCache("Users");
    }

    if (!result.success) {
      console.error(`[API] Session action "${action}" failed:`, result.message);
    }

    return result;
  } catch (error) {
    if (error instanceof GoogleAppsScriptError) {
      console.error(`[API] Apps Script error during "${action}":`, error.message);
    } else {
      console.error(`[API] Session action "${action}" failed:`, error);
    }
    return { success: false, message: "Network error occurred" };
  }
};
