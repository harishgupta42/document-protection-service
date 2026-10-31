import "dotenv/config";

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}"`);
  }
  return n;
}

export const config = {
  port: int("PORT", 3001),
  /** Upper bound on upload size, in megabytes. */
  maxUploadMb: int("MAX_UPLOAD_MB", 25),
  /** Length range for generated passwords. */
  passwordMinLength: int("PASSWORD_MIN_LENGTH", 14),
  passwordMaxLength: int("PASSWORD_MAX_LENGTH", 28),
};
