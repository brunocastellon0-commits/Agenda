import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { HabitoProgreso } from '../repositories/habitosRepo';

interface HabitCardProps {
  habit: HabitoProgreso;
  onPress?: () => void;
}

export default function HabitCard({ habit, onPress }: HabitCardProps) {
  const { detalle, rachaActual, mejorRacha, completadosSemana, objetivoSemanal, historialReciente } = habit;
  
  // Semana: L M X J V S D
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  // Historial viene de hoy hacia atrás, lo invertimos para mostrar en orden cronológico (lun a dom o últimos 7)
  const orderedHistory = [...historialReciente].reverse();

  const color = detalle.tipo_actividad_color || PALETTE.primary;

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {detalle.tipo_actividad_emoji && (
            <Text style={styles.emoji}>{detalle.tipo_actividad_emoji}</Text>
          )}
          <Text style={styles.title}>{detalle.titulo}</Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: tint(PALETTE.categorias.importante, 0.12) }]}>
          <Text style={[styles.streakText, { color: PALETTE.categorias.importante }]}>
            🔥 {rachaActual} {habit.frecuencia === 'semanal' ? 'semanas' : 'días'}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        {completadosSemana} / {objetivoSemanal} esta semana
      </Text>

      <View style={styles.daysRow}>
        {orderedHistory.map((day, i) => (
          <View key={i} style={styles.dayContainer}>
            <Text style={styles.dayLabel}>{days[i]}</Text>
            <View style={[
              styles.dayCircle,
              day.completado ? { backgroundColor: color, borderColor: color } : {}
            ]}>
              {day.completado && <Text style={styles.check}>✓</Text>}
            </View>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 4,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    color: PALETTE.surfaceContainerLowest,
    fontSize: 14,
    fontWeight: '700',
  },
});
