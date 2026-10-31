import { randomInt } from "crypto";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = LOWER.toUpperCase();
const DIGITS = "0123456789";
const SPECIAL = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const ALL = LOWER + UPPER + DIGITS + SPECIAL;

const pick = (alphabet: string): string => alphabet[randomInt(alphabet.length)];

/** Fisher-Yates shuffle using a CSPRNG. */
function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Generates a password of random length in [min, max] that contains at least
 * one lower-case letter, one upper-case letter, one digit and one special
 * character. Uses crypto.randomInt, never Math.random.
 */
export function generatePassword(min = 14, max = 28): string {
  if (min < 4 || max < min) {
    throw new Error(`Invalid password length range [${min}, ${max}]`);
  }
  const length = randomInt(min, max + 1);
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  while (chars.length < length) chars.push(pick(ALL));
  return shuffle(chars).join("");
}

/**
 * A caller-supplied password must meet the same policy as a generated one:
 * 14 to 28 characters with lower, upper, digit and special classes present.
 */
export function isAcceptablePassword(password: string, min = 14, max = 28): boolean {
  if (typeof password !== "string") return false;
  if (password.length < min || password.length > max) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password);
  const onlyAllowed = /^[A-Za-z\d!@#$%^&*()\-_=+[\]{}|;:,.<>?]+$/.test(password);
  return hasLower && hasUpper && hasDigit && hasSpecial && onlyAllowed;
}
