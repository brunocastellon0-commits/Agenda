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

export interface NuevaConducta {
  nombre: string;
  descripcion?: string | null;
  /** Clave de `PALETTE.categorias` (AvoidanceCard resuelve el color con toLowerCase). */
  categoria: string;
  modalidad: 'evitacion_total' | 'limite';
  frecuencia?: 'diario' | 'semanal' | 'mensual';
  objetivo?: number;
  unidad?: string;
}

/**
 * Alta de una conducta creada por el usuario.
 * No existen conductas por defecto: la única fuente de la pantalla es lo que
 * inserte acá (`origen = 'propia'`). La semilla de ejemplo fue eliminada.
 */
export const crearConducta = async (datos: NuevaConducta): Promise<number> => {
  const db = await getDatabase();
  const esLimite = datos.modalidad === 'limite';

  const result = await db.runAsync(
    `INSERT INTO conducta_evitar
       (nombre, descripcion, categoria, modalidad, frecuencia, objetivo, unidad, activa, fecha_creacion, recordatorio, origen)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0, 'propia')`,
    [
      datos.nombre.trim(),
      datos.descripcion?.trim() || null,
      datos.categoria,
      datos.modalidad,
      esLimite ? datos.frecuencia ?? 'diario' : 'diario',
      esLimite ? datos.objetivo ?? 1 : 0,
      esLimite ? datos.unidad ?? 'comidas' : 'ocurrencias',
      toISODate(new Date()),
    ]
  );

  return result.lastInsertRowId;
};

export const getConductasActivas = async (referencia: Date = new Date()): Promise<ConductaProgreso[]> => {
  const db = await getDatabase();
  // Solo conductas creadas por el usuario. Las filas de ejemplo que aún existan
  // en SQLite (origen = 'ejemplo') quedan intactas pero dejan de renderizarse.
  const conductas = await db.getAllAsync<ConductaEvitar>(
    'SELECT * FROM conducta_evitar WHERE activa = 1 AND origen = ?',
    ['propia']
  );
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

/**
 * Construye la frase de racha de una conducta derivándola de su `nombre`,
 * respetando su semántica y sin migraciones:
 * - `evitacion_total` → 'Llevás 4 días sin fumar' (se quita la partícula inicial
 *   'No ' del nombre para no escribir 'sin no fumar').
 * - `limite` → 'Llevás 2/3 comidas esta semana'.
 */
export const fraseRachaEvitacion = (p: ConductaProgreso): string => {
  const c = p.conducta;

  if (c.modalidad === 'evitacion_total') {
    const accion = c.nombre.replace(/^\s*no\s+/i, '');
    const dias = p.rachaActual;
    return `Llevás ${dias} ${dias === 1 ? 'día' : 'días'} sin ${accion}.`;
  }

  const periodo = c.frecuencia === 'semanal' ? 'esta semana'
    : c.frecuencia === 'mensual' ? 'este mes'
    : 'hoy';
  return `Llevás ${p.eventosPeriodo}/${c.objetivo} ${c.unidad} ${periodo}.`;
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

