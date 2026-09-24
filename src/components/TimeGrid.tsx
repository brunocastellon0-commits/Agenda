import React, { useMemo, useState } from 'react'
import { Dimensions, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import { PALETTE, RADIUS, SHADOW } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'
import {
  COL_GAP,
  LABEL_W,
  PX_PER_SLOT,
  SLOT_MIN,
  BloqueLayout,
  minutosAHora,
  topFor,
} from '../utils/scheduleLayout'
import { DayActivityBlock } from './DayActivityBlock'

interface TimeGridProps {
  startMin: number
  endMin: number
  /** layouts calculados por DaySchedule (columnas + posición temporal) */
  bloques: BloqueLayout[]
  actividades: Actividad[]
  tipos: TipoActividad[]
  esHoy: boolean
  ahoraMin: number
  accentColor: string
  subtareasCounts?: Record<number, { total: number; completadas: number }>
  onToggle: (actividadId: number) => void
  onOpenActions: (actividad: Actividad) => void
  /**
   * Futuro: crear actividad tocando una hora vacía.
   * Si se provee, cada ranura de 30min de la rejilla se vuelve presionable
   * (capa detrás de los bloques — no requiere rehacer la arquitectura).
   */
  onPressTime?: (minute: number) => void
}

const ANCHO_ESTIMADO = Dimensions.get('window').width - 32 - 20

export function TimeGrid({
  startMin,
  endMin,
  bloques,
  actividades,
  tipos,
  esHoy,
  ahoraMin,
  accentColor,
  subtareasCounts,
  onToggle,
  onOpenActions,
  onPressTime,
}: TimeGridProps) {
  const [gridWidth, setGridWidth] = useState(ANCHO_ESTIMADO)

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0) setGridWidth(w)
  }

  const mapaTipos = useMemo(() => {
    const map = new Map<number, TipoActividad>()
    for (const t of tipos) {
      if (t.id !== undefined) map.set(t.id, t)
    }
    return map
  }, [tipos])

  const mapaActividades = useMemo(() => {
    const map = new Map<number, Actividad>()
    for (const a of actividades) {
      if (a.id !== undefined) map.set(a.id, a)
    }
    return map
  }, [actividades])

  // Slots de la rejilla (cada 30min entre startMin y endMin)
  const slots = useMemo(() => {
    const lista: number[] = []
    for (let m = startMin; m <= endMin; m += SLOT_MIN) lista.push(m)
    // asegurar línea final exacta
    if (lista[lista.length - 1] !== endMin) lista.push(endMin)
    return lista
  }, [startMin, endMin])

  const alturaTotal = topFor(endMin, startMin)

  // Ancho útil de bloques = tarjeta − columna de horas − gap
  const anchoUtil = Math.max(120, gridWidth - LABEL_W - 10)

  // Línea AHORA: solo si es hoy y el instante cae dentro del rango
  const ahoraVisible = esHoy && ahoraMin >= startMin && ahoraMin <= endMin
  const ahoraTop = topFor(ahoraMin, startMin)

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={[styles.grid, { height: alturaTotal }]}>
        {/* ── Capa 1: ranuras + líneas de la rejilla ── */}
        {slots.map((m, i) => {
          const top = topFor(m, startMin)
          const esHoraCompleta = m % 60 === 0
          const esUltimo = i === slots.length - 1
          const esFin = m === endMin

          return (
            <React.Fragment key={m}>
              {/* Ranura presionable (futuro onPressTime) — detrás de todo */}
              {!esFin && onPressTime ? (
                <View
                  style={[styles.slotPress, { top, height: PX_PER_SLOT, left: LABEL_W, right: 0 }]}
                  pointerEvents="box-only"
                >
                  <SlotPressable minute={m} onPressTime={onPressTime} height={PX_PER_SLOT} />
                </View>
              ) : null}

              {/* Línea */}
              {!esUltimo && (
                <View
                  style={[
                    styles.line,
                    esHoraCompleta ? styles.lineHour : styles.lineHalfHour,
                    { top },
                  ]}
                />
              )}

              {/* Etiqueta de hora */}
              {!esFin && (
                <Text
                  style={[
                    styles.timeLabel,
                    esHoraCompleta ? styles.timeLabelHour : styles.timeLabelHalf,
                    { top: top - 7 },
                  ]}
                >
                  {minutosAHora(m)}
                </Text>
              )}
            </React.Fragment>
          )
        })}

        {/* ── Capa 2: bloques de actividad ── */}
        {bloques.map((b) => {
          const act = mapaActividades.get(b.id)
          if (!act) return null
          const tipo = mapaTipos.get(act.tipo_actividad_id)
          const blockW = (anchoUtil - (b.cols - 1) * COL_GAP) / b.cols
          const left = LABEL_W + 10 + b.col * (blockW + COL_GAP)
          const top = topFor(b.inicio, startMin)
          const height = Math.max(
            topFor(b.fin, startMin) - top,
            PX_PER_SLOT // mínimo 1 slot de legibilidad
          )
          const compact = b.cols > 1 || blockW < 150

          return (
            <DayActivityBlock
              key={b.id}
              actividad={act}
              tipo={tipo}
              top={top}
              height={height}
              left={left}
              width={blockW}
              compact={compact}
              subtareaProgreso={subtareasCounts?.[b.id]}
              onToggle={onToggle}
              onOpenActions={onOpenActions}
            />
          )
        })}

        {/* ── Capa 3: línea ● AHORA (solo hoy, dentro del rango) ── */}
        {ahoraVisible && (
          <View style={[styles.ahoraWrap, { top: ahoraTop }]} pointerEvents="none">
            <View style={[styles.ahoraLine, { left: LABEL_W }]} />
            <View style={[styles.ahoraDot, { top: ahoraTop - 4, left: LABEL_W - 4 }]} />
            <View
              style={[styles.ahoraPill, { top: ahoraTop - 9, left: LABEL_W + 8 }]}
            >
              <Text style={styles.ahoraPillText}>
                AHORA {minutosAHora(ahoraMin)}
              </Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.bottomLine} />
      <Text style={styles.rangeHint}>
        {minutosAHora(startMin)} – {minutosAHora(endMin)}
      </Text>
    </View>
  )
}

