import React, { useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { CuentaCard, CuentaCardData } from './CuentaCard';
import { PALETTE } from '../theme/theme';
import { TintPill } from './TintPill';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_SPACING = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

interface Props {
  cuentas: CuentaCardData[];
  selectedIndex: number;
  onSelectCuenta: (index: number) => void;
}

export const WalletCarousel = React.memo(({ cuentas, selectedIndex, onSelectCuenta }: Props) => {
  const flatListRef = useRef<FlatList<CuentaCardData>>(null);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      if (index >= 0 && index < cuentas.length && index !== selectedIndex) {
        onSelectCuenta(index);
      }
    },
    [cuentas.length, selectedIndex, onSelectCuenta]
  );

  const handleCardPress = useCallback(
    (index: number) => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      onSelectCuenta(index);
    },
    [onSelectCuenta]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={cuentas}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_SPACING / 2,
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isSelected = index === selectedIndex;
          const slide = (
            <Pressable
              onPress={() => handleCardPress(index)}
              style={
                isSelected
                  ? [styles.slide, styles.selected]
                  : [styles.slide, styles.unselected, { marginRight: CARD_SPACING }]
              }
            >
              <CuentaCard data={item} />
            </Pressable>
          );
          return isSelected ? (
            <TintPill color={PALETTE.categorias.finanzas} radius={20} style={{ marginRight: CARD_SPACING }}>
              {slide}
            </TintPill>
          ) : slide;
        }}
      />

      <View style={styles.dotsRow}>
        {cuentas.map((cuenta, index) => (
          <View
            key={cuenta.id}
            style={[styles.dot, index === selectedIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  slide: {
    width: CARD_WIDTH,
    borderRadius: 20,
  },
  selected: {
    transform: [{ scale: 1 }],
    opacity: 1,
    zIndex: 2,
  },
  unselected: {
    transform: [{ scale: 0.88 }],
    opacity: 0.65,
    zIndex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.hairline,
  },
  dotActive: {
    backgroundColor: PALETTE.ink,
    width: 20,
  },
});