import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, pressedFeedback, tint } from '../theme/theme'
import { Actividad } from '../repositories/actividadRepo'

interface TaskCardProps {
  actividad: Actividad
  accentColor: string
  origenLabel?: string
  onToggle: (actividadId: number) => void
}

export function TaskCard({ actividad, accentColor, origenLabel, onToggle }: TaskCardProps) {
  const done = actividad.completado === 1
  return (
    <View style={[styles.container, done && styles.containerDone]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => actividad.id !== undefined && onToggle(actividad.id)}
          style={({ pressed }) => [
            styles.checkbox,
            {
              borderColor: done ? accentColor : PALETTE.outline,
              backgroundColor: done ? accentColor : 'transparent',
            },
            pressed && pressedFeedback,
          ]}
        >
          {done && <MaterialIcons name="check" size={13} color={PALETTE.onAccent} />}
        </Pressable>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
              {actividad.titulo}
            </Text>
            {!!actividad.hora && <Text style={styles.time}>{actividad.hora}</Text>}
          </View>

          {!!actividad.descripcion && !done && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {actividad.descripcion}
            </Text>
          )}

          {!!origenLabel && !done && (
            <View style={styles.tagWrapper}>
              <View style={[styles.tag, { backgroundColor: tint(accentColor, 0.1) }]}>
                <View style={[styles.tagDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.tagLabel, { color: accentColor }]}>{origenLabel}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.cards,
    padding: 16,
    backgroundColor: PALETTE.surfaceContainerLowest,
  },
  containerDone: {
    backgroundColor: PALETTE.surfaceContainer,
    opacity: 0.65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.ink,
    lineHeight: 19,
  },
  titleDone: {
    color: PALETTE.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  subtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 16,
  },
  tagWrapper: {
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
})