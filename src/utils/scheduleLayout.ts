/**
 * scheduleLayout.ts — Funciones puras para la agenda horaria (TimeGrid).
 *
 * Reglas del usuario:
 *  - El TIEMPO es el eje visual: nothing hardcodeado por actividad.
 *  - Sin duración → 60 min VISUALES (no se persiste).
 *  - Actividad que cruzaría medianoche → se recorta a 1440 SOLO para pintar (BD intacta).
 *  - Rango inteligente: primera actividad − 60min … última fin + 60min (mín. 4h, redondeo a 30min).
 *  - Si es hoy, el rango se amplía para que la línea AHORA siempre quepa.
 *  - Superposiciones → clusters transitivos + columnas greedy (escalable).
 */

import type { Actividad } from '../repositories/actividadRepo'
import { horaAMinutos, minutosAHora } from './triage'

export { horaAMinutos, minutosAHora }

// ─── Constantes de escala (densidad legible en teléfono) ───

/** Intervalo de la rejilla en minutos. */
export const SLOT_MIN = 30
/** Píxeles por intervalo de 30 min (1h = 88px). Escala de partida, no límite absoluto. */
export const PX_PER_SLOT = 44
export const PX_PER_MIN = PX_PER_SLOT / SLOT_MIN
/** Duración visual por defecto cuando falta duracion_estimada_min. */
export const DURACION_DEFAULT_VISUAL = 60
/** Margen antes/después de las actividades para el rango de la agenda. */
export const MARGEN_RANGO_MIN = 60
/** Rango mínimo para que un día "poco poblado" no se vea raro. */
export const RANGO_MINIMO_MIN = 4 * 60
/** Ancho fijo de la columna de etiquetas de hora. */
export const LABEL_W = 48
/** Separación horizontal entre columnas de bloques solapados. */
export const COL_GAP = 6
export const MAX_MINUTOS_DIA = 24 * 60

// ─── Duración / intervalos ───

/** Duración visual en minutos (60 si no hay duracion_estimada_min). */
export function duracionVisual(a: Actividad): number {
  const d = a.duracion_estimada_min
  if (d == null || !Number.isFinite(d) || d <= 0) return DURACION_DEFAULT_VISUAL
  return d
}

/** Minuto de inicio (0–1440). */
export function inicioDe(a: Actividad): number {
  return a.hora ? horaAMinutos(a.hora) : 0
}

/**
 * Minuto de fin PARA VISUALIZAR, recortado a 24:00.
 * No modifica el dato almacenado en BD.
 */
export function finVisual(a: Actividad): number {
  return Math.min(inicioDe(a) + duracionVisual(a), MAX_MINUTOS_DIA)
}

// ─── Rango de la agenda ───

function redondearAbajo30(min: number): number {
  return Math.floor(min / SLOT_MIN) * SLOT_MIN
}
function redondearArriba30(min: number): number {
  return Math.ceil(min / SLOT_MIN) * SLOT_MIN
}

/**
 * Rango horario inteligente de la matriz.
 * - base: primera actividad − 60min … última fin + 60min
 * - redondeado a 30min, mínimo 4h, clamp [0, 1440]
 * - si es hoy, se une con el instante actual (para que entre la línea AHORA)
 * - null si no hay actividades con hora
 */
export function rangoAgenda(
  programadas: Actividad[],
  esHoy: boolean,
  ahoraMin: number
): { startMin: number; endMin: number } | null {
  if (programadas.length === 0) return null

  let earliest = Infinity
  let latest = -Infinity
  for (const a of programadas) {
    const ini = inicioDe(a)
    const fin = finVisual(a)
    if (ini < earliest) earliest = ini
    if (fin > latest) latest = fin
  }

  if (esHoy) {
    earliest = Math.min(earliest, ahoraMin)
    latest = Math.max(latest, ahoraMin)
  }

  let startMin = Math.max(0, redondearAbajo30(earliest - MARGEN_RANGO_MIN))
  let endMin = Math.min(MAX_MINUTOS_DIA, redondearArriba30(latest + MARGEN_RANGO_MIN))

  if (endMin <= startMin) {
    // Caso degenerado (todo clampado contra los extremos del día)
    startMin = Math.max(0, redondearAbajo30(earliest) - SLOT_MIN)
    endMin = Math.min(MAX_MINUTOS_DIA, startMin + RANGO_MINIMO_MIN)
  }

  // Rango mínimo razonable
  if (endMin - startMin < RANGO_MINIMO_MIN) {
    const deficit = RANGO_MINIMO_MIN - (endMin - startMin)
    const cabeArriba = MAX_MINUTOS_DIA - endMin
    endMin = Math.min(MAX_MINUTOS_DIA, endMin + Math.min(deficit, cabeArriba))
    const falta = deficit - Math.min(deficit, cabeArriba)
    if (falta > 0) startMin = Math.max(0, startMin - falta)
  }

  return { startMin, endMin }
}

