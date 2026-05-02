type LogLevel = "warn" | "error";

interface ServerErrorLog {
  level: LogLevel;
  message: string;
  error: unknown;
  context?: Record<string, unknown>;
}

function serializeLogValue(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (value instanceof Error) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: serializeLogValue(value.cause, seen),
      ...Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          serializeLogValue(entry, seen),
        ]),
      ),
    };
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeLogValue(entry, seen));
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return { type: Object.prototype.toString.call(value) };
  }

  return Object.fromEntries(
    entries.map(([key, entry]) => [key, serializeLogValue(entry, seen)]),
  );
}

export function logServerError(
  level: LogLevel,
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const log: ServerErrorLog = {
    level,
    message,
    error: serializeLogValue(error),
  };

  if (context) {
    log.context = serializeLogValue(context) as Record<string, unknown>;
  }

  console[level](JSON.stringify(log));
}
