import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, pressedFeedback, tint } from '../theme/theme'
import { TintPill } from './TintPill'
import { Actividad } from '../repositories/actividadRepo'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  title: string
  actividades: Actividad[]
  pendingCount: number
  accentColor: string
  subtareasCounts?: Record<number, { total: number; completadas: number }>
  onToggle: (actividadId: number) => void
  onAddPress: () => void
  onTaskLongPress?: (actividadId: number) => void
}

export function TaskList({
  title,
  actividades,
  pendingCount,
  accentColor,
  subtareasCounts,
  onToggle,
  onAddPress,
  onTaskLongPress,
}: TaskListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {pendingCount > 0 && (
          <TintPill color={accentColor} radius={12} style={styles.pendingPill}>
            <Text style={[styles.pendingText, { color: accentColor }]}>
              {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
            </Text>
          </TintPill>
        )}
      </View>

      {actividades.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin actividades para este tipo hoy.</Text>
          <Text style={styles.emptyHint}>Toca el botón para agregar una.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {actividades.map((actividad) => (
            <TaskCard
              key={actividad.id ?? Math.random()}
              actividad={actividad}
              accentColor={accentColor}
              subtareaProgreso={actividad.id && subtareasCounts ? subtareasCounts[actividad.id] : null}
              onToggle={onToggle}
              onLongPress={actividad.id && onTaskLongPress ? () => onTaskLongPress(actividad.id!) : undefined}
            />
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: tint(accentColor, 0.12) },
          pressed && pressedFeedback,
        ]}
        onPress={onAddPress}
      >
        <MaterialIcons name="add" size={18} color={accentColor} />
        <Text style={[styles.addText, { color: accentColor }]}>Agregar actividad</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  pendingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    marginTop: 12,
    gap: 10,
  },
  empty: {
    marginTop: 12,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.cards,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
  },
  emptyHint: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
  },
  addText: {
    fontSize: 14,
    fontWeight: '700',
  },
})