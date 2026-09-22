import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { Pago } from '../repositories/pagos';
import { validarMonto, parseNumero } from '../utils/validacion';
import { signoDivisa, formatMonto } from '../utils/divisas';

interface Props {
  visible: boolean;
  pago: Pago | null;
  saldo: number;
  divisa: string;
  onClose: () => void;
  onSave: (monto: number) => void;
}

export function PayPagoModal({ visible, pago, saldo, divisa, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMonto('');
      setError(null);
    }
  }, [visible]);

  if (!pago) {
    return null;
  }

  const signo = signoDivisa(divisa);
  const pagado = pago.pagado ?? 0;
  const restante = pago.monto - pagado;
  const completo = pagado >= pago.monto;

  const handleCompletar = () => {
    if (saldo < restante) {
      setError('Saldo insuficiente en la cuenta para completar el pago.');
      return;
    }
    onSave(restante);
  };

  const handleAbonar = () => {
    const errorMonto = validarMonto(monto, restante);
    if (errorMonto !== null) {
      setError(`El monto no puede superar lo pendiente (${signo}${formatMonto(restante)}).`);
      return;
    }
    const numero = parseNumero(monto);
    if (numero > saldo) {
      setError(`Supera el saldo disponible (${signo}${formatMonto(saldo)}).`);
      return;
    }
    setError(null);
    onSave(numero);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pagar: {pago.nombre}</Text>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.infoValor}>{signo}{formatMonto(pago.monto)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Pagado</Text>
              <Text style={styles.infoValor}>{signo}{formatMonto(pagado)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Restante</Text>
              <Text style={[styles.infoValor, styles.infoRestante]}>{signo}{formatMonto(restante)}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Saldo disponible</Text>
            <Text style={styles.infoValor}>{signo}{formatMonto(saldo)}</Text>
          </View>

          {completo ? (
            <View style={styles.completoRow}>
              <MaterialIcons name="check-circle" size={18} color={PALETTE.ink} />
              <Text style={styles.completoText}>
                Este pago ya está completo{pago.tipo === 'mensual' ? ' este mes' : ''}.
              </Text>
            </View>
          ) : (
            <>
              <TintPill color={PALETTE.categorias.finanzas} radius={14}>
                <Pressable style={({ pressed }) => [styles.completarButton, pressed && pressedFeedback]} onPress={handleCompletar}>
                  <Text style={styles.completarText}>
                    Completar ({signo}{formatMonto(restante)})
                  </Text>
                </Pressable>
              </TintPill>

              <View style={styles.partialGroup}>
                <Text style={styles.inputLabel}>O abonar un monto parcial</Text>
                <TextInput
                  style={[styles.textInput, error !== null && styles.textInputError]}
                  value={monto}
                  onChangeText={(texto) => {
                    setMonto(texto);
                    setError(null);
                  }}
                  keyboardType="decimal-pad"
                  placeholder={restante.toFixed(2)}
                  placeholderTextColor={PALETTE.outline}
                />
                <TintPill color={PALETTE.categorias.trabajo} radius={14}>
                  <Pressable style={({ pressed }) => [styles.abonarButton, pressed && pressedFeedback]} onPress={handleAbonar}>
                    <Text style={styles.abonarText}>Abonar</Text>
                  </Pressable>
                </TintPill>
                {error !== null && <Text style={styles.errorText}>{error}</Text>}
              </View>
            </>
          )}

          <View style={styles.modalActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && pressedFeedback]} onPress={onClose}>
              <Text style={styles.cancelText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 24, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
    ...SHADOW.modal,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.ink, flex: 1 },
  iconButton: { padding: 4 },
  infoGrid: { flexDirection: 'row', gap: 8 },
  infoBox: {
    flex: 1,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  infoLabel: { fontSize: 10, fontWeight: '600', color: PALETTE.onSurfaceVariant },
  infoValor: { fontSize: 13, fontWeight: '800', color: PALETTE.categorias.finanzas },
  infoRestante: { color: PALETTE.categorias.critico },
  completoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 12,
  },
  completoText: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    flex: 1,
  },
  completarButton: {
    backgroundColor: PALETTE.categorias.finanzas,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completarText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.onDark,
  },
  partialGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: PALETTE.onSurfaceVariant },
  textInput: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: PALETTE.ink,
  },
  textInputError: {
    borderWidth: 1,
    borderColor: PALETTE.categorias.critico,
  },
  abonarButton: {
    backgroundColor: PALETTE.categorias.trabajo,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  abonarText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.onDark,
  },
  errorText: { fontSize: 11, color: PALETTE.categorias.critico },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 4 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: PALETTE.ink },
});