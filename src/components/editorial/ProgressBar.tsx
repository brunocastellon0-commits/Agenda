import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PALETTE } from '../../theme/theme';

interface Props {
  /** Porcentaje 0–100 (se recorta acá: es presentación, no lógica de negocio). */
  pct: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Indicador de progreso lineal. Reutiliza los tracks ad-hoc que hoy se repiten
 * en DistributionCard / ProjectsProgressCard / TodaySummaryCard.
 */
export function ProgressBar({
  pct,
  color = PALETTE.accent,
  trackColor = PALETTE.hairline,
  height = 6,
  style,
}: Props) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: trackColor, height, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
