import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW, RADIUS, pressedFeedback } from '../theme/theme';

import { ResumenNutricional } from '../repositories/comidaRepo';
import { formatEstimado } from '../utils/nutricion';

interface Props {
  comidasCount: number;
  ultimaComida: string | null;
  resumenNutricional: ResumenNutricional;
  onPress?: () => void;
}

function capitalizar(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FoodSummaryCard({ comidasCount, ultimaComida, resumenNutricional, onPress }: Props) {
  // Sin ítems estimados no hay dato calórico calculable → '—', nunca 0.
  const hayEstimacion = resumenNutricional.itemsEstimados > 0;

  const body = (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="restaurant" size={20} color={PALETTE.categorias.ocio} />
          <Text style={styles.title}>Alimentación</Text>
        </View>
        {onPress && <MaterialIcons name="chevron-right" size={20} color={PALETTE.outline} />}
      </View>

      <View style={styles.content}>
        {comidasCount === 0 ? (
          <Text style={styles.countText}>Aún no registraste comidas este día</Text>
        ) : (
          <>
            <View style={styles.macroRow}>
              <Text style={styles.kcalText}>
                {hayEstimacion ? formatEstimado(resumenNutricional.kcal, ' kcal') : '—'}
              </Text>
              <Text style={styles.macrosText}>
                P: {hayEstimacion ? formatEstimado(resumenNutricional.prot, 'g') : '—'} · C: {hayEstimacion ? formatEstimado(resumenNutricional.carb, 'g') : '—'} · G: {hayEstimacion ? formatEstimado(resumenNutricional.grasa, 'g') : '—'}
              </Text>
            </View>
            <Text style={styles.subText}>
              {comidasCount} {comidasCount === 1 ? 'comida' : 'comidas'}
              {ultimaComida ? ` · Última: ${capitalizar(ultimaComida)}` : ''}
            </Text>
          </>
        )}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && pressedFeedback]}
      onPress={onPress}
    >
      {body}
    </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  content: {
    gap: 4,
  },
  countText: {
    fontSize: 14,
    color: PALETTE.ink,
    fontWeight: '500',
  },
  subText: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  kcalText: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  macrosText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    fontWeight: '500',
  },
});
