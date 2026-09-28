import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SHADOW, tint } from '../../theme/theme';

type Variant = 'solid' | 'tint' | 'open';

interface Props {
  /**
   * solid = fill de color (texto en `onAccent`); tint = fondo muy suave;
   * open = sin fondo (composición directa sobre el lienzo).
   */
  variant?: Variant;
  /** Color semántico. Por defecto, la identidad. */
  color?: string;
  radius?: number;
  /** Profundidad real: solo para bloques hero (usar poco). */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Bloque cromático de la composición. NO es una card: sin borde y, por defecto,
 * sin sombra. Sirve para agrupar contenido con color con propósito.
 */
export function ColorBlock({
  variant = 'tint',
  color = PALETTE.primary,
  radius = RADIUS.block,
  elevated = false,
  style,
  children,
}: Props) {
  const backgroundColor =
    variant === 'solid' ? color : variant === 'tint' ? tint(color, 0.08) : 'transparent';

  return (
    <View
      style={[
        styles.block,
        { backgroundColor, borderRadius: radius },
        elevated && SHADOW.lift,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    padding: 20,
    overflow: 'hidden',
  },
});
