import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PALETTE, TYPE } from '../../theme/theme';

interface Props {
  /** Texto del eyebrow (se pinta en mayúsculas por TYPE.label). */
  text: string;
  /** Indicador de color semántico. Por defecto, la identidad. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Etiqueta editorial de sección: indicador de color + label en mayúsculas.
 * Unifica los tres estilos de título de sección que coexistían en las screens.
 */
export function Eyebrow({ text, color = PALETTE.primary, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.marker, { backgroundColor: color }]} />
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marker: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  text: {
    ...TYPE.label,
    flexShrink: 1,
  },
});
