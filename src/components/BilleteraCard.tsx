import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE } from '../theme/theme';
import { Billetera } from '../repositories/billetera';

interface Props {
  billetera: Billetera;
}

export function BilleteraCard({ billetera }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {billetera.nombre}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {billetera.entidad}
          </Text>
        </View>
        <View style={styles.cardAmount}>
          <Text style={styles.amount}>{billetera.monto.toFixed(2)}</Text>
          <View style={styles.divisaChip}>
            <MaterialIcons name="currency-exchange" size={12} color={PALETTE.primary} />
            <Text style={styles.divisaText}>{billetera.divisa}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: PALETTE.categorias.finanzas,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
  },
  cardAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.categorias.finanzas,
  },
  divisaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  divisaText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.primary,
  },
});