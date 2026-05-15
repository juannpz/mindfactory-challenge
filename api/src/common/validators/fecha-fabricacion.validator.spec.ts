import { isValidFechaFabricacion } from './fecha-fabricacion.validator';

describe('isValidFechaFabricacion', () => {
  describe('fechas válidas', () => {
    it('debe aceptar enero de 2020', () => {
      expect(isValidFechaFabricacion(202001)).toBe(true);
    });

    it('debe aceptar diciembre de 1999', () => {
      expect(isValidFechaFabricacion(199912)).toBe(true);
    });

    it('debe aceptar el límite inferior', () => {
      expect(isValidFechaFabricacion(190001)).toBe(true);
    });

    it('debe aceptar mes actual del año actual', () => {
      const now = new Date();
      const current = now.getFullYear() * 100 + (now.getMonth() + 1);
      expect(isValidFechaFabricacion(current)).toBe(true);
    });
  });

  describe('formato inválido', () => {
    it('debe rechazar 5 dígitos', () => {
      expect(isValidFechaFabricacion(20201)).toBe(false);
    });

    it('debe rechazar 7 dígitos', () => {
      expect(isValidFechaFabricacion(2020010)).toBe(false);
    });

    it('debe rechazar número negativo', () => {
      expect(isValidFechaFabricacion(-202001)).toBe(false);
    });
  });

  describe('mes inválido', () => {
    it('debe rechazar mes 00', () => {
      expect(isValidFechaFabricacion(202000)).toBe(false);
    });

    it('debe rechazar mes 13', () => {
      expect(isValidFechaFabricacion(202013)).toBe(false);
    });

    it('debe rechazar mes 99', () => {
      expect(isValidFechaFabricacion(202099)).toBe(false);
    });
  });

  describe('fecha futura', () => {
    it('debe rechazar año 2999', () => {
      expect(isValidFechaFabricacion(299901)).toBe(false);
    });

    it('debe rechazar próximo año', () => {
      const nextYear = new Date().getFullYear() + 1;
      expect(isValidFechaFabricacion(nextYear * 100 + 1)).toBe(false);
    });

    it('debe rechazar mes próximo del año actual', () => {
      const now = new Date();
      const nextMonth = now.getMonth() + 2; // getMonth() es 0-based
      const ym = now.getFullYear() * 100 + nextMonth;
      if (nextMonth <= 12) {
        expect(isValidFechaFabricacion(ym)).toBe(false);
      }
    });
  });

  describe('borde: año 1900', () => {
    it('debe aceptar 190001', () => {
      expect(isValidFechaFabricacion(190001)).toBe(true);
    });
  });
});
