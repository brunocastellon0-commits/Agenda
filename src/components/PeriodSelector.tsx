import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, pressedFeedback } from '../theme/theme';
import { PeriodoMetricas } from '../repositories/metricasRepo';

interface Props {
  selected: PeriodoMetricas;
  onSelect: (periodo: PeriodoMetricas) => void;
}

const PERIODOS: { id: PeriodoMetricas; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
];

export default function PeriodSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {PERIODOS.map((p) => {
        const isSelected = p.id === selected;
        return (
          <Pressable
            key={p.id}
            style={({ pressed }) => [
              styles.pill,
              isSelected ? styles.pillSelected : styles.pillUnselected,
              pressed && pressedFeedback,
            ]}
            onPress={() => onSelect(p.id)}
          >
            <Text style={[styles.text, isSelected ? styles.textSelected : styles.textUnselected]}>
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: PALETTE.primary,
  },
  pillUnselected: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSelected: {
    color: PALETTE.onAccent,
  },
  textUnselected: {
    color: PALETTE.ink,
  },
});
