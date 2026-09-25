import { parseNumero, validarNumero, validarEntero } from './validacion';

describe('Utilidades de Validación', () => {
  describe('parseNumero', () => {
    it('convierte string con coma o punto a número válido', () => {
      expect(parseNumero('12,5')).toBe(12.5);
      expect(parseNumero('12.5')).toBe(12.5);
      expect(parseNumero('  100 ')).toBe(100);
    });

    it('retorna NaN para valores inválidos', () => {
      expect(Number.isNaN(parseNumero('abc'))).toBe(true);
      expect(Number.isNaN(parseNumero(''))).toBe(false); // empty string parsed to 0
    });
  });

  describe('validarNumero', () => {
    it('retorna null si es válido', () => {
      expect(validarNumero('10', 0, 20, 'kg')).toBeNull();
      expect(validarNumero('10.5', 10, 20, 'kg')).toBeNull();
    });

    it('retorna mensaje de error si está fuera de rango', () => {
      expect(validarNumero('-5', 0, 100, 'kg')).toBe('Debe estar entre 0 y 100 kg');
      expect(validarNumero('150', 0, 100, 'cm')).toBe('Debe estar entre 0 y 100 cm');
    });

    it('retorna mensaje de error si es NaN', () => {
      expect(validarNumero('abc', 0, 100, 'kg')).toBe('Ingresá un número válido');
    });
  });

  describe('validarEntero', () => {
    it('retorna null para enteros dentro del rango', () => {
      expect(validarEntero('10', 0, 20)).toBeNull();
    });

    it('retorna mensaje de error para decimales', () => {
      expect(validarEntero('10.5', 0, 20)).toBe('Ingresá un número entero válido');
    });
  });
});