// ─── Posición / altura ───

/** top (px) de un minuto dentro de la matriz. */
export function topFor(minuto: number, startMin: number): number {
  return Math.round((minuto - startMin) * PX_PER_MIN)
}

/** altura (px) proporcional a la duración (mínimo 1 slot = legible). */
export function heightFor(duracionMin: number): number {
  return Math.max(duracionMin, SLOT_MIN) * PX_PER_MIN
}

// ─── Layout de superposiciones (columnas) ───

export interface IntervaloItem {
  id: number
  inicio: number
  fin: number
}

export interface BloqueLayout {
  id: number
  inicio: number
  fin: number
  /** columna dentro de su cluster (0-based) */
  col: number
  /** total de columnas del cluster (1 = sin solape) */
  cols: number
}

/**
 * Distribuye intervalos en columnas horizontales para que no se tapeen.
 *
 * 1) Ordena por inicio.
 * 2) Agrupa en clusters transitivamente solapados (A solapa B, B solapa C ⇒ cluster).
 * 3) Asignación greedy: primera columna libre (columna cuyo fin <= inicio del item).
 * 4) Todos los items de un cluster comparten `cols` → el ancho se divide por igual.
 *
 * Una actividad posterior que no solapa abre un cluster nuevo y reutiliza
 * la columna 0 a ancho completo.
 */
export function layoutColumnas(items: IntervaloItem[]): BloqueLayout[] {
  if (items.length === 0) return []

  const ordenados = [...items].sort((a, b) => a.inicio - b.inicio || a.fin - b.fin)

  const resultados: BloqueLayout[] = []
  let cluster: IntervaloItem[] = []
  let clusterMaxFin = -Infinity

  const procesarCluster = (miembros: IntervaloItem[]) => {
    if (miembros.length === 0) return
    // columnas greedy: fin de la última actividad asignada a cada columna
    const colFin: number[] = []
    const asignacion: number[] = []
    for (const item of miembros) {
      let col = colFin.findIndex((f) => f <= item.inicio)
      if (col === -1) {
        col = colFin.length
        colFin.push(item.fin)
      } else {
        colFin[col] = item.fin
      }
      asignacion.push(col)
    }
    const cols = colFin.length
    miembros.forEach((item, i) => {
      resultados.push({ id: item.id, inicio: item.inicio, fin: item.fin, col: asignacion[i], cols })
    })
  }

  for (const item of ordenados) {
    if (cluster.length === 0) {
      cluster = [item]
      clusterMaxFin = item.fin
      continue
    }
    if (item.inicio < clusterMaxFin) {
      // solapa (transitivamente) con el cluster actual
      cluster.push(item)
      clusterMaxFin = Math.max(clusterMaxFin, item.fin)
    } else {
      procesarCluster(cluster)
      cluster = [item]
      clusterMaxFin = item.fin
    }
  }
  procesarCluster(cluster)

  return resultados
}

// ─── Formato ───

/** Duración legible: "2h", "1h 30min", "45min". */
export function formatoDuracion(min: number): string {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

/** "10:00–12:00" (fin recortado a 24:00). */
export function formatoRango(a: Actividad): string {
  if (!a.hora) return ''
  return `${a.hora}–${minutosAHora(finVisual(a))}`
}

/** Minuto actual en minutos desde medianoche. */
export function minutosDeAhora(ahoraRef: Date): number {
  return ahoraRef.getHours() * 60 + ahoraRef.getMinutes()
}
