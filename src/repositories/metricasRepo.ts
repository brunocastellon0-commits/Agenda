import { getDatabase } from '../database/db';

// ─── Tipos ──────────────────────────────────────────────────

export type PeriodoMetricas = 'hoy' | 'semana' | 'mes';

export interface RangoFechas {
  inicio: string; // YYYY-MM-DD
  fin: string;    // YYYY-MM-DD
}

export interface ResumenGeneral {
  totalPlanificadas: number;
  completadas: number;
  reprogramadas: number;
  canceladas: number;
  noRealizadas: number;
  cumplimientoPct: number | null;
  horasRegistradas: number | null;
  horasPlanificadas: number | null;
  diasActivos: number;
  totalReprogramaciones: number; // eventos de reprogramación del historial
}

export interface DistribucionArea {
  tipo_actividad_id: number;
  nombre: string;
  color: string;
  emoji: string | null;
  tiempoRealMin: number;
  tiempoPlanificadoMin: number;
  actividades: number;
  completadas: number;
}

export interface MetricaConsistencia {
  rachaActual: number;
  rachaMaxima: number;
}

export interface ComparativaPeriodo {
  actual: ResumenGeneral;
  anterior: ResumenGeneral | null;
  deltaCumplimiento: number | null;
  deltaHoras: number | null;
  deltaActividades: number | null;
  sinDatosAnteriores: boolean;
}

export interface Insight {
  tipo: 'info' | 'tendencia_positiva' | 'tendencia_negativa' | 'patron';
  mensaje: string;
}

// ─── Utilidades de Fechas ───────────────────────────────────

export function calcularRango(periodo: PeriodoMetricas, fechaRef?: Date): RangoFechas {
  const ref = fechaRef ?? new Date();
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  switch (periodo) {
    case 'hoy':
      return { inicio: toISO(ref), fin: toISO(ref) };

    case 'semana': {
      const lunesOffset = (ref.getDay() + 6) % 7;
      const lunes = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - lunesOffset);
      const domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);
      return { inicio: toISO(lunes), fin: toISO(domingo) };
    }

    case 'mes': {
      const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const fin = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      return { inicio: toISO(inicio), fin: toISO(fin) };
    }
  }
}

export function calcularRangoAnterior(periodo: PeriodoMetricas, fechaRef?: Date): RangoFechas {
  const ref = fechaRef ?? new Date();

  switch (periodo) {
    case 'hoy': {
      const ayer = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1);
      return calcularRango('hoy', ayer);
    }
    case 'semana': {
      const semanaAnterior = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 7);
      return calcularRango('semana', semanaAnterior);
    }
    case 'mes': {
      const mesAnterior = new Date(ref.getFullYear(), ref.getMonth() - 1, 15);
      return calcularRango('mes', mesAnterior);
    }
  }
}

// ─── Resumen General ────────────────────────────────────────

/**
 * Calcula el resumen de métricas para un rango de fechas.
 *
 * Compromisos Planificados Originales = actividades donde instancia_origen_id IS NULL
 * (evita inflar la cuenta con instancias derivadas de reprogramaciones).
 */
