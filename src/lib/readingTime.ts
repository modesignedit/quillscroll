export function getReadingTimeMinutes(text?: string | null, wordsPerMinute = 220): number {
  if (!text) return 1;

  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) return 1;

  return Math.max(1, Math.round(words / wordsPerMinute));
}
