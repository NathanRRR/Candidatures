const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type AttemptRecord = {
  windowStartAt: number;
  failedCount: number;
  blockedUntilAt: number;
};

const attemptsByKey = new Map<string, AttemptRecord>();

/**
 * nginx unconditionally overwrites X-Real-IP with $remote_addr when
 * proxying (see emploi.conf), so unlike X-Forwarded-For this header can't
 * be spoofed by the client to dodge the throttle below.
 */
export function getClientKey(headers: Record<string, string> | undefined): string {
  const value = headers?.["x-real-ip"];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "unknown";
}

function getOrCreateRecord(key: string): AttemptRecord {
  const now = Date.now();
  const existing = attemptsByKey.get(key);

  if (!existing) {
    const created: AttemptRecord = { windowStartAt: now, failedCount: 0, blockedUntilAt: 0 };
    attemptsByKey.set(key, created);
    return created;
  }

  if (existing.blockedUntilAt <= now && now - existing.windowStartAt > FIVE_MINUTES_MS) {
    existing.windowStartAt = now;
    existing.failedCount = 0;
  }

  return existing;
}

export function isLoginBlocked(key: string): boolean {
  const record = getOrCreateRecord(key);
  return record.blockedUntilAt > Date.now();
}

export function registerFailedLoginAttempt(key: string): void {
  const record = getOrCreateRecord(key);
  const now = Date.now();

  if (record.blockedUntilAt > now) {
    return;
  }

  if (now - record.windowStartAt > FIVE_MINUTES_MS) {
    record.windowStartAt = now;
    record.failedCount = 0;
  }

  record.failedCount += 1;

  if (record.failedCount >= MAX_ATTEMPTS) {
    record.blockedUntilAt = now + TWELVE_HOURS_MS;
  }
}

export function clearFailedLoginAttempts(key: string): void {
  attemptsByKey.delete(key);
}
