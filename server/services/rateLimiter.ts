interface RateEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateEntry>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_MESSAGES_PER_WINDOW = 15; // tune based on real usage patterns

export function isRateLimited(phoneNumber: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phoneNumber) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_MESSAGES_PER_WINDOW) {
    rateLimitMap.set(phoneNumber, entry);
    return true;
  }

  entry.timestamps.push(now);
  rateLimitMap.set(phoneNumber, entry);
  return false;
}