import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW } from '../theme/theme';
import { DistribucionArea } from '../repositories/metricasRepo';

interface Props {
  distribucion: DistribucionArea[];
}

export default function TimeDistributionCard({ distribucion }: Props) {
  const totalMin = distribucion.reduce((acc, curr) => acc + curr.tiempoRealMin, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Distribución del Tiempo</Text>
      {distribucion.length === 0 ? (
        <Text style={styles.empty}>No hay datos de tiempo en este período.</Text>
      ) : (
        <View style={styles.list}>
          {distribucion.map((area) => {
            const pct = totalMin > 0 ? Math.round((area.tiempoRealMin / totalMin) * 100) : 0;
            const hours = Math.round((area.tiempoRealMin / 60) * 10) / 10;
            const iconName = (area.emoji as keyof typeof MaterialIcons.glyphMap) || 'folder';

            return (
              <View key={area.tipo_actividad_id} style={styles.row}>
                <View style={styles.labelRow}>
                  <View style={styles.iconTitleRow}>
                    <MaterialIcons name={iconName} size={16} color={area.color || PALETTE.primary} />
                    <Text style={styles.label} numberOfLines={1}>
                      {area.nombre}
                    </Text>
                  </View>
                  <Text style={styles.stats}>
                    {pct}% ({hours}h)
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: area.color || PALETTE.primary }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  empty: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
  list: {
    gap: 12,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
    marginRight: 8,
  },
  stats: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
  },
  track: {
    height: 8,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
