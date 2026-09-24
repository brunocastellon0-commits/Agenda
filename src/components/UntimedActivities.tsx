import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, pressedFeedback, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'

interface UntimedActivitiesProps {
  actividades: Actividad[]
  tipos: TipoActividad[]
  accentColor: string
  onToggle: (actividadId: number) => void
  onOpenActions: (actividad: Actividad) => void
}

/**
 * Sección "SIN HORA": lista vertical de filas (actividades sin hora asignada).
 * Fila completa presionable → bottom-sheet de acciones (igual que los bloques de la rejilla).
 */
export function UntimedActivities({
  actividades,
  tipos,
  accentColor,
  onToggle,
  onOpenActions,
}: UntimedActivitiesProps) {
  const mapaTipos = React.useMemo(() => {
    const map = new Map<number, TipoActividad>()
    for (const t of tipos) {
      if (t.id !== undefined) map.set(t.id, t)
    }
    return map
  }, [tipos])

  if (actividades.length === 0) return null

  return (
    <View style={styles.list}>
      {actividades.map((act) => {
        if (act.id === undefined) return null
        const tipo = mapaTipos.get(act.tipo_actividad_id)
        const color = tipo?.color ?? accentColor
        const done = act.completado === 1
        const enProgreso = act.estado_ejecucion === 'en_progreso' && !done

        return (
          <Pressable
            key={act.id}
            onPress={() => onOpenActions(act)}
            style={({ pressed }) => [
              styles.row,
              done && styles.rowDone,
              pressed && pressedFeedback,
            ]}
          >
            <View style={[styles.barra, { backgroundColor: done ? PALETTE.outline : color }]} />

            <Pressable
              onPress={() => onToggle(act.id!)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.checkbox,
                enProgreso && { borderColor: color, borderWidth: 2 },
                done && { backgroundColor: color, borderColor: color },
                pressed && pressedFeedback,
              ]}
              accessibilityRole="checkbox"
              accessibilityLabel={done ? 'Reactivar actividad' : 'Completar actividad'}
            >
              {done ? (
                <MaterialIcons name="check" size={12} color={PALETTE.onAccent} />
              ) : enProgreso ? (
                <View style={[styles.dotInner, { backgroundColor: color }]} />
              ) : null}
            </Pressable>

            <View style={styles.content}>
              <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
                {act.titulo}
              </Text>
              <View style={styles.metaRow}>
                {!!tipo && (
                  <View style={[styles.areaPill, { backgroundColor: tint(color, 0.12) }]}>
                    <View style={[styles.areaDot, { backgroundColor: color }]} />
                    <Text style={[styles.areaText, { color }]}>{tipo.nombre}</Text>
                  </View>
                )}
                {enProgreso && (
                  <View style={[styles.estadoPill, { backgroundColor: tint(color, 0.14) }]}>
                    <Text style={[styles.estadoText, { color }]}>En progreso</Text>
                  </View>
                )}
              </View>
            </View>

            <MaterialIcons
              name="more-vert"
              size={18}
              color={PALETTE.outline}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.interior,
    paddingVertical: 11,
    paddingRight: 12,
    paddingLeft: 13,
    overflow: 'hidden',
    // sin borde negro; separación por sombra suave de la card contenedora
  },
  rowDone: {
    opacity: 0.7,
  },
  barra: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: RADIUS.interior,
    borderBottomLeftRadius: RADIUS.interior,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PALETTE.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
    lineHeight: 19,
  },
  titleDone: {
    color: PALETTE.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  areaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  areaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  areaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  estadoPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})
