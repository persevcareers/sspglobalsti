import { toast } from "sonner";

type LogLevel = "info" | "success" | "warning" | "error";

interface ToastOptions {
  description?: string;
  duration?: number;
}

function log(level: LogLevel, source: string, message: string, meta?: unknown) {
  const prefix = `[${source}]`;
  switch (level) {
    case "error":
      console.error(prefix, message, meta ?? "");
      break;
    case "warning":
      console.warn(prefix, message, meta ?? "");
      break;
    case "success":
      console.log(prefix, message, meta ?? "");
      break;
    default:
      console.log(prefix, message, meta ?? "");
  }
}

export function showToast(level: "success" | "error", title: string, source: string, opts?: ToastOptions) {
  log(level, source, title, opts?.description);
  if (level === "success") {
    toast.success(title, { description: opts?.description, duration: opts?.duration });
  } else {
    toast.error(title, { description: opts?.description, duration: opts?.duration });
  }
}

export function showError(source: string, title: string, error?: unknown) {
  const desc = error instanceof Error ? error.message : error ? String(error) : undefined;
  log("error", source, title, desc ?? error);
  toast.error(title, { description: desc });
}

export function showSuccess(source: string, title: string, description?: string) {
  log("success", source, title, description);
  toast.success(title, { description });
}
