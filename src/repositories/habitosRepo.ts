import { getDatabase } from '../database/db';
import { ReglaRecurrencia } from './actividadRepo';
import { calcularRachaDiariaPositiva, calcularRachaSemanalPositiva } from '../utils/rachas';

export interface SeguimientoHabito {
  id?: number;
  regla_recurrencia_id: number;
  fecha_creacion: string;
  activo: number;
}

export interface HabitoDetalle {
  id: number;
  regla_recurrencia_id: number;
  fecha_creacion: string;
  activo: number;
  titulo: string;
  tipo_actividad_nombre: string;
  tipo_actividad_color: string;
  tipo_actividad_emoji: string | null;
  dias_semana: string | null;
  dia_inicio: number | null;
  dia_fin: number | null;
  patron: string;
  repeticion_numero: number | null;
  repeticion_unidad: string | null;
}

export interface HabitoProgreso {
  detalle: HabitoDetalle;
  frecuencia: 'diario' | 'semanal';
  objetivoSemanal: number;
  completadosSemana: number;
  rachaActual: number;
  mejorRacha: number;
  historialReciente: { fecha: string; completado: boolean }[]; // Últimos 7 días
  completadoHoy: boolean;
  completadoAyer: boolean;
}

export const getHabitosActivos = async (): Promise<HabitoProgreso[]> => {
  const db = await getDatabase();
  
  // Obtener seguimientos con detalles de la regla
  const seguimientos = await db.getAllAsync<HabitoDetalle>(
    `SELECT 
       s.id, s.regla_recurrencia_id, s.fecha_creacion, s.activo,
       r.titulo, r.dias_semana, r.dia_inicio, r.dia_fin, r.patron,
       r.repeticion_numero, r.repeticion_unidad,
       t.nombre as tipo_actividad_nombre, t.color as tipo_actividad_color, t.emoji as tipo_actividad_emoji
     FROM seguimiento_habito s
     JOIN regla_recurrencia r ON s.regla_recurrencia_id = r.id
     JOIN tipo_actividad t ON r.tipo_actividad_id = t.id
     WHERE s.activo = 1`
  );

  const progresos: HabitoProgreso[] = [];

  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  
  // Rango de la semana actual (lunes a domingo)
  const lunesOffset = (hoy.getDay() + 6) % 7;
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - lunesOffset);
  const domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);
  
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const inicioSemanaIso = toISO(lunes);
  const finSemanaIso = toISO(domingo);
  const hoyIso = toISO(hoy);
  const ayerIso = toISO(ayer);

  // 7 días atrás para historial
  const historialDias: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
    historialDias.push(toISO(d));
  }

  for (const hab of seguimientos) {
    // 1. Determinar el objetivo semanal
    let objetivoSemanal = 0;
    let frecuencia: 'diario' | 'semanal' = 'semanal';

    if (hab.dia_inicio != null && hab.dia_fin != null) {
      // Calcular días en el rango
      if (hab.dia_inicio <= hab.dia_fin) {
        objetivoSemanal = hab.dia_fin - hab.dia_inicio + 1;
      } else {
        objetivoSemanal = (7 - hab.dia_inicio + 1) + hab.dia_fin;
      }
    } else if (hab.dias_semana) {
      objetivoSemanal = hab.dias_semana.split(',').length;
    } else if (hab.patron === 'diario') {
      objetivoSemanal = 7;
    } else if (hab.patron === 'semanal') {
      objetivoSemanal = hab.repeticion_numero || 1;
    } else {
      objetivoSemanal = 1; // Fallback
    }

    if (objetivoSemanal === 7) {
      frecuencia = 'diario';
    }

    // 2. Progreso de la semana
    const actsSemana = await db.getAllAsync<{ fecha: string; completado: number; eliminada: number }>(
      `SELECT fecha, completado, eliminada FROM actividad 
       WHERE regla_recurrencia_id = ? AND fecha BETWEEN ? AND ?`,
      [hab.regla_recurrencia_id, inicioSemanaIso, finSemanaIso]
    );

    const completadosSemana = actsSemana.filter(a => a.completado === 1 && (a.eliminada === 0 || a.eliminada === null)).length;

    // 3. Historial reciente
    const actsHistorial = await db.getAllAsync<{ fecha: string; completado: number; eliminada: number }>(
      `SELECT fecha, completado, eliminada FROM actividad 
       WHERE regla_recurrencia_id = ? AND fecha >= ? AND fecha <= ?`,
      [hab.regla_recurrencia_id, historialDias[0], hoyIso]
    );

    const mapActs = new Map();
    actsHistorial.forEach(a => {
      if (a.eliminada === 0 || a.eliminada === null) {
        mapActs.set(a.fecha, a.completado === 1);
      }
    });

    const historialReciente = historialDias.map(fecha => {
      // Si no existe instancia, lo contamos como no completado
      // Pero para la UI, podríamos diferenciar "no había" vs "falló". Lo mantendremos simple por ahora.
      return {
        fecha,
        completado: mapActs.get(fecha) || false
      };
    });

    const completadoHoy = mapActs.get(hoyIso) || false;
    const completadoAyer = mapActs.get(ayerIso) || false;

    // 4. Calcular Racha Histórica
    const allActs = await db.getAllAsync<{ fecha: string; completado: number; eliminada: number }>(
      `SELECT fecha, completado, eliminada FROM actividad 
       WHERE regla_recurrencia_id = ? AND (eliminada = 0 OR eliminada IS NULL)
       ORDER BY fecha DESC`,
      [hab.regla_recurrencia_id]
    );

    let rachaActual = 0;
    let mejorRacha = 0;

    if (frecuencia === 'diario') {
      const fechasCompletadas = allActs.filter(a => a.completado === 1).map(a => a.fecha);
      const stats = calcularRachaDiariaPositiva(fechasCompletadas, hoy);
      rachaActual = stats.rachaActual;
      mejorRacha = stats.mejorRacha;
    } else {
      const semanasStats = new Map<string, number>();
      
      allActs.forEach(a => {
        if (a.completado === 1) {
          const d = new Date(a.fecha + 'T00:00:00');
          const loff = (d.getDay() + 6) % 7;
          const lDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() - loff);
          const weekKey = toISO(lDate);
          semanasStats.set(weekKey, (semanasStats.get(weekKey) || 0) + 1);
        }
      });

      const semanasCumplidas = Array.from(semanasStats.entries())
        .filter(([wk, count]) => count >= objetivoSemanal)
        .map(([wk]) => wk);

      const stats = calcularRachaSemanalPositiva(semanasCumplidas, hoy);
      rachaActual = stats.rachaActual;
      mejorRacha = stats.mejorRacha;
    }

    progresos.push({
      detalle: hab,
      frecuencia,
      objetivoSemanal,
      completadosSemana,
      rachaActual,
      mejorRacha,
      historialReciente,
      completadoHoy,
      completadoAyer
    });
  }

  return progresos;
};

