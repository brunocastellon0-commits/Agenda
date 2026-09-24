import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW, RADIUS, pressedFeedback } from '../theme/theme';

interface Props {
  comidasCount: number;
  ultimaComida: string | null; // e.g. "Cena · 21:10"
  onPress: () => void;
}

function capitalizar(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FoodSummaryCard({ comidasCount, ultimaComida, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="restaurant" size={20} color={PALETTE.categorias.ocio} />
          <Text style={styles.title}>Alimentación</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={PALETTE.outline} />
      </View>

      <View style={styles.content}>
        <Text style={styles.countText}>
          {comidasCount === 0 
            ? 'Aún no registraste comidas hoy' 
            : `${comidasCount} comida${comidasCount > 1 ? 's' : ''} registrada${comidasCount > 1 ? 's' : ''} hoy`
          }
        </Text>
        {ultimaComida && (
          <Text style={styles.subText}>Último registro · {capitalizar(ultimaComida)}</Text>
        )}
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
});
