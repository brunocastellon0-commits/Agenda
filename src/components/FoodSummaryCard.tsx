import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, TYPE, pressedFeedback } from '../theme/theme';
import { Eyebrow, BigNumber, ColorBlock } from './editorial';

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
        <Eyebrow text="Alimentación" color={PALETTE.categorias.comida} />
        {onPress && <MaterialIcons name="chevron-right" size={20} color={PALETTE.categorias.comida} />}
      </View>

      <View style={styles.content}>
        {comidasCount === 0 ? (
          <Text style={styles.countText}>Aún no registraste comidas este día</Text>
        ) : (
          <>
            <BigNumber
              value={hayEstimacion ? formatEstimado(resumenNutricional.kcal, '') : '—'}
              unit={hayEstimacion ? 'kcal' : undefined}
              size="display"
              color={PALETTE.categorias.comida}
              label={
                `${comidasCount} ${comidasCount === 1 ? 'comida' : 'comidas'}` +
                (ultimaComida ? ` · última ${capitalizar(ultimaComida)}` : '')
              }
            />
            <View style={styles.macroRow}>
              <View style={styles.macroCell}>
                <Text style={styles.macroLabel}>Proteínas</Text>
                <Text style={styles.macroValue}>
                  {hayEstimacion ? formatEstimado(resumenNutricional.prot, 'g') : '—'}
                </Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroCell}>
                <Text style={styles.macroLabel}>Carbos</Text>
                <Text style={styles.macroValue}>
                  {hayEstimacion ? formatEstimado(resumenNutricional.carb, 'g') : '—'}
                </Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroCell}>
                <Text style={styles.macroLabel}>Grasas</Text>
                <Text style={styles.macroValue}>
                  {hayEstimacion ? formatEstimado(resumenNutricional.grasa, 'g') : '—'}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <ColorBlock variant="tint" color={PALETTE.categorias.comida} style={styles.card}>
        {body}
      </ColorBlock>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [pressed && pressedFeedback]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <ColorBlock variant="tint" color={PALETTE.categorias.comida} style={styles.card}>
        {body}
      </ColorBlock>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    gap: 8,
  },
  countText: {
    ...TYPE.body,
    color: PALETTE.ink,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
    paddingTop: 12,
  },
  macroCell: {
    flex: 1,
    gap: 2,
  },
  macroDivider: {
    width: 1,
    backgroundColor: PALETTE.hairline,
  },
  macroLabel: {
    ...TYPE.label,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: 0,
  },
});
