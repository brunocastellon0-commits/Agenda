import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PALETTE, TYPE } from '../../theme/theme';

type Tone = 'ink' | 'primary' | 'accent' | 'onColor';

interface Props {
  /** Valor ya formateado por el caller (no se formatea ni se inventa acá). */
  value: string;
  /** Unidad chica junto al número ("kcal", "%", "días"). */
  unit?: string;
  /** Etiqueta bajo el número. */
  label?: string;
  size?: 'display' | 'displaySm';
  tone?: Tone;
  /** Para bloques de color: label sobre fondo sólido. */
  labelTone?: Tone;
  /** Color de área (sobrescribe `tone`): naranja, verde, etc. */
  color?: string;
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
}

const COLOR: Record<Tone, string> = {
  ink: PALETTE.ink,
  primary: PALETTE.primary,
  accent: PALETTE.accent,
  onColor: PALETTE.onAccent,
};

/**
 * Número grande como elemento gráfico (jerarquía editorial).
 * El dato real lo aporta la pantalla; este componente solo lo compone.
 */
export function BigNumber({
  value,
  unit,
  label,
  size = 'display',
  tone = 'ink',
  labelTone,
  color,
  labelColor,
  style,
}: Props) {
  const numberStyle = size === 'display' ? styles.display : styles.displaySm;
  const valueColor = color ?? COLOR[tone];
  const textLabelColor = labelColor ?? COLOR[labelTone ?? 'ink'];

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.valueRow}>
        <Text style={[numberStyle, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.unit, { color: valueColor }]} numberOfLines={1}>
            {unit}
          </Text>
        ) : null}
      </View>
      {label ? (
        <Text style={[styles.label, { color: textLabelColor }]} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  display: {
    ...TYPE.display,
  },
  displaySm: {
    ...TYPE.displaySm,
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  label: {
    ...TYPE.label,
  },
});
