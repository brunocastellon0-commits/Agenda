import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { Billetera } from '../repositories/billetera';
import { validarTexto, validarMonto } from '../utils/validacion';

interface Props {
  visible: boolean;
  origen: Billetera;
  destinos: Billetera[];
  onClose: () => void;
  onSave: (transferencia: { billetera_destino_id: number; titulo: string; monto: number }) => void;
}

const DIVISA_SIGNOS: Record<string, string> = {
  BOB: 'Bs ',
  USD: 'US$ ',
  EUR: '€ ',
  ARS: '$ ',
  PEN: 'S/ ',
  MXN: '$ ',
  CLP: '$ ',
  VES: 'Bs. ',
};

export function TransferModal({ visible, origen, destinos, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('Transferencia');
  const [monto, setMonto] = useState('');

  const [errores, setErrores] = useState<{ destino: string | null; titulo: string | null; monto: string | null }>({
    destino: null,
    titulo: null,
    monto: null,
  });

  useEffect(() => {
    if (visible) {
      setDestinoId(destinos[0]?.id ?? null);
      setTitulo('Transferencia');
      setMonto('');
      setErrores({ destino: null, titulo: null, monto: null });
      setMonto('');
    }
  }, [visible, destinos]);

  const destinoSeleccionado = destinos.find((d) => d.id === destinoId) ?? null;
  const divisasDistintas = destinoSeleccionado !== null && destinoSeleccionado.divisa !== origen.divisa;

  const handleGuardar = () => {
    const nuevosErrores = {
      destino: destinoId === null ? 'Seleccioná una cuenta de destino' : divisasDistintas ? 'Las cuentas deben tener la misma divisa' : null,
      titulo: validarTexto(titulo, 2, 60, 'Título'),
      monto: validarMonto(monto, Math.max(1, Math.round(origen.monto * 100) / 100)),
    };
    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some((error) => error !== null)) {
      return;
    }

    onSave({
      billetera_destino_id: destinoId!,
      titulo: titulo.trim(),
      monto: parseFloat(monto.replace(',', '.')),
    });
  };

  const signo = DIVISA_SIGNOS[origen.divisa] ?? '';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transferir</Text>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Desde {origen.nombre} · Disponible: {signo}
            {origen.monto.toFixed(2)}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cuenta destino</Text>
              {destinos.length === 0 ? (
                <Text style={styles.sinCuentas}>No tenés otras cuentas para transferir.</Text>
              ) : (
                destinos.map((d) => {
                  const selected = d.id === destinoId;
                  const compatible = d.divisa === origen.divisa;
                  return (
                    <Pressable
                      key={d.id}
                      style={({ pressed }) => [styles.destinoRow, selected && styles.destinoRowSelected, pressed && pressedFeedback]}
                      onPress={() => setDestinoId(d.id ?? null)}
                    >
                      <MaterialIcons
                        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={selected ? PALETTE.ink : PALETTE.outline}
                      />
                      <View style={styles.destinoInfo}>
                        <Text style={styles.destinoNombre} numberOfLines={1}>{d.nombre}</Text>
                        <Text style={styles.destinoMeta} numberOfLines={1}>
                          {d.entidad} · {d.divisa}
                        </Text>
                      </View>
                      {!compatible && <Text style={styles.incompatible}>Divisa distinta</Text>}
                    </Pressable>
                  );
                })
              )}
              {errores.destino !== null && <Text style={styles.errorText}>{errores.destino}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={[styles.textInput, errores.titulo !== null && styles.textInputError]}
                value={titulo}
                onChangeText={setTitulo}
                maxLength={60}
              />
              {errores.titulo !== null && <Text style={styles.errorText}>{errores.titulo}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monto</Text>
              <TextInput
                style={[styles.textInput, errores.monto !== null && styles.textInputError]}
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
              />
              {errores.monto !== null && <Text style={styles.errorText}>{errores.monto}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && pressedFeedback]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <TintPill color={PALETTE.categorias.trabajo} radius={16}>
              <Pressable style={({ pressed }) => [styles.saveButton, divisasDistintas && styles.saveButtonDisabled, pressed && !divisasDistintas && pressedFeedback]} onPress={handleGuardar}>
                <Text style={styles.saveText}>Transferir</Text>
              </Pressable>
            </TintPill>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
    ...SHADOW.modal,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.ink },
  subtitle: { fontSize: 12, color: PALETTE.onSurfaceVariant },
  iconButton: { padding: 4 },
  inputGroup: { gap: 6 },
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
  errorText: { fontSize: 11, color: PALETTE.categorias.critico },
  sinCuentas: { fontSize: 13, color: PALETTE.onSurfaceVariant },
  destinoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 12,
  },
  destinoRowSelected: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: PALETTE.categorias.trabajo,
  },
  destinoInfo: { flex: 1 },
  destinoNombre: { fontSize: 14, fontWeight: '600', color: PALETTE.ink },
  destinoMeta: { fontSize: 12, color: PALETTE.onSurfaceVariant },
  incompatible: { fontSize: 11, fontWeight: '600', color: PALETTE.categorias.critico },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 4 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: PALETTE.ink },
  saveButton: {
    backgroundColor: PALETTE.categorias.trabajo,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveText: { fontSize: 13, fontWeight: '700', color: PALETTE.onDark },
});