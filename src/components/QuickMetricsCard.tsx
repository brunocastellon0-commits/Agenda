import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';

interface QuickMetricsCardProps {
  rachaDias: number;
  cumplimientoPct: number;
  topAreaNombre?: string;
  onNavigateMetricas: () => void;
}

export function QuickMetricsCard({
  rachaDias,
  cumplimientoPct,
  topAreaNombre = 'Trabajo',
  onNavigateMetricas,
}: QuickMetricsCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && pressedFeedback]}
      onPress={onNavigateMetricas}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: tint(PALETTE.categorias.objetivos) }]}>
            <MaterialIcons name="insights" size={20} color={PALETTE.categorias.objetivos} />
          </View>
          <Text style={styles.title}>Rendimiento & Métricas</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={PALETTE.onSurfaceVariant} />
      </View>

      <View style={styles.grid}>
        {/* Racha */}
        <View style={styles.statBox}>
          <View style={styles.statTop}>
            <MaterialIcons name="local-fire-department" size={18} color={PALETTE.categorias.ocio} />
            <Text style={styles.statLabel}>Racha Activa</Text>
          </View>
          <Text style={styles.statValue}>{rachaDias} días</Text>
          <Text style={styles.statSub}>Consecutivos</Text>
        </View>

        {/* Cumplimiento */}
        <View style={styles.statBox}>
          <View style={styles.statTop}>
            <MaterialIcons name="verified" size={18} color={PALETTE.primary} />
            <Text style={styles.statLabel}>Cumplimiento</Text>
          </View>
          <Text style={styles.statValue}>{cumplimientoPct}%</Text>
          <Text style={styles.statSub}>Tasa semanal</Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 14,
    padding: 12,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 2,
  },
  statSub: {
    fontSize: 11,
    color: PALETTE.onSurfaceVariant,
  },
});
