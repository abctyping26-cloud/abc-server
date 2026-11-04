import { randomBytes } from "crypto";

// Crockford Base32: 32 symbols excluding I, L, O, U to prevent misreads
export const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
// Mod-37 check alphabet provides an extra 5 characters for modulo 37 residue
export const CHECK_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ*~$=U";

/**
 * Calculates a Mod-37 check character for a given Crockford Base32 body
 */
export function calculateCheckChar(body: string): string {
  let sum = 0;
  const upper = body.toUpperCase();
  for (const c of upper) {
    const idx = CROCKFORD_ALPHABET.indexOf(c);
    if (idx !== -1) {
      sum = (sum * 32 + idx) % 37;
    }
  }
  return CHECK_ALPHABET[sum];
}

/**
 * Generates an 8-character Crockford Base32 code + 1 check character (9 chars total)
 * Example output: "7K2M9QXT4"
 */
export function generatePatientCode(): string {
  const bytes = randomBytes(8);
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += CROCKFORD_ALPHABET[bytes[i] % 32];
  }
  return body + calculateCheckChar(body);
}

/**
 * Validates whether a patient code has a valid Mod-37 check character
 */
export function validatePatientCode(code: string): boolean {
  if (!code || code.length < 2) return false;
  const upper = code.trim().toUpperCase();
  const body = upper.slice(0, -1);
  const expectedCheck = calculateCheckChar(body);
  const actualCheck = upper.slice(-1);
  return expectedCheck === actualCheck;
}
