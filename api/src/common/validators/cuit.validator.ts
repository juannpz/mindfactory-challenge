/**
 * Validates an Argentine CUIT (Clave Única de Identificación Tributaria).
 *
 * Format: 11 digits, the last being a verifier digit computed via módulo 11.
 *   - Multiply the first 10 digits by the sequence [5,4,3,2,7,6,5,4,3,2].
 *   - Sum the products → S.
 *   - R = S mod 11.
 *   - If R === 0 → dv = 0.
 *   - If R === 1 → dv = 9 (special case for CUITs starting with 30/33/34).
 *   - Otherwise dv = 11 - R.
 */
export function isValidCUIT(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) return false;

  const digits = cuit.split('').map(Number);
  // The type prefix must be 20, 23, 24, 27, 30, 33, or 34
  const prefix = parseInt(cuit.slice(0, 2), 10);
  const validPrefixes = [20, 23, 24, 27, 30, 33, 34];
  if (!validPrefixes.includes(prefix)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 11;
  let expectedDV: number;
  if (remainder === 0) {
    expectedDV = 0;
  } else if (remainder === 1) {
    // Special case: for type prefixes 30, 33, 34 → dv = 9; for 20, 23, 24, 27 → dv = 9 too
    expectedDV = 9;
  } else {
    expectedDV = 11 - remainder;
  }

  return digits[10] === expectedDV;
}
