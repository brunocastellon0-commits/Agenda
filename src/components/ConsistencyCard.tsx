import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, SHADOW } from '../theme/theme';
import { MetricaConsistencia } from '../repositories/metricasRepo';

interface Props {
  consistencia: MetricaConsistencia | null;
}

export default function ConsistencyCard({ consistencia }: Props) {
  if (!consistencia) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Consistencia</Text>
      
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.rachaActual}>🔥 {consistencia.rachaActual} días</Text>
          <Text style={styles.label}>Racha actual</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.rachaMaxima}>{consistencia.rachaMaxima} días</Text>
          <Text style={styles.label}>Racha máxima</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    ...SHADOW.card,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
  },
  rachaActual: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PALETTE.categorias.ocio,
  },
  rachaMaxima: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.onSurfaceVariant,
  },
  label: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 4,
  },
});
