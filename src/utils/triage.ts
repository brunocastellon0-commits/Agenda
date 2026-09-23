/**
 * triage.ts — Funciones puras para la vista "Todas las Áreas" (agenda de triage).
 *
 * buildAllAreasDay   → clasifica actividades del día en: Ahora, Atrasadas, Programadas, Flexibles, PorÁrea
 * detectarChoques    → barrido O(n log n) para encontrar solapamientos de horario
 *
 * Reglas del usuario:
 *  - Firma: (actividades, atrasadas, esHoy, ahoraRef = new Date())
 *  - Choques: comparación estricta (09:00–10:00 y 10:00 NO chocan)
 *  - Si inicio + duración pasa de medianoche, limitar fin a 24:00
 *  - Ignorar completadas y pospuestas (reprogramadas/canceladas)
 *  - 30 min por defecto son solo para el cálculo, no se persisten
 *  - Bloque "Ahora": solo pendientes/en_progreso
 */

import type { Actividad, TipoActividad } from '../repositories/actividadRepo';

// ─── Tipos públicos ─────────────────────────────────────────

export interface AhoraItem {
  actividad: Actividad;
  /** 'En curso' | 'Empieza en X min' */
  estadoContextual: string;
}

export interface SeccionPorArea {
  tipo: TipoActividad;
  programadas: Actividad[];
  flexibles: Actividad[];
  totalPendientes: number;
}

export interface TriageDia {
  ahoraItem: AhoraItem | null;
  atrasadasList: Actividad[];
  programadas: Actividad[];
  /** actividadId → mensaje legible ("Choca con 09:00") */
  choques: Record<number, string>;
  flexibles: Actividad[];
  porArea: SeccionPorArea[];
}

export type ModoVistaTodas = 'cronologico' | 'por_area';

// Persistencia a nivel de módulo (sobrevive cambios de tab durante la sesión)
let _modoVistaTodas: ModoVistaTodas = 'cronologico';
export const getModoVistaTodas = (): ModoVistaTodas => _modoVistaTodas;
export const setModoVistaTodas = (modo: ModoVistaTodas): void => {
  _modoVistaTodas = modo;
};

let _ultimaAreaUsadaId: number | null = null;
export const getUltimaAreaUsadaId = (): number | null => _ultimaAreaUsadaId;
export const setUltimaAreaUsadaId = (id: number | null): void => {
  _ultimaAreaUsadaId = id;
};

// ─── Helpers internos ───────────────────────────────────────

