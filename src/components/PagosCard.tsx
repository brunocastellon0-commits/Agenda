import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { Pago } from '../repositories/pagos';
import { signoDivisa, formatMonto } from '../utils/divisas';

interface Props {
  pagos: Pago[];
  divisa: string;
  saldo: number;
  cargando?: boolean;
  onAddPago: () => void;
  onPagar: (pago: Pago) => void;
  onDelete: (pago: Pago) => void;
}

export function PagosCard({ pagos, divisa, saldo, cargando, onAddPago, onPagar, onDelete }: Props) {
  const signo = signoDivisa(divisa);

  const comprometido = pagos.reduce((acc, p) => acc + p.monto, 0);
  const pagadoTotal = pagos.reduce((acc, p) => acc + (p.pagado ?? 0), 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitle}>
          <MaterialIcons name="receipt-long" size={18} color={PALETTE.ink} />
          <Text style={styles.title}>Pagos de la cuenta</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onAddPago}>
          <MaterialIcons name="add" size={20} color={PALETTE.ink} />
        </Pressable>
      </View>

      <View style={styles.totalesRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Comprometido</Text>
          <Text style={styles.totalValor}>
            {signo}
            {formatMonto(comprometido)}
          </Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Pagado</Text>
          <Text style={[styles.totalValor, styles.totalPagado]}>
            {signo}
            {formatMonto(pagadoTotal)}
          </Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Disponible</Text>
          <Text style={styles.totalValor}>
            {signo}
            {formatMonto(saldo)}
          </Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.emptyRow}>
          <ActivityIndicator size="small" color={PALETTE.ink} />
          <Text style={styles.emptyText}>Cargando pagos…</Text>
        </View>
      ) : pagos.length === 0 ? (
        <View style={styles.emptyRow}>
          <MaterialIcons name="receipt-long" size={20} color={PALETTE.ink} />
          <Text style={styles.emptyText}>
            Sin pagos asignados. Tocá "+" para crear el primero (único o mensual).
          </Text>
        </View>
      ) : (
        pagos.map((p) => {
          const pagado = p.pagado ?? 0;
          const restante = p.monto - pagado;
          const completo = restante <= 0;
          const esMensual = p.tipo === 'mensual';
          const progreso = p.monto > 0 ? Math.min(pagado / p.monto, 1) : 0;

          return (
            <View key={p.id} style={styles.pagoRow}>
              <View style={styles.pagoHeader}>
                <View style={styles.pagoInfo}>
                  <Text style={styles.pagoNombre} numberOfLines={1}>{p.nombre}</Text>
                  <Text style={styles.pagoTipo}>
                    {esMensual ? 'Mensual' : 'Único'}
                  </Text>
                </View>
                <View style={styles.pagoActions}>
                  {completo ? (
                    <View style={[styles.badge, styles.badgeCompleto]}>
                      <MaterialIcons name="check-circle" size={12} color={PALETTE.onDark} />
                      <Text style={[styles.badgeText, styles.badgeTextCompleto]}>
                        {esMensual ? 'Pagado este mes' : 'Pagado'}
                      </Text>
                    </View>
                  ) : (
                    <TintPill color={PALETTE.categorias.finanzas} radius={14}>
                      <Pressable
                        style={({ pressed }) => [styles.pagarButton, pressed && pressedFeedback]}
                        onPress={() => onPagar(p)}
                      >
                        <Text style={styles.pagarText}>Pagar</Text>
                      </Pressable>
                    </TintPill>
                  )}
                  <Pressable style={({ pressed }) => [styles.deleteButton, pressed && pressedFeedback]} onPress={() => onDelete(p)}>
                    <MaterialIcons name="delete-outline" size={18} color={PALETTE.ink} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.pagoMeta}>
                <Text style={styles.pagoMontos}>
                  {signo}
                  {formatMonto(pagado)} / {signo}
                  {formatMonto(p.monto)}
                </Text>
                {!completo && (
                  <Text style={styles.pagoRestante}>Faltan {signo}{formatMonto(restante)}</Text>
                )}
              </View>

              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(progreso * 100)}%` }]} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...SHADOW.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  iconButton: { padding: 4 },
  totalesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  totalBox: {
    flex: 1,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  totalValor: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  totalPagado: {
    color: PALETTE.categorias.finanzas,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 12,
  },
  emptyText: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    flex: 1,
  },
  pagoRow: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  pagoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pagoInfo: {
    flex: 1,
    gap: 2,
  },
  pagoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  pagoTipo: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  pagoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pagarButton: {
    backgroundColor: PALETTE.categorias.finanzas,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pagarText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
  deleteButton: { padding: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeCompleto: {
    backgroundColor: PALETTE.categorias.finanzas,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  badgeTextCompleto: {
    color: PALETTE.onDark,
  },
  pagoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagoMontos: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  pagoRestante: {
    fontSize: 10,
    color: PALETTE.onSurfaceVariant,
  },
  track: {
    height: 6,
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PALETTE.categorias.finanzas,
  },
});