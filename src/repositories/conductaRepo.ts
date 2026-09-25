import { getDatabase } from '../database/db';
import { calcularRachaEvitacionTotal } from '../utils/rachas';
import { toISODate } from '../utils/semana';

export interface ConductaEvitar {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  modalidad: 'evitacion_total' | 'limite';
  frecuencia: 'diario' | 'semanal' | 'mensual';
  objetivo: number;
  unidad: string;
  activa: number;
  fecha_creacion: string;
  recordatorio: number;
  origen: 'propia' | 'ejemplo';
}

export interface ConductaProgreso {
  conducta: ConductaEvitar;
  rachaActual: number;
  mejorRacha: number;
  ultimaOcurrencia: string | null;
  eventosPeriodo: number; // esta semana o este mes según frecuencia
}

export const asegurarConductasIniciales = async (): Promise<void> => {
  const db = await getDatabase();
  const countRes = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM conducta_evitar');
  
  if (countRes && countRes.count === 0) {
    const hoyIso = toISODate(new Date());
    await db.runAsync(
      `INSERT INTO conducta_evitar (nombre, descripcion, categoria, modalidad, frecuencia, objetivo, unidad, activa, fecha_creacion, origen) VALUES
       ('No fumar', 'Evitar cigarrillos', 'Salud', 'evitacion_total', 'diario', 0, 'ocurrencias', 1, ?, 'ejemplo'),
       ('Comida rápida', 'Reducir el consumo de comida rápida', 'Alimentación', 'limite', 'semanal', 2, 'comidas', 1, ?, 'ejemplo'),
       ('Redes sociales', 'Limitar el tiempo en Instagram/TikTok', 'Tecnología', 'limite', 'diario', 90, 'minutos', 1, ?, 'ejemplo')`,
      [hoyIso, hoyIso, hoyIso]
    );
  }
};

export const getConductasActivas = async (referencia: Date = new Date()): Promise<ConductaProgreso[]> => {
  const db = await getDatabase();
  const conductas = await db.getAllAsync<ConductaEvitar>('SELECT * FROM conducta_evitar WHERE activa = 1');
  const progresos: ConductaProgreso[] = [];
  
  for (const c of conductas) {
    const eventos = await db.getAllAsync<{ fecha: string, cantidad: number }>(
      'SELECT fecha, cantidad FROM conducta_evento WHERE conducta_id = ? ORDER BY fecha DESC',
      [c.id]
    );
    
    let rachaActual = 0;
    let mejorRacha = 0;
    let ultimaOcurrencia: string | null = null;
    let eventosPeriodo = 0;

    if (eventos.length > 0) {
      ultimaOcurrencia = eventos[0].fecha;
    }

    if (c.modalidad === 'evitacion_total') {
      const fechas = eventos.map(e => e.fecha);
      const rachaStats = calcularRachaEvitacionTotal(c.fecha_creacion, fechas, referencia);
      rachaActual = rachaStats.rachaActual;
      mejorRacha = rachaStats.mejorRacha;
    } else {
      // Cálculo de límite
      const refIso = toISODate(referencia);
      let fechaInicio = refIso;
      
      if (c.frecuencia === 'semanal') {
        const d = new Date(referencia);
        const loff = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - loff);
        fechaInicio = toISODate(d);
      } else if (c.frecuencia === 'mensual') {
        const d = new Date(referencia);
        d.setDate(1);
        fechaInicio = toISODate(d);
      }
      
      const evtPeriodo = eventos.filter(e => e.fecha >= fechaInicio && e.fecha <= refIso);
      eventosPeriodo = evtPeriodo.reduce((acc, e) => acc + e.cantidad, 0);
    }

    progresos.push({
      conducta: c,
      rachaActual,
      mejorRacha,
      ultimaOcurrencia,
      eventosPeriodo
    });
  }
  
  return progresos;
};

export const registrarEventoConducta = async (
  conducta_id: number,
  fecha: string,
  hora: string,
  cantidad: number,
  unidad: string,
  nota: string
) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO conducta_evento (conducta_id, fecha, hora, cantidad, unidad, nota)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conducta_id, fecha, hora, cantidad, unidad, nota]
  );
};

export const desactivarConducta = async (conducta_id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE conducta_evitar SET activa = 0 WHERE id = ?`,
    [conducta_id]
  );
};

