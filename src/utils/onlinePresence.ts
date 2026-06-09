/**
 * "Recently active" signal derived from a user's `lastLoginAt` field.
 *
 * This is intentionally NOT real presence - we don't have a WS event
 * for live online state. The 30-minute window is the same threshold
 * ProCard has used since the field landed: long enough that a pro
 * who logged in to apply for a job still reads as "around", short
 * enough that the badge has actual signal.
 *
 * When the backend ships a real `presence` event, swap callers to
 * read from a context value and delete this file; the public API
 * `isRecentlyActive(lastLoginAt)` stays the same.
 */

const RECENT_WINDOW_MS = 1000 * 60 * 30; // 30 minutes

export function isRecentlyActive(lastLoginAt: string | Date | null | undefined): boolean {
  if (!lastLoginAt) return false;
  const ts = typeof lastLoginAt === "string" ? new Date(lastLoginAt).getTime() : lastLoginAt.getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < RECENT_WINDOW_MS;
}
