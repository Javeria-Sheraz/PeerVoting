// Class roster + registration rules shared across the app.

export const ROLL_EMAIL_REGEX = /^2024mc([1-9]|[1-3][0-9]|40)@student\.uet\.edu\.pk$/;

/** Full class roster, e.g. ["2024mc1", "2024mc2", ..., "2024mc40"] */
export const CLASS_ROSTER: string[] = Array.from({ length: 40 }, (_, i) => `2024mc${i + 1}`);

export function extractRollNumber(email: string): string | null {
  const match = ROLL_EMAIL_REGEX.exec(email.trim().toLowerCase());
  if (!match) return null;
  return `2024mc${match[1]}`;
}

export function isValidStudentEmail(email: string): boolean {
  return ROLL_EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Expired";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
