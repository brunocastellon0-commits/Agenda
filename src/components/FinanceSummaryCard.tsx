import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme';
import { formatMonto, signoDivisa } from '../utils/divisas';

interface FinanceSummaryCardProps {
  saldoTotal: number;
  divisaPrincipal: string;
  pagosPendientesCount: number;
  cuentasCount: number;
  onPress: () => void;
}

export function FinanceSummaryCard({
  saldoTotal,
  divisaPrincipal = 'BOB',
  pagosPendientesCount,
  cuentasCount,
  onPress,
}: FinanceSummaryCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#16876A', '#0D5C49']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.tagRow}>
            <MaterialIcons name="account-balance-wallet" size={18} color="#A7F3D0" />
            <Text style={styles.tagText}>Resumen Financiero</Text>
          </View>
          <View style={styles.arrowBox}>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>Saldo Consolidado Líquido</Text>
          <Text style={styles.monto}>
            {signoDivisa(divisaPrincipal)}{formatMonto(saldoTotal)}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.infoBadge}>
            <MaterialIcons name="credit-card" size={14} color="#A7F3D0" />
            <Text style={styles.infoText}>
              {cuentasCount} {cuentasCount === 1 ? 'cuenta activa' : 'cuentas activas'}
            </Text>
          </View>

          {pagosPendientesCount > 0 ? (
            <View style={styles.alertBadge}>
              <Text style={styles.alertText}>
                {pagosPendientesCount} {pagosPendientesCount === 1 ? 'pago pendiente' : 'pagos pendientes'}
              </Text>
            </View>
          ) : (
            <View style={styles.okBadge}>
              <Text style={styles.okText}>Sin vencimientos</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.cards,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  gradient: {
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  monto: {
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.onAccent,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E6F4F1',
  },
  alertBadge: {
    backgroundColor: 'rgba(231, 111, 81, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(231, 111, 81, 0.4)',
  },
  alertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD6CC',
  },
  okBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  okText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A7F3D0',
  },
});
