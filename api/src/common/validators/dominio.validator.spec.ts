import { isValidDominio, DOMINIO_REGEX } from './dominio.validator';

describe('isValidDominio', () => {
  describe('formato AAA999 (viejo)', () => {
    it('debe aceptar ABC123', () => {
      expect(isValidDominio('ABC123')).toBe(true);
    });

    it('debe aceptar ZZZ999', () => {
      expect(isValidDominio('ZZZ999')).toBe(true);
    });

    it('debe aceptar AAA000', () => {
      expect(isValidDominio('AAA000')).toBe(true);
    });
  });

  describe('formato AA999AA (Mercosur)', () => {
    it('debe aceptar AB123CD', () => {
      expect(isValidDominio('AB123CD')).toBe(true);
    });

    it('debe aceptar ZZ999ZZ', () => {
      expect(isValidDominio('ZZ999ZZ')).toBe(true);
    });
  });

  describe('formatos inválidos', () => {
    it('debe rechazar minúsculas', () => {
      expect(isValidDominio('abc123')).toBe(false);
    });

    it('debe rechazar 4 letras + 3 números (formato incorrecto)', () => {
      expect(isValidDominio('ABCD123')).toBe(false);
    });

    it('debe rechazar 2 letras + 3 números + 3 letras', () => {
      expect(isValidDominio('AB123CDE')).toBe(false);
    });

    it('debe rechazar string vacío', () => {
      expect(isValidDominio('')).toBe(false);
    });

    it('debe rechazar solo números', () => {
      expect(isValidDominio('123456')).toBe(false);
    });

    it('debe rechazar solo letras', () => {
      expect(isValidDominio('ABCDEF')).toBe(false);
    });

    it('debe rechazar caracteres especiales', () => {
      expect(isValidDominio('AB-123')).toBe(false);
    });

    it('debe rechazar 2 letras + 4 números', () => {
      expect(isValidDominio('AB1234')).toBe(false);
    });
  });

  describe('regex DOMINIO_REGEX', () => {
    it('debe matchear patente vieja', () => {
      expect(DOMINIO_REGEX.test('ABC123')).toBe(true);
    });

    it('debe matchear patente Mercosur', () => {
      expect(DOMINIO_REGEX.test('AB123CD')).toBe(true);
    });
  });
});
