import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, SHADOW } from '../theme/theme';
import { ResumenGeneral } from '../repositories/metricasRepo';

interface Props {
  resumen: ResumenGeneral | null;
}

export default function PlanningReliabilityCard({ resumen }: Props) {
  if (!resumen || resumen.totalPlanificadas === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Confiabilidad de Planificación</Text>
        <Text style={styles.empty}>No hay actividades planificadas.</Text>
      </View>
    );
  }

  const { totalPlanificadas, completadas, reprogramadas, canceladas, noRealizadas } = resumen;
  const pct = (val: number) => Math.round((val / totalPlanificadas) * 100);

  const completadasPct = pct(completadas);
  const reprogramadasPct = pct(reprogramadas);
  const canceladasPct = pct(canceladas);
  const noRealizadasPct = pct(noRealizadas);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Confiabilidad de Planificación</Text>
      
      <View style={styles.bar}>
        {completadasPct > 0 && <View style={[styles.segment, { width: `${completadasPct}%`, backgroundColor: PALETTE.primary }]} />}
        {reprogramadasPct > 0 && <View style={[styles.segment, { width: `${reprogramadasPct}%`, backgroundColor: PALETTE.categorias.importante }]} />}
        {canceladasPct > 0 && <View style={[styles.segment, { width: `${canceladasPct}%`, backgroundColor: PALETTE.categorias.critico }]} />}
        {noRealizadasPct > 0 && <View style={[styles.segment, { width: `${noRealizadasPct}%`, backgroundColor: PALETTE.outline }]} />}
      </View>

      <View style={styles.legend}>
        <LegendItem label="Completadas" pct={completadasPct} color={PALETTE.primary} />
        <LegendItem label="Reprogramadas" pct={reprogramadasPct} color={PALETTE.categorias.importante} />
        <LegendItem label="Canceladas" pct={canceladasPct} color={PALETTE.categorias.critico} />
        <LegendItem label="No realizadas" pct={noRealizadasPct} color={PALETTE.outline} />
      </View>
    </View>
  );
}

function LegendItem({ label, pct, color }: { label: string; pct: number; color: string }) {
  if (pct === 0) return null;
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label} ({pct}%)</Text>
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
  bar: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: PALETTE.surfaceContainer,
    marginBottom: 16,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
  },
});
