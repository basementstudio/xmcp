const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/**
 * Formats a date string to "MMM DD.YYYY" format (e.g., "JAN 01.2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month} ${day}.${year}`;
}