/** Ranura individual presionable (solo si onPressTime existe). */
function SlotPressable({
  minute,
  onPressTime,
  height,
}: {
  minute: number
  onPressTime: (minute: number) => void
  height: number
}) {
  return (
    <Pressable
      onPress={() => onPressTime(minute)}
      style={({ pressed }) => [{ flex: 1, height }, pressed && { backgroundColor: 'rgba(22,135,106,0.06)' }]}
      accessibilityRole="button"
      accessibilityLabel={`Crear actividad a las ${minutosAHora(minute)}`}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 10,
    ...SHADOW.card,
  },
  grid: {
    position: 'relative',
  },
  slotPress: {
    position: 'absolute',
    zIndex: 0,
  },
  line: {
    position: 'absolute',
    left: LABEL_W,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    zIndex: 1,
  },
  lineHour: {
    borderTopColor: PALETTE.hairline,
    borderStyle: 'solid',
  },
  lineHalfHour: {
    borderTopColor: PALETTE.hairline,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  timeLabel: {
    position: 'absolute',
    left: 0,
    width: LABEL_W - 6,
    textAlign: 'right',
    zIndex: 1,
  },
  timeLabelHour: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  timeLabelHalf: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.outline,
  },
  ahoraWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 5,
  },
  ahoraLine: {
    position: 'absolute',
    right: 0,
    height: 1.5,
    backgroundColor: PALETTE.primary,
    top: 0,
    opacity: 0.85,
  },
  ahoraDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.primary,
    zIndex: 6,
  },
  ahoraPill: {
    position: 'absolute',
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 6,
  },
  ahoraPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.onAccent,
    letterSpacing: 0.4,
  },
  bottomLine: {
    height: 1,
    backgroundColor: PALETTE.hairline,
    marginTop: 8,
    marginLeft: LABEL_W,
  },
  rangeHint: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.outline,
    textAlign: 'right',
    marginTop: 4,
  },
})
