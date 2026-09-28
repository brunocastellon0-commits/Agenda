import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { HabitoProgreso } from '../repositories/habitosRepo';

interface HabitCardProps {
  habit: HabitoProgreso;
  onPress?: () => void;
}

// getDay(): 0=Domingo … 6=Sábado
const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function diaDeFecha(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return DIAS_CORTOS[d.getDay()];
}

export default function HabitCard({ habit, onPress }: HabitCardProps) {
  const { detalle, rachaActual, mejorRacha, completadosSemana, objetivoSemanal, historialReciente } = habit;
  
  // Semana calendario L M X J V S D — el repo devuelve lun→dom en orden.
  const orderedHistory = historialReciente;

  const color = detalle.tipo_actividad_color || PALETTE.primary;

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {detalle.tipo_actividad_emoji && (
            <MaterialIcons name={(detalle.tipo_actividad_emoji as any) || 'folder'} size={18} color={PALETTE.primary} />
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
          <View key={day.fecha || i} style={styles.dayContainer}>
            <Text style={styles.dayLabel}>{diaDeFecha(day.fecha)}</Text>
            <View style={[
              styles.dayCircle,
              day.completado && !day.futuro ? { backgroundColor: color, borderColor: color } : {},
              day.futuro && styles.dayCircleFuturo
            ]}>
              {day.completado && !day.futuro && <Text style={styles.check}>✓</Text>}
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
  dayCircleFuturo: {
    opacity: 0.35,
    borderStyle: 'dashed',
  },
  check: {
    color: PALETTE.surfaceContainerLowest,
    fontSize: 14,
    fontWeight: '700',
  },
});