export async function getResumenGeneral(rango: RangoFechas): Promise<ResumenGeneral> {
  const db = await getDatabase();

  // Conteos por estado (solo compromisos originales, no instancias derivadas de reprogramación)
  const conteos = await db.getFirstAsync<{
    total: number;
    completadas: number;
    reprogramadas: number;
    canceladas: number;
    no_realizadas: number;
  }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN estado_ejecucion = 'completada' THEN 1 ELSE 0 END) AS completadas,
       SUM(CASE WHEN estado_planificacion = 'reprogramada' THEN 1 ELSE 0 END) AS reprogramadas,
       SUM(CASE WHEN estado_planificacion = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
       SUM(CASE WHEN estado_ejecucion = 'no_realizada' AND estado_planificacion != 'cancelada' THEN 1 ELSE 0 END) AS no_realizadas
     FROM actividad
     WHERE fecha BETWEEN ? AND ?
       AND instancia_origen_id IS NULL`,
    [rango.inicio, rango.fin]
  );

  // También contar completadas de instancias derivadas (reprogramadas que sí se hicieron)
  const derivadasCompletadas = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM actividad
     WHERE fecha BETWEEN ? AND ?
       AND instancia_origen_id IS NOT NULL
       AND estado_ejecucion = 'completada'`,
    [rango.inicio, rango.fin]
  );

  const totalPlanificadas = conteos?.total ?? 0;
  const completadasOriginal = conteos?.completadas ?? 0;
  const completadasDerivadas = derivadasCompletadas?.cnt ?? 0;
  const completadasTotal = completadasOriginal + completadasDerivadas;
  const reprogramadas = conteos?.reprogramadas ?? 0;
  const canceladas = conteos?.canceladas ?? 0;
  const noRealizadas = conteos?.no_realizadas ?? 0;

  // Cumplimiento basado en compromisos originales
  const cumplimientoPct = totalPlanificadas > 0
    ? Math.round((completadasTotal / totalPlanificadas) * 100)
    : null;

  // Tiempo
  const tiempoReal = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(duracion_real_min) AS total FROM actividad
     WHERE fecha BETWEEN ? AND ? AND duracion_real_min IS NOT NULL`,
    [rango.inicio, rango.fin]
  );
  const tiempoPlanificado = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(duracion_estimada_min) AS total FROM actividad
     WHERE fecha BETWEEN ? AND ? AND duracion_estimada_min IS NOT NULL`,
    [rango.inicio, rango.fin]
  );

  // Días activos
  const diasActivos = await db.getFirstAsync<{ dias: number }>(
    `SELECT COUNT(DISTINCT fecha) AS dias FROM actividad
     WHERE fecha BETWEEN ? AND ? AND estado_ejecucion = 'completada'`,
    [rango.inicio, rango.fin]
  );

  // Total reprogramaciones del historial
  const totalReprog = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM actividad_historial_estado h
     JOIN actividad a ON h.actividad_id = a.id
     WHERE a.fecha BETWEEN ? AND ?
       AND h.estado_planificacion_nuevo = 'reprogramada'`,
    [rango.inicio, rango.fin]
  );

  const horasReal = tiempoReal?.total != null ? Math.round((tiempoReal.total / 60) * 10) / 10 : null;
  const horasPlan = tiempoPlanificado?.total != null ? Math.round((tiempoPlanificado.total / 60) * 10) / 10 : null;

  return {
    totalPlanificadas,
    completadas: completadasTotal,
    reprogramadas,
    canceladas,
    noRealizadas,
    cumplimientoPct,
    horasRegistradas: horasReal,
    horasPlanificadas: horasPlan,
    diasActivos: diasActivos?.dias ?? 0,
    totalReprogramaciones: totalReprog?.cnt ?? 0,
  };
}

// ─── Distribución por Área ──────────────────────────────────

export async function getDistribucionPorArea(rango: RangoFechas): Promise<DistribucionArea[]> {
  const db = await getDatabase();
  return db.getAllAsync<DistribucionArea>(
    `SELECT
       t.id AS tipo_actividad_id,
       t.nombre,
       t.color,
       t.emoji,
       COALESCE(SUM(a.duracion_real_min), 0) AS tiempoRealMin,
       COALESCE(SUM(a.duracion_estimada_min), 0) AS tiempoPlanificadoMin,
       COUNT(a.id) AS actividades,
       SUM(CASE WHEN a.estado_ejecucion = 'completada' THEN 1 ELSE 0 END) AS completadas
     FROM tipo_actividad t
     LEFT JOIN actividad a ON a.tipo_actividad_id = t.id
       AND a.fecha BETWEEN ? AND ?
     GROUP BY t.id
     HAVING actividades > 0
     ORDER BY tiempoRealMin DESC`,
    [rango.inicio, rango.fin]
  );
}

// ─── Consistencia (Rachas) ──────────────────────────────────

export async function getConsistencia(): Promise<MetricaConsistencia> {
  const db = await getDatabase();

  // Obtener todas las fechas con al menos una actividad completada, ordenadas DESC
  const fechasActivas = await db.getAllAsync<{ fecha: string }>(
    `SELECT DISTINCT fecha FROM actividad
     WHERE estado_ejecucion = 'completada'
     ORDER BY fecha DESC`
  );

  if (fechasActivas.length === 0) {
    return { rachaActual: 0, rachaMaxima: 0 };
  }

  // Parsear fechas a timestamps para calcular rachas de días consecutivos
  const diasMs = 24 * 60 * 60 * 1000;
  const fechasTs = fechasActivas.map((f) => {
    const [y, m, d] = f.fecha.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  });

  // Racha actual: empezar desde hoy (o ayer si hoy no tiene datos) hacia atrás
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyTs = hoy.getTime();
  const ayerTs = hoyTs - diasMs;

  let rachaActual = 0;
  let cursorTs = fechasTs[0] === hoyTs ? hoyTs : (fechasTs[0] === ayerTs ? ayerTs : -1);

  if (cursorTs >= 0) {
    for (const ts of fechasTs) {
      if (ts === cursorTs) {
        rachaActual++;
        cursorTs -= diasMs;
      } else if (ts < cursorTs) {
        break;
      }
    }
  }

  // Racha máxima: recorrer todas las fechas
  let rachaMaxima = 0;
  let rachaTemp = 1;
  for (let i = 1; i < fechasTs.length; i++) {
    if (fechasTs[i - 1] - fechasTs[i] === diasMs) {
      rachaTemp++;
    } else {
      rachaMaxima = Math.max(rachaMaxima, rachaTemp);
      rachaTemp = 1;
    }
  }
  rachaMaxima = Math.max(rachaMaxima, rachaTemp);

  return { rachaActual, rachaMaxima };
}

// ─── Comparativa entre Períodos ─────────────────────────────

export async function getComparativa(periodo: PeriodoMetricas): Promise<ComparativaPeriodo> {
  const rangoActual = calcularRango(periodo);
  const rangoAnterior = calcularRangoAnterior(periodo);

  const actual = await getResumenGeneral(rangoActual);
  const anterior = await getResumenGeneral(rangoAnterior);

  const sinDatosAnteriores = anterior.totalPlanificadas === 0;

  return {
    actual,
    anterior: sinDatosAnteriores ? null : anterior,
    deltaCumplimiento: (!sinDatosAnteriores && actual.cumplimientoPct != null && anterior.cumplimientoPct != null)
      ? actual.cumplimientoPct - anterior.cumplimientoPct
      : null,
    deltaHoras: (!sinDatosAnteriores && actual.horasRegistradas != null && anterior.horasRegistradas != null)
      ? Math.round((actual.horasRegistradas - anterior.horasRegistradas) * 10) / 10
      : null,
    deltaActividades: !sinDatosAnteriores
      ? actual.completadas - anterior.completadas
      : null,
    sinDatosAnteriores,
  };
}

// ─── Insights Automatizados ─────────────────────────────────

/**
 * Genera insights objetivos y no moralizantes basados en datos reales.
 * Cada insight responde una pregunta concreta con datos verificables.
 */
export async function generarInsights(periodo: PeriodoMetricas): Promise<Insight[]> {
  const insights: Insight[] = [];
  const comparativa = await getComparativa(periodo);
  const { actual } = comparativa;
  const rangoActual = calcularRango(periodo);
  const consistencia = await getConsistencia();
  const distribucion = await getDistribucionPorArea(rangoActual);

  const etiquetaPeriodo = periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes';

  // 1. Cumplimiento
  if (actual.cumplimientoPct != null && actual.totalPlanificadas > 0) {
    insights.push({
      tipo: 'info',
      mensaje: `${etiquetaPeriodo} completaste ${actual.completadas} de ${actual.totalPlanificadas} actividades planificadas (${actual.cumplimientoPct}%).`,
    });
  }

  // 2. Comparativa de cumplimiento
  if (comparativa.deltaCumplimiento != null) {
    const dir = comparativa.deltaCumplimiento > 0 ? 'aumentó' : 'disminuyó';
    const abs = Math.abs(comparativa.deltaCumplimiento);
    if (abs >= 5) {
      insights.push({
        tipo: comparativa.deltaCumplimiento > 0 ? 'tendencia_positiva' : 'tendencia_negativa',
        mensaje: `El cumplimiento ${dir} ${abs}% respecto al período anterior.`,
      });
    }
  }

  // 3. Reprogramaciones
  if (actual.totalReprogramaciones > 0) {
    insights.push({
      tipo: 'info',
      mensaje: `Se realizaron ${actual.totalReprogramaciones} reprogramaciones en el período.`,
    });

    if (comparativa.anterior && comparativa.anterior.totalReprogramaciones > 0) {
      const diff = actual.totalReprogramaciones - comparativa.anterior.totalReprogramaciones;
      if (diff > 0) {
        insights.push({
          tipo: 'tendencia_negativa',
          mensaje: `Las reprogramaciones aumentaron respecto al período anterior (+${diff}).`,
        });
      }
    }
  }

  // 4. Cancelaciones
  if (actual.canceladas > 0) {
    insights.push({
      tipo: 'info',
      mensaje: `${actual.canceladas} actividad${actual.canceladas > 1 ? 'es fueron' : ' fue'} cancelada${actual.canceladas > 1 ? 's' : ''}.`,
    });
  }

  // 5. Racha
  if (consistencia.rachaActual > 0) {
    insights.push({
      tipo: 'tendencia_positiva',
      mensaje: `Llevás ${consistencia.rachaActual} día${consistencia.rachaActual > 1 ? 's' : ''} consecutivo${consistencia.rachaActual > 1 ? 's' : ''} registrando actividades.`,
    });
  }

  // 6. Horas comparativas
  if (comparativa.deltaHoras != null && comparativa.deltaHoras !== 0) {
    const dir = comparativa.deltaHoras > 0 ? 'más' : 'menos';
    const abs = Math.abs(comparativa.deltaHoras);
    insights.push({
      tipo: 'info',
      mensaje: `Registraste ${abs}h ${dir} que en el período anterior.`,
    });
  }

  // 7. Distribución por área
  if (distribucion.length > 0) {
    const topArea = distribucion[0];
    if (topArea.tiempoRealMin > 0) {
      const totalMin = distribucion.reduce((sum, d) => sum + d.tiempoRealMin, 0);
      if (totalMin > 0) {
        const pct = Math.round((topArea.tiempoRealMin / totalMin) * 100);
        insights.push({
          tipo: 'info',
          mensaje: `${topArea.nombre} representa el ${pct}% del tiempo registrado.`,
        });
      }
    }
  }

  // 8. Precisión de estimación
  const db = await getDatabase();
  const precision = await db.getFirstAsync<{ estimado: number; real: number }>(
    `SELECT
       SUM(duracion_estimada_min) AS estimado,
       SUM(duracion_real_min) AS real
     FROM actividad
     WHERE fecha BETWEEN ? AND ?
       AND duracion_estimada_min IS NOT NULL
       AND duracion_real_min IS NOT NULL`,
    [rangoActual.inicio, rangoActual.fin]
  );
  if (precision && precision.estimado > 0 && precision.real > 0) {
    const desviacion = Math.round(((precision.real - precision.estimado) / precision.estimado) * 100);
    if (Math.abs(desviacion) >= 10) {
      const dir = desviacion > 0 ? 'superior' : 'inferior';
      insights.push({
        tipo: 'patron',
        mensaje: `La duración real promedio fue ${Math.abs(desviacion)}% ${dir} a la estimada.`,
      });
    }
  }

  return insights;
}
