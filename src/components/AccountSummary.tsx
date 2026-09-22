import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { Billetera } from '../repositories/billetera';
import { signoDivisa } from '../utils/divisas';

interface Props {
  cuenta: Billetera;
  ingresosMes: number;
  egresosMes: number;
  onIngreso: () => void;
  onEgreso: () => void;
  onTransferir: () => void;
}

export function AccountSummary({ cuenta, ingresosMes, egresosMes, onIngreso, onEgreso, onTransferir }: Props) {
  const signo = signoDivisa(cuenta.divisa);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.nombre} numberOfLines={1}>
            {cuenta.nombre}
          </Text>
          <Text style={styles.rowLabel}>Entidad: {cuenta.entidad}</Text>
        </View>
        <View style={styles.divisaChip}>
          <MaterialIcons name="currency-exchange" size={13} color={PALETTE.onAccent} />
          <Text style={styles.divisaChipText}>{cuenta.divisa}</Text>
        </View>
      </View>

      <Text style={styles.saldoLabel}>SALDO ACTUAL</Text>
      <Text style={styles.saldo} numberOfLines={1}>
        {signo}
        {cuenta.monto.toFixed(2)}
      </Text>

      <View style={styles.mensualRow}>
        <View style={styles.mensualBox}>
          <Text style={styles.mensualValor}>{signo}{ingresosMes.toFixed(2)}</Text>
          <Text style={styles.mensualLabel}>Ingresos del mes</Text>
        </View>
        <View style={styles.mensualBox}>
          <Text style={[styles.mensualValor, styles.mensualEgreso]}>{signo}{egresosMes.toFixed(2)}</Text>
          <Text style={styles.mensualLabel}>Egresos del mes</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TintPill color={PALETTE.categorias.finanzas} radius={14} style={styles.glowAction}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionIngreso, pressed && pressedFeedback]}
            onPress={onIngreso}
          >
            <MaterialIcons name="add" size={18} color={PALETTE.onDark} />
            <Text style={styles.actionText}>Ingreso</Text>
          </Pressable>
        </TintPill>
        <TintPill color={PALETTE.categorias.importante} radius={14} style={styles.glowAction}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionEgreso, pressed && pressedFeedback]}
            onPress={onEgreso}
          >
            <MaterialIcons name="remove" size={18} color={PALETTE.onDark} />
            <Text style={styles.actionText}>Salida</Text>
          </Pressable>
        </TintPill>
        <TintPill color={PALETTE.categorias.trabajo} radius={14} style={styles.glowAction}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionTransferir, pressed && pressedFeedback]}
            onPress={onTransferir}
          >
            <MaterialIcons name="swap-horiz" size={18} color={PALETTE.onDark} />
            <Text style={styles.actionText}>Transferir</Text>
          </Pressable>
        </TintPill>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...SHADOW.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  rowLabel: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
  },
  divisaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.categorias.finanzas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  divisaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
  saldoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: PALETTE.onSurfaceVariant,
  },
  saldo: {
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.categorias.finanzas,
  },
  mensualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mensualBox: {
    flex: 1,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  mensualValor: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.categorias.finanzas,
  },
  mensualEgreso: {
    color: PALETTE.categorias.critico,
  },
  mensualLabel: {
    fontSize: 11,
    color: PALETTE.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glowAction: {
    flex: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionIngreso: {
    backgroundColor: PALETTE.categorias.finanzas,
  },
  actionEgreso: {
    backgroundColor: PALETTE.categorias.importante,
  },
  actionTransferir: {
    backgroundColor: PALETTE.categorias.trabajo,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onDark,
  },
});