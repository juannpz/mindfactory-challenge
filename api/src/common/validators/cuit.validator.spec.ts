import { isValidCUIT } from './cuit.validator';

describe('isValidCUIT', () => {
  describe('CUITS válidos', () => {
    it('debe validar CUIT de persona física (DV=6)', () => {
      expect(isValidCUIT('20123456786')).toBe(true);
    });

    it('debe validar CUIT de empresa (DV=9)', () => {
      // 3053147117 → sum=101, 101%11=2, DV=11-2=9
      expect(isValidCUIT('30531471179')).toBe(true);
    });

    it('debe validar CUIT con R=0 (DV=0)', () => {
      // 2018000002 → sum=33, 33%11=0 → DV=0
      expect(isValidCUIT('20180000020')).toBe(true);
    });
  });

  describe('CUITS inválidos por formato', () => {
    it('debe rechazar string vacío', () => {
      expect(isValidCUIT('')).toBe(false);
    });
    it('debe rechazar menos de 11 dígitos', () => {
      expect(isValidCUIT('2012345678')).toBe(false);
    });
    it('debe rechazar más de 11 dígitos', () => {
      expect(isValidCUIT('201234567866')).toBe(false);
    });
    it('debe rechazar letras', () => {
      expect(isValidCUIT('20A23456786')).toBe(false);
    });
    it('debe rechazar caracteres especiales', () => {
      expect(isValidCUIT('20123456-86')).toBe(false);
    });
  });

  describe('CUITS inválidos por prefijo', () => {
    it('debe rechazar prefijo 00', () => {
      expect(isValidCUIT('00123456789')).toBe(false);
    });
    it('debe rechazar prefijo 99', () => {
      expect(isValidCUIT('99123456789')).toBe(false);
    });
    it('debe rechazar prefijo 10', () => {
      expect(isValidCUIT('10123456789')).toBe(false);
    });
  });

  describe('CUITS inválidos por dígito verificador', () => {
    it('debe rechazar DV incorrecto', () => {
      // 20123456786 es válido; 20123456780 es DV falso
      expect(isValidCUIT('20123456780')).toBe(false);
    });
  });

  describe('caso especial R=1 → DV=9', () => {
    it('debe asignar DV=9 cuando remainder=1', () => {
      // 3369334823 → sum=166, 166%11=1 → DV=9
      expect(isValidCUIT('33693348239')).toBe(true);
    });
  });

  describe('caso R=0 → DV=0', () => {
    it('debe asignar DV=0 cuando remainder=0', () => {
      // 2018000002 → sum=33, 33%11=0 → DV=0
      expect(isValidCUIT('20180000020')).toBe(true);
    });
  });
});