export const seguirActividad = async (regla_recurrencia_id: number): Promise<void> => {
  const db = await getDatabase();
  const hoyIso = new Date().toISOString().split('T')[0];
  await db.runAsync(
    `INSERT OR IGNORE INTO seguimiento_habito (regla_recurrencia_id, fecha_creacion, activo)
     VALUES (?, ?, 1)`,
    [regla_recurrencia_id, hoyIso]
  );
  // Si ya existía pero estaba inactivo, reactivar
  await db.runAsync(
    `UPDATE seguimiento_habito SET activo = 1 WHERE regla_recurrencia_id = ?`,
    [regla_recurrencia_id]
  );
};

export const dejarDeSeguirActividad = async (regla_recurrencia_id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE seguimiento_habito SET activo = 0 WHERE regla_recurrencia_id = ?`,
    [regla_recurrencia_id]
  );
};

export const getActividadesSeguibles = async (): Promise<any[]> => {
  const db = await getDatabase();
  // Retorna reglas recurrentes que no están siendo seguidas actualmente
  return db.getAllAsync(
    `SELECT r.*, t.nombre as tipo_nombre, t.color as tipo_color, t.emoji as tipo_emoji
     FROM regla_recurrencia r
     JOIN tipo_actividad t ON r.tipo_actividad_id = t.id
     LEFT JOIN seguimiento_habito s ON r.id = s.regla_recurrencia_id AND s.activo = 1
     WHERE r.activa = 1 AND s.id IS NULL
     ORDER BY r.titulo`
  );
};
