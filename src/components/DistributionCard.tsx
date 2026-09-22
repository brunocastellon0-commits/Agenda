import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, SHADOW } from '../theme/theme';

export function DistributionCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Distribución por Categoría</Text>
      
      <View style={styles.barContainer}>
        {/* Categoría 1 */}
        <View style={styles.barItem}>
          <View style={styles.labelRow}>
            <Text style={styles.categoryLabel}>Salud & Físico</Text>
            <Text style={styles.percentageLabel}>45%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '45%', backgroundColor: PALETTE.categorias.finanzas }]} />
          </View>
        </View>

        {/* Categoría 2 */}
        <View style={styles.barItem}>
          <View style={styles.labelRow}>
            <Text style={styles.categoryLabel}>Trabajo & Estudio</Text>
            <Text style={styles.percentageLabel}>35%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '35%', backgroundColor: PALETTE.categorias.trabajo }]} />
          </View>
        </View>

        {/* Categoría 3 */}
        <View style={styles.barItem}>
          <View style={styles.labelRow}>
            <Text style={styles.categoryLabel}>Mindfulness</Text>
            <Text style={styles.percentageLabel}>20%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '20%', backgroundColor: PALETTE.categorias.objetivos }]} />
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
    gap: 16,
    ...SHADOW.card,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  barContainer: {
    gap: 12,
  },
  barItem: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  percentageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  track: {
    height: 10,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});