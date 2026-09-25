import { cantidadAUnidadBase, calcularNutricion, sumarNutricion, formatEstimado } from './nutricion';

describe('Utilidades de Nutrición', () => {
  describe('cantidadAUnidadBase', () => {
    it('debería retornar el mismo valor para gramos o mililitros', () => {
      expect(cantidadAUnidadBase(150, 'g')).toBe(150);
      expect(cantidadAUnidadBase(200, 'ml')).toBe(200);
    });

    it('debería usar gramosPorUnidad si se proporciona para "unidad"', () => {
      expect(cantidadAUnidadBase(2, 'unidad', 50)).toBe(100);
    });

    it('debería caer en las constantes base para otras medidas', () => {
      expect(cantidadAUnidadBase(1, 'taza')).toBe(240);
      expect(cantidadAUnidadBase(2, 'cucharada')).toBe(30);
      expect(cantidadAUnidadBase(1, 'plato_normal')).toBe(400);
    });
  });

  describe('calcularNutricion', () => {
    it('debería calcular macros proporcionalmente', () => {
      const valores100 = { kcal: 200, prot: 10, carb: 20, grasa: 5 };
      // 50g -> factor 0.5
      const res = calcularNutricion(50, 'g', valores100);
      expect(res.kcal).toBe(100);
      expect(res.prot).toBe(5);
      expect(res.carb).toBe(10);
      expect(res.grasa).toBe(2.5);
    });

    it('debería redondear kcal al entero más cercano y otros a 1 decimal', () => {
      const valores100 = { kcal: 153, prot: 3.33, carb: 11.11, grasa: 1.11 };
      // factor = 1.3
      const res = calcularNutricion(130, 'g', valores100);
      expect(res.kcal).toBe(199); // 153 * 1.3 = 198.9 -> 199
      expect(res.prot).toBe(4.3); // 3.33 * 1.3 = 4.329 -> 4.3
      expect(res.carb).toBe(14.4); // 11.11 * 1.3 = 14.443 -> 14.4
      expect(res.grasa).toBe(1.4); // 1.11 * 1.3 = 1.443 -> 1.4
    });
  });

  describe('sumarNutricion', () => {
    it('debería sumar todos los campos de una lista', () => {
      const item1 = { kcal: 100, prot: 10, carb: 10, grasa: 5, fibra: 2 };
      const item2 = { kcal: 50, prot: 5, carb: 5, grasa: 2.5 };
      const total = sumarNutricion([item1, item2]);

      expect(total.kcal).toBe(150);
      expect(total.prot).toBe(15);
      expect(total.carb).toBe(15);
      expect(total.grasa).toBe(7.5);
      expect(total.fibra).toBe(2);
    });
  });

  describe('formatEstimado', () => {
    it('debería retornar el formato correcto redondeado sin decimales con ~', () => {
      expect(formatEstimado(10.6, 'g')).toBe('~11g');
      expect(formatEstimado(0.4)).toBe('~0');
      expect(formatEstimado(15.5)).toBe('~16');
    });
  });
});
