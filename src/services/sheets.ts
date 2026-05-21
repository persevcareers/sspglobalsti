"use client";

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || "";

async function request<T>(
  action: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const url = method === "GET"
    ? `${APPS_SCRIPT_URL}?action=${action}`
    : APPS_SCRIPT_URL;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-secret": API_SECRET,
    },
  };

  if (method === "POST" && body) {
    options.body = JSON.stringify({ action, ...body });
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (parseError) {
    console.error(
      `[sheetsService] Failed to parse JSON response from Google Sheets for action "${action}". ` +
      `Raw response starts with:`, 
      text.substring(0, 300)
    );
    throw new Error("Failed to parse API response. Please check Google Web App deployment.");
  }
}

export const sheetsService = {
  students: {
    getAll: () => request<{ success: boolean; data: any[] }>("getStudents"),
    getById: (id: string) => request<{ success: boolean; data: any[] }>("getStudents", "POST", { id }),
    create: (data: any) => request<{ success: boolean; id?: string }>("addStudent", "POST", { data }),
    update: (id: string, data: any) => request<{ success: boolean }>("updateStudent", "POST", { id, data }),
    delete: (id: string) => request<{ success: boolean }>("deleteStudent", "POST", { id }),
  },
  courses: {
    getAll: () => request<{ success: boolean; data: any[] }>("getCourses"),
    create: (data: any) => request<{ success: boolean; id?: string }>("addCourse", "POST", { data }),
    update: (id: string, data: any) => request<{ success: boolean }>("updateCourse", "POST", { id, data }),
    delete: (id: string) => request<{ success: boolean }>("deleteCourse", "POST", { id }),
  },
  schedules: {
    getAll: () => request<{ success: boolean; data: any[] }>("getSchedules"),
    create: (data: any) => request<{ success: boolean; id?: string }>("addSchedule", "POST", { data }),
    update: (id: string, data: any) => request<{ success: boolean }>("updateSchedule", "POST", { id, data }),
    delete: (id: string) => request<{ success: boolean }>("deleteSchedule", "POST", { id }),
  },
  leads: {
    getAll: () => request<{ success: boolean; data: any[] }>("getLeads"),
    create: (data: any) => request<{ success: boolean; id?: string }>("addLead", "POST", { data }),
    update: (id: string, data: any) => request<{ success: boolean }>("updateLead", "POST", { id, data }),
    delete: (id: string) => request<{ success: boolean }>("deleteLead", "POST", { id }),
  },
  trainers: {
    getAll: () => request<{ success: boolean; data: any[] }>("getTrainers"),
    create: (data: any) => request<{ success: boolean; id?: string }>("addTrainer", "POST", { data }),
    update: (id: string, data: any) => request<{ success: boolean }>("updateTrainer", "POST", { id, data }),
    delete: (id: string) => request<{ success: boolean }>("deleteTrainer", "POST", { id }),
  },
  batches: {
    getAll: () => request<{ success: boolean; data: any[] }>("getBatches"),
    create: (data: any) => request<{ success: boolean; id?: string }>("addBatch", "POST", { data }),
    update: (id: string, data: any) => request<{ success: boolean }>("updateBatch", "POST", { id, data }),
    delete: (id: string) => request<{ success: boolean }>("deleteBatch", "POST", { id }),
  },
  analytics: {
    getAll: () => request<{ success: boolean; data: any[] }>("getAnalytics"),
  },
};
