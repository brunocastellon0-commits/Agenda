import React, { useRef, useCallback, useEffect } from 'react';
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
import { PALETTE, pressedFeedback } from '../theme/theme';
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
  // Índice ya comunicado (se actualiza de forma síncrona) para no repetir commits.
  const committedRef = useRef(selectedIndex);
  // Offset real del carrusel, para sincronizar estado → scroll.
  const offsetRef = useRef(0);

  const commitIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= cuentas.length) return;
      if (index === committedRef.current) return;
      committedRef.current = index;
      onSelectCuenta(index);
    },
    [cuentas.length, onSelectCuenta]
  );

  // El índice se compromete en CADA evento de scroll: `onMomentumScrollEnd` solo
  // se emite si hay velocidad al soltar, por lo que arrastrar lento dejaba el
  // FlatList en la cuenta B y el resumen en la cuenta A.
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      offsetRef.current = offsetX;
      commitIndex(Math.round(offsetX / SNAP_INTERVAL));
    },
    [commitIndex]
  );

  const handleCardPress = useCallback(
    (index: number) => {
      // scrollToOffset en vez de scrollToIndex: evita el invariant de
      // VirtualizedList por la falta de getItemLayout con padding lateral.
      committedRef.current = index;
      offsetRef.current = Math.max(0, index * SNAP_INTERVAL);
      flatListRef.current?.scrollToOffset({ offset: offsetRef.current, animated: true });
      onSelectCuenta(index);
    },
    [onSelectCuenta]
  );

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      const offset = Math.max(0, info.index * SNAP_INTERVAL);
      offsetRef.current = offset;
      flatListRef.current?.scrollToOffset({ offset, animated: false });
      commitIndex(info.index);
    },
    [commitIndex]
  );

  // Selección cambiada por código (p. ej. cuenta recién creada) → mover el carrusel.
  useEffect(() => {
    committedRef.current = selectedIndex;
    const target = Math.max(0, selectedIndex * SNAP_INTERVAL);
    if (Math.abs(offsetRef.current - target) > 4) {
      offsetRef.current = target;
      flatListRef.current?.scrollToOffset({ offset: target, animated: true });
    }
  }, [selectedIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={cuentas}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        scrollEventThrottle={16}
        extraData={selectedIndex}
        contentContainerStyle={{
          // Centrado exacto: con este padding, la tarjeta i queda en el centro de
          // la pantalla justo con offset = i * SNAP_INTERVAL, que es exactamente
          // lo que handleScroll redondea para comprometer el índice.
          paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
        }}
        onScroll={handleScroll}
        onScrollEndDrag={handleScroll}
        onMomentumScrollEnd={handleScroll}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isSelected = index === selectedIndex;
          // Siempre el mismo árbol (TintPill > Pressable): alternar la raíz hacía
          // unmount/remount de la celda en medio del scroll y desincronizaba.
          return (
            <TintPill
              color={PALETTE.categorias.finanzas}
              alpha={isSelected ? 0.12 : 0}
              radius={20}
              style={{ marginRight: CARD_SPACING }}
            >
              <Pressable
                onPress={() => handleCardPress(index)}
                style={
                  isSelected
                    ? [styles.slide, styles.selected]
                    : [styles.slide, styles.unselected]
                }
              >
                <CuentaCard data={item} />
              </Pressable>
            </TintPill>
          );
        }}
      />

      <View style={styles.dotsRow}>
        {cuentas.map((cuenta, index) => (
          <Pressable
            key={cuenta.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver cuenta ${index + 1} de ${cuentas.length}`}
            hitSlop={6}
            onPress={() => handleCardPress(index)}
            style={({ pressed }) => [styles.dotBtn, pressed && pressedFeedback]}
          >
            <View style={[styles.dot, index === selectedIndex && styles.dotActive]} />
          </Pressable>
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
  dotBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
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