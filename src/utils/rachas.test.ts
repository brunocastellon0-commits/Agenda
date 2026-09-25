import { calcularRachaDiariaPositiva, calcularRachaSemanalPositiva, calcularRachaEvitacionTotal } from './rachas';

describe('Utilidades de Rachas', () => {
  describe('calcularRachaDiariaPositiva', () => {
    it('debería calcular la racha actual y mejor racha correctamente', () => {
      // Supongamos referencia: 2023-10-10
      const ref = new Date('2023-10-10T12:00:00');
      const fechas = [
        '2023-10-06',
        '2023-10-07',
        '2023-10-08',
        '2023-10-09',
        // '2023-10-10' (hoy no completado)
      ];

      const { rachaActual, mejorRacha } = calcularRachaDiariaPositiva(fechas, ref);
      
      // La racha actual cuenta ayer hacia atrás
      expect(rachaActual).toBe(4); 
      // La mejor racha en este caso también es 4
      expect(mejorRacha).toBe(4);
    });

    it('debería resetear la racha actual si ayer tampoco se completó', () => {
      const ref = new Date('2023-10-10T12:00:00');
      const fechas = [
        '2023-10-06',
        '2023-10-07',
        '2023-10-08',
      ]; // falta el 9 y el 10

      const { rachaActual, mejorRacha } = calcularRachaDiariaPositiva(fechas, ref);
      
      expect(rachaActual).toBe(0); 
      expect(mejorRacha).toBe(3);
    });
  });

  describe('calcularRachaEvitacionTotal', () => {
    it('debería contar días consecutivos sin eventos desde el inicio si no hay eventos', () => {
      const ref = new Date('2023-10-10T12:00:00');
      const inicio = '2023-10-01'; // 10 días de racha
      const eventos: string[] = [];

      const { rachaActual, mejorRacha } = calcularRachaEvitacionTotal(inicio, eventos, ref);
      expect(rachaActual).toBe(10);
      expect(mejorRacha).toBe(10);
    });

    it('debería resetear la racha a 0 si hubo evento hoy', () => {
      const ref = new Date('2023-10-10T12:00:00');
      const inicio = '2023-10-01'; 
      const eventos = ['2023-10-10'];

      const { rachaActual, mejorRacha } = calcularRachaEvitacionTotal(inicio, eventos, ref);
      expect(rachaActual).toBe(0);
      expect(mejorRacha).toBe(9); // del 1 al 9 son 9 días limpios
    });

    it('debería calcular la mejor racha entre múltiples eventos', () => {
      const ref = new Date('2023-10-20T12:00:00');
      const inicio = '2023-10-01'; 
      const eventos = [
        '2023-10-05', // del 1 al 4 (4 días)
        '2023-10-15', // del 6 al 14 (9 días)
      ]; // del 16 al 20 (5 días)

      const { rachaActual, mejorRacha } = calcularRachaEvitacionTotal(inicio, eventos, ref);
      expect(rachaActual).toBe(5);
      expect(mejorRacha).toBe(9);
    });
  });
});