/** Convierte "HH:MM" a minutos desde medianoche (0–1440). */
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Convierte minutos a "HH:MM". */
function minutosAHora(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const DURACION_DEFECTO = 30; // minutos — solo para cálculo de choques
const MAX_MINUTOS_DIA = 24 * 60; // 1440

/** ¿La actividad está activa (pendiente o en progreso)? */
function esActiva(a: Actividad): boolean {
  const ejec = a.estado_ejecucion ?? (a.completado === 1 ? 'completada' : 'pendiente');
  const planif = a.estado_planificacion ?? 'planificada';
  // Ignorar completadas, no_realizadas, reprogramadas y canceladas
  if (ejec === 'completada' || ejec === 'no_realizada') return false;
  if (planif === 'reprogramada' || planif === 'cancelada') return false;
  return true;
}

/** ¿La actividad está pendiente o en progreso? (para bloque "Ahora") */
function esPendienteOEnProgreso(a: Actividad): boolean {
  const ejec = a.estado_ejecucion ?? (a.completado === 1 ? 'completada' : 'pendiente');
  return ejec === 'pendiente' || ejec === 'en_progreso';
}

// ─── Detección de choques (sweep) ───────────────────────────

interface IntervaloActividad {
  id: number;
  inicio: number; // minutos
  fin: number;    // minutos (estricto: 09:00–10:00 y 10:00 NO chocan)
  hora: string;   // original para mensaje
}

/**
 * Detecta choques de horario entre actividades activas con hora asignada.
 * Usa barrido (sweep line) — O(n log n).
 *
 * Comparación estricta: [inicioA, finA) ∩ [inicioB, finB) ≠ ∅
 *   → inicioA < finB && inicioB < finA
 *   → 09:00–10:00 y 10:00–11:00 NO chocan.
 */
export function detectarChoques(actividades: Actividad[]): Record<number, string> {
  // Filtrar solo activas con hora
  const intervalos: IntervaloActividad[] = [];
  for (const a of actividades) {
    if (!a.id || !a.hora || !esActiva(a)) continue;
    const inicio = horaAMinutos(a.hora);
    const duracion = a.duracion_estimada_min ?? DURACION_DEFECTO;
    // Cap al final del día (24:00 = 1440)
    const fin = Math.min(inicio + duracion, MAX_MINUTOS_DIA);
    intervalos.push({ id: a.id, inicio, fin, hora: a.hora });
  }

  if (intervalos.length < 2) return {};

  // Ordenar por inicio, desempatar por fin
  intervalos.sort((a, b) => a.inicio - b.inicio || a.fin - b.fin);

  const choques: Record<number, string> = {};

  // Sweep: comparar cada intervalo con los siguientes mientras se solapen
  for (let i = 0; i < intervalos.length; i++) {
    const curr = intervalos[i];
    for (let j = i + 1; j < intervalos.length; j++) {
      const next = intervalos[j];
      // Si el inicio del siguiente >= fin del actual, no hay choque posible
      // (y tampoco con ninguno posterior, dado el orden)
      if (next.inicio >= curr.fin) break;
      // Choque estricto: next.inicio < curr.fin (ya garantizado) && curr.inicio < next.fin
      if (curr.inicio < next.fin) {
        if (!choques[curr.id]) {
          choques[curr.id] = `Choca con ${next.hora}`;
        }
        if (!choques[next.id]) {
          choques[next.id] = `Choca con ${curr.hora}`;
        }
      }
    }
  }

  return choques;
}

// ─── Bloque "Ahora" ────────────────────────────────────────

/**
 * Calcula el bloque "Ahora": la actividad en curso o la siguiente pendiente con hora.
 * Solo considera actividades pendientes o en_progreso.
 */
function calcularAhora(
  programadas: Actividad[],
  ahoraRef: Date
): AhoraItem | null {
  const ahoraMin = ahoraRef.getHours() * 60 + ahoraRef.getMinutes();

  // Buscar actividad en curso primero
  for (const a of programadas) {
    if (!a.hora || !a.id) continue;
    if (!esPendienteOEnProgreso(a)) continue;

    const ejec = a.estado_ejecucion ?? 'pendiente';
    if (ejec === 'en_progreso') {
      return { actividad: a, estadoContextual: 'En curso' };
    }
  }

  // Buscar la siguiente actividad pendiente con hora que aún no haya pasado
  let mejor: Actividad | null = null;
  let mejorInicio = Infinity;

  for (const a of programadas) {
    if (!a.hora || !a.id) continue;
    if (!esPendienteOEnProgreso(a)) continue;

    const inicioMin = horaAMinutos(a.hora);
    // Solo considerar las que están en el futuro o justo ahora
    if (inicioMin >= ahoraMin && inicioMin < mejorInicio) {
      mejor = a;
      mejorInicio = inicioMin;
    }
  }

  if (!mejor) return null;

  const diffMin = mejorInicio - ahoraMin;
  if (diffMin === 0) {
    return { actividad: mejor, estadoContextual: 'Empieza ahora' };
  }
  if (diffMin < 60) {
    return { actividad: mejor, estadoContextual: `Empieza en ${diffMin} min` };
  }
  const horas = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  const texto = mins > 0
    ? `Empieza en ${horas}h ${mins}min`
    : `Empieza en ${horas}h`;
  return { actividad: mejor, estadoContextual: texto };
}

// ─── Función principal ──────────────────────────────────────

/**
 * Construye la estructura de datos para la vista "Todas las Áreas" del día.
 *
 * @param actividades - Actividades del día seleccionado (todas las áreas).
 * @param atrasadas   - Actividades de días anteriores aún pendientes/en_progreso.
 * @param esHoy       - Si el día seleccionado es hoy.
 * @param ahoraRef    - Referencia temporal (inyectable para tests).
 */
export function buildAllAreasDay(
  actividades: Actividad[],
  atrasadas: Actividad[],
  esHoy: boolean,
  ahoraRef: Date = new Date()
): TriageDia {
  // Separar programadas (con hora) y flexibles (sin hora)
  const programadas: Actividad[] = [];
  const flexibles: Actividad[] = [];

  for (const a of actividades) {
    if (a.hora) {
      programadas.push(a);
    } else {
      flexibles.push(a);
    }
  }

  // Ordenar programadas por hora
  programadas.sort((a, b) => {
    const ma = horaAMinutos(a.hora!);
    const mb = horaAMinutos(b.hora!);
    return ma - mb;
  });

  // Choques solo entre actividades del mismo día
  const choques = detectarChoques(actividades);

  // Bloque "Ahora" solo si es hoy
  const ahoraItem = esHoy ? calcularAhora(programadas, ahoraRef) : null;

  // Atrasadas: filtrar solo las realmente pendientes/en_progreso
  const atrasadasList = atrasadas.filter(esPendienteOEnProgreso);

  // Agrupación por área — necesita los tipos como contexto externo,
  // pero podemos agrupar por tipo_actividad_id sin necesidad de la entidad tipo.
  // La resolución de TipoActividad se hace en el componente.
  // Aquí agrupamos por ID para que el componente haga el match.
  const porAreaMap = new Map<number, { programadas: Actividad[]; flexibles: Actividad[]; pendientes: number }>();

  for (const a of actividades) {
    let grupo = porAreaMap.get(a.tipo_actividad_id);
    if (!grupo) {
      grupo = { programadas: [], flexibles: [], pendientes: 0 };
      porAreaMap.set(a.tipo_actividad_id, grupo);
    }
    if (a.hora) {
      grupo.programadas.push(a);
    } else {
      grupo.flexibles.push(a);
    }
    if (esPendienteOEnProgreso(a)) {
      grupo.pendientes++;
    }
  }

  // porArea se completa en el componente que tiene acceso a TipoActividad[]
  // Aquí lo dejamos vacío — el componente AllAreasDayView resolverá.
  const porArea: SeccionPorArea[] = [];

  return {
    ahoraItem,
    atrasadasList,
    programadas,
    choques,
    flexibles,
    porArea,
  };
}

/**
 * Resuelve porArea combinando los datos agrupados con la lista de TipoActividad.
 * Separado de buildAllAreasDay para mantener la función pura sin dependencia de TipoActividad[].
 */
export function resolverPorArea(
  actividades: Actividad[],
  tipos: TipoActividad[]
): SeccionPorArea[] {
  const tipoMap = new Map<number, TipoActividad>();
  for (const t of tipos) {
    if (t.id !== undefined) tipoMap.set(t.id, t);
  }

  const grupoMap = new Map<number, { programadas: Actividad[]; flexibles: Actividad[]; pendientes: number }>();

  for (const a of actividades) {
    let grupo = grupoMap.get(a.tipo_actividad_id);
    if (!grupo) {
      grupo = { programadas: [], flexibles: [], pendientes: 0 };
      grupoMap.set(a.tipo_actividad_id, grupo);
    }
    if (a.hora) {
      grupo.programadas.push(a);
    } else {
      grupo.flexibles.push(a);
    }
    if (esPendienteOEnProgreso(a)) {
      grupo.pendientes++;
    }
  }

  const resultado: SeccionPorArea[] = [];
  for (const [tipoId, grupo] of grupoMap) {
    const tipo = tipoMap.get(tipoId);
    if (!tipo) continue;
    // Ordenar programadas por hora
    grupo.programadas.sort((a, b) => horaAMinutos(a.hora!) - horaAMinutos(b.hora!));
    resultado.push({
      tipo,
      programadas: grupo.programadas,
      flexibles: grupo.flexibles,
      totalPendientes: grupo.pendientes,
    });
  }

  // Ordenar por orden del tipo
  resultado.sort((a, b) => a.tipo.orden - b.tipo.orden);

  return resultado;
}
