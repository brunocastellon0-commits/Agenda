import React from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { tint } from '../theme/theme';

interface Props {
  color: string;
  radius?: number;
  alpha?: number; // 0 – 1, default 0.12
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function TintPill({ color, radius = 16, alpha = 0.12, style, children }: Props) {
  return (
    <View style={[{ backgroundColor: tint(color, alpha), borderRadius: radius }, styles.pill, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    overflow: 'hidden',
  },
});