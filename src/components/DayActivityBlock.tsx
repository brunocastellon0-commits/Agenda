import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, pressedFeedback, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'
import { toFechaISO } from '../utils/calendario'
import {
  duracionVisual,
  formatoDuracion,
  formatoRango,
  minutosDeAhora,
} from '../utils/scheduleLayout'

interface DayActivityBlockProps {
  actividad: Actividad
  tipo?: TipoActividad
  /** posición/medidas calculadas por TimeGrid */
  top: number
  height: number
  left: number
  width: number
  /** modo compacto: columna estrecha → menos metadatos */
  compact: boolean
  subtareaProgreso?: { total: number; completadas: number } | null
  onToggle: (actividadId: number) => void
  onOpenActions: (actividad: Actividad) => void
}

export function DayActivityBlock({
  actividad,
  tipo,
  top,
  height,
  left,
  width,
  compact,
  subtareaProgreso,
  onToggle,
  onOpenActions,
}: DayActivityBlockProps) {
  const done = actividad.completado === 1
  const enProgreso = actividad.estado_ejecucion === 'en_progreso' && !done
  const areaColor = tipo?.color ?? PALETTE.primary

  // Atrasada (misma lógica que TaskCard)
  const hoyISO = toFechaISO(new Date())
  let estaVencida = false
  if (!done && actividad.fecha < hoyISO) {
    estaVencida = true
  } else if (!done && actividad.fecha === hoyISO && actividad.hora) {
    const [h, m] = actividad.hora.split(':').map(Number)
    const ahora = minutosDeAhora(new Date())
    if (ahora > h * 60 + m) estaVencida = true
  }

  const esCritica = !done && actividad.prioridad === 'critica'
  const esAlta = !done && actividad.prioridad === 'alta'

  const duracionTexto = formatoDuracion(duracionVisual(actividad))

  const altoParaMeta = height >= 64 && !compact

  return (
    <Pressable
      onPress={() => onOpenActions(actividad)}
      style={({ pressed }) => [
        styles.block,
        {
          top,
          height,
          left,
          width,
          backgroundColor: done
            ? PALETTE.surfaceContainer
            : tint(areaColor, 0.07),
        },
        pressed && pressedFeedback,
      ]}
    >
      {/* Barra lateral de color del área */}
      <View style={[styles.barra, { backgroundColor: done ? PALETTE.outline : areaColor }]} />

      <View style={styles.content}>
        <View style={styles.rowTop}>
          {/* Checkbox / estado */}
          <Pressable
            onPress={() => actividad.id !== undefined && onToggle(actividad.id)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.checkbox,
              enProgreso && { borderColor: areaColor, borderWidth: 2 },
              done && { backgroundColor: areaColor, borderColor: areaColor },
              pressed && pressedFeedback,
            ]}
            accessibilityRole="checkbox"
            accessibilityLabel={done ? 'Reactivar actividad' : 'Completar actividad'}
          >
            {done ? (
              <MaterialIcons name="check" size={12} color={PALETTE.onAccent} />
            ) : enProgreso ? (
              <View style={[styles.dotInner, { backgroundColor: areaColor }]} />
            ) : null}
          </Pressable>

          <View style={styles.titles}>
            <Text
              style={[styles.title, done && styles.titleDone, compact && styles.titleCompact]}
              numberOfLines={height >= 56 ? 2 : 1}
            >
              {actividad.titulo}
            </Text>

            {!compact && actividad.hora && (
              <Text style={styles.rango}>
                {formatoRango(actividad)} · {duracionTexto}
              </Text>
            )}

            {compact && actividad.hora && height >= 56 && (
              <Text style={styles.rangoCompact} numberOfLines={1}>
                {actividad.hora}
              </Text>
            )}
          </View>
        </View>

        {/* Metadatos: solo si hay espacio (columna ancha + alto suficiente) */}
        {altoParaMeta && (
          <View style={styles.metaRow}>
            {enProgreso && (
              <View style={[styles.pill, { backgroundColor: tint(areaColor, 0.14) }]}>
                <Text style={[styles.pillText, { color: areaColor }]}>En progreso</Text>
              </View>
            )}
            {estaVencida && (
              <View style={[styles.pill, { backgroundColor: PALETTE.categorias.critico }]}>
                <Text style={[styles.pillText, styles.pillTextOnFill]}>Atrasada</Text>
              </View>
            )}
            {esCritica && (
              <View style={[styles.pill, { backgroundColor: PALETTE.categorias.critico }]}>
                <Text style={[styles.pillText, styles.pillTextOnFill]}>Crítica</Text>
              </View>
            )}
            {esAlta && !esCritica && (
              <View
                style={[styles.pill, { backgroundColor: tint(PALETTE.categorias.importante, 0.16) }]}
              >
                <Text style={[styles.pillText, { color: PALETTE.categorias.importante }]}>
                  Alta
                </Text>
              </View>
            )}
            {!!tipo && width >= 170 && (
              <View style={[styles.pill, { backgroundColor: tint(areaColor, 0.1) }]}>
                <View style={[styles.pillDot, { backgroundColor: areaColor }]} />
                <Text style={[styles.pillText, { color: areaColor }]}>{tipo.nombre}</Text>
              </View>
            )}
            {subtareaProgreso && subtareaProgreso.total > 0 && width >= 150 && (
              <View style={[styles.pill, { backgroundColor: tint(areaColor, 0.1) }]}>
                <MaterialIcons name="checklist" size={11} color={areaColor} />
                <Text style={[styles.pillText, { color: areaColor }]}>
                  {subtareaProgreso.completadas}/{subtareaProgreso.total}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: RADIUS.interior,
    overflow: 'hidden',
    // sin sombra dentro de la rejilla: la calma es la prioridad
  },
  barra: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  content: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7,
    justifyContent: 'space-between',
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: PALETTE.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
    lineHeight: 17,
  },
  titleCompact: {
    fontSize: 12.5,
  },
  titleDone: {
    color: PALETTE.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  rango: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
  },
  rangoCompact: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pillText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pillTextOnFill: {
    color: PALETTE.onAccent,
  },
})
