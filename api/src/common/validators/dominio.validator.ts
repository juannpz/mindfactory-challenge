export const DOMINIO_REGEX = /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/;

/**
 * Validates an Argentine vehicle domain (patente) format.
 * Accepted formats:
 *  - AAA999 (old format)
 *  - AA999AA (new Mercosur format)
 */
export function isValidDominio(dominio: string): boolean {
  return DOMINIO_REGEX.test(dominio);
}
