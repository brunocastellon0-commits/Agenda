import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW } from '../theme/theme';

export function ComparisonCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Comparativa Mensual</Text>
      <Text style={styles.subtitle}>Hábitos completados frente al mes anterior</Text>

      <View style={styles.comparisonRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Mes Anterior</Text>
          <Text style={styles.statValue}>112</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Mes Actual</Text>
          <View style={styles.currentStatWrapper}>
            <Text style={[styles.statValue, styles.highlightText]}>145</Text>
            <MaterialIcons name="trending-up" size={20} color={PALETTE.primary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...SHADOW.card,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: PALETTE.hairline,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  currentStatWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  highlightText: {
    color: PALETTE.categorias.finanzas,
  },
});