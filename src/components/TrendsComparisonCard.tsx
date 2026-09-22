import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, SHADOW } from '../theme/theme';
import { ComparativaPeriodo } from '../repositories/metricasRepo';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  comparativa: ComparativaPeriodo | null;
}

export default function TrendsComparisonCard({ comparativa }: Props) {
  if (!comparativa) return null;

  if (comparativa.sinDatosAnteriores) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Tendencias</Text>
        <Text style={styles.empty}>Sin datos suficientes en el período anterior para comparar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tendencias</Text>
      <View style={styles.grid}>
        <DeltaItem 
          label="Cumplimiento" 
          val={comparativa.deltaCumplimiento} 
          unit="%" 
          invertirColor={false} 
        />
        <DeltaItem 
          label="Horas" 
          val={comparativa.deltaHoras} 
          unit="h" 
          invertirColor={false} 
        />
        <DeltaItem 
          label="Actividades" 
          val={comparativa.deltaActividades} 
          unit="" 
          invertirColor={false} 
        />
      </View>
    </View>
  );
}

function DeltaItem({ label, val, unit, invertirColor }: { label: string; val: number | null; unit: string; invertirColor: boolean }) {
  if (val == null) {
    return (
      <View style={styles.item}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.val, { color: PALETTE.outline }]}>—</Text>
      </View>
    );
  }

  let color = PALETTE.outline;
  let iconName: 'trending-up' | 'trending-down' | 'trending-flat' = 'trending-flat';
  
  if (val > 0) {
    color = invertirColor ? PALETTE.categorias.critico : PALETTE.primary;
    iconName = 'trending-up';
  } else if (val < 0) {
    color = invertirColor ? PALETTE.primary : PALETTE.categorias.critico;
    iconName = 'trending-down';
  }

  const sign = val > 0 ? '+' : '';

  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valRow}>
        <MaterialIcons name={iconName} size={18} color={color} />
        <Text style={[styles.val, { color }]}>
          {sign}{val}{unit}
        </Text>
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
  empty: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 4,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  val: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
