/**
 * Validates a fabrication date in YYYYMM format.
 *
 *   - Exactly 6 digits.
 *   - Month between 01 and 12.
 *   - Cannot be in the future.
 */
export function isValidFechaFabricacion(fecha: number): boolean {
  const str = String(fecha);
  if (!/^\d{6}$/.test(str)) return false;

  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(4, 6), 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYearMonth = now.getFullYear() * 100 + (now.getMonth() + 1);

  return year * 100 + month <= currentYearMonth;
}
