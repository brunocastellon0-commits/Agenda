import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { Actividad } from '../repositories/actividadRepo';

interface TodaySummaryCardProps {
  actividades: Actividad[];
  onToggleTask: (id: number) => void;
  onNavigateActividades: () => void;
}

export function TodaySummaryCard({
  actividades,
  onToggleTask,
  onNavigateActividades,
}: TodaySummaryCardProps) {
  const total = actividades.length;
  const completadas = actividades.filter((a) => a.completado === 1).length;
  const pendientes = total - completadas;
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const topPendientes = actividades.filter((a) => a.completado === 0).slice(0, 3);

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && pressedFeedback]}
        onPress={onNavigateActividades}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: tint(PALETTE.categorias.trabajo) }]}>
            <MaterialIcons name="event-available" size={20} color={PALETTE.categorias.trabajo} />
            {pendientes > 0 && (
              <View style={styles.socialBadge}>
                <Text style={styles.socialBadgeText}>{pendientes}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.title}>Mi Jornada de Hoy</Text>
            <Text style={styles.subtitle}>
              {total === 0
                ? 'Sin actividades programadas'
                : `${completadas} de ${total} tareas completadas (${pct}%)`}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={PALETTE.onSurfaceVariant} />
      </Pressable>

      {/* Progress Bar */}
      {total > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>
      )}

      {/* Task list preview */}
      <View style={styles.list}>
        {total === 0 ? (
          <Text style={styles.emptyText}>Toca para añadir tu primera actividad del día.</Text>
        ) : topPendientes.length === 0 ? (
          <View style={styles.allDoneBox}>
            <MaterialIcons name="check-circle" size={20} color={PALETTE.primary} />
            <Text style={styles.allDoneText}>¡Excelente! Has completado todas tus tareas de hoy.</Text>
          </View>
        ) : (
          topPendientes.map((act) => (
            <View key={act.id} style={styles.taskRow}>
              <Pressable
                onPress={() => act.id && onToggleTask(act.id)}
                style={({ pressed }) => [styles.checkbox, pressed && pressedFeedback]}
              >
                <MaterialIcons name="crop-square" size={20} color={PALETTE.onSurfaceVariant} />
              </Pressable>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {act.titulo}
              </Text>
              {act.duracion_estimada_min && (
                <Text style={styles.durationTag}>{act.duracion_estimada_min}m</Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  socialBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PALETTE.categorias.critico,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: PALETTE.surfaceContainerLowest,
  },
  socialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.onAccent,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 14,
  },
  track: {
    height: 6,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: PALETTE.categorias.trabajo,
    borderRadius: 3,
  },
  list: {
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  allDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  allDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.primary,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
  },
  checkbox: {
    padding: 2,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.ink,
    flex: 1,
  },
  durationTag: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
