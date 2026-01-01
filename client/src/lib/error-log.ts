export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  detail?: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

const MAX_ENTRIES = 200;
const listeners = new Set<(entries: LogEntry[]) => void>();
const entries: LogEntry[] = [];

const notify = () => {
  const snapshot = [...entries];
  listeners.forEach((listener) => listener(snapshot));
};

const formatDetail = (detail?: unknown) => {
  if (!detail) return undefined;
  if (detail instanceof Error) {
    return detail.stack || detail.message;
  }
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
};

const pushEntry = (level: LogLevel, message: string, detail?: unknown, context?: Record<string, unknown>) => {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
    detail: formatDetail(detail),
    context,
    timestamp: Date.now(),
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(MAX_ENTRIES);
  }
  if (level === "error") {
    console.error(`[Hyperscale] ${message}`, detail ?? context ?? "");
  } else if (level === "warn") {
    console.warn(`[Hyperscale] ${message}`, detail ?? context ?? "");
  } else {
    console.info(`[Hyperscale] ${message}`, detail ?? context ?? "");
  }
  notify();
};

export const logInfo = (message: string, detail?: unknown, context?: Record<string, unknown>) =>
  pushEntry("info", message, detail, context);

export const logWarning = (message: string, detail?: unknown, context?: Record<string, unknown>) =>
  pushEntry("warn", message, detail, context);

export const logError = (message: string, detail?: unknown, context?: Record<string, unknown>) =>
  pushEntry("error", message, detail, context);

export const getLogEntries = () => [...entries];

export const subscribeToLogEntries = (listener: (entries: LogEntry[]) => void) => {
  listeners.add(listener);
  listener([...entries]);
  return () => listeners.delete(listener);
};

export const exportLogEntries = () => {
  return entries
    .map((entry) => {
      const time = new Date(entry.timestamp).toISOString();
      const detail = entry.detail ? `\nDetail: ${entry.detail}` : "";
      const context = entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : "";
      return `[${time}] ${entry.level.toUpperCase()} - ${entry.message}${detail}${context}`;
    })
    .join("\n\n");
};
