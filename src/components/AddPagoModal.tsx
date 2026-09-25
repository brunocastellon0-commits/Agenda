import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { TipoPago } from '../repositories/pagos';
import { validarTexto, validarMonto, parseNumero } from '../utils/validacion';

interface Props {
  visible: boolean;
  cuentaNombre: string;
  onClose: () => void;
  onSave: (pago: { nombre: string; monto: number; tipo: TipoPago }) => void;
}

const TIPOS: { key: TipoPago; label: string; descripcion: string }[] = [
  { key: 'individual', label: 'Único', descripcion: 'Se completa una vez' },
  { key: 'mensual', label: 'Mensual', descripcion: 'Se reinicia al iniciar el mes' },
];

export function AddPagoModal({ visible, cuentaNombre, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<TipoPago>('individual');

  const [errores, setErrores] = useState<{ nombre: string | null; monto: string | null }>({
    nombre: null,
    monto: null,
  });

  useEffect(() => {
    if (visible) {
      setNombre('');
      setMonto('');
      setTipo('individual');
      setErrores({ nombre: null, monto: null });
    }
  }, [visible]);

  const handleGuardar = () => {
    const nuevosErrores = {
      nombre: validarTexto(nombre, 2, 60, 'Nombre'),
      monto: validarMonto(monto),
    };
    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some((error) => error !== null)) {
      return;
    }

    onSave({
      nombre: nombre.trim(),
      monto: parseNumero(monto),
      tipo,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo pago</Text>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Cuenta: {cuentaNombre}</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del pago</Text>
              <TextInput
                style={[styles.textInput, errores.nombre !== null && styles.textInputError]}
                value={nombre}
                onChangeText={setNombre}
                maxLength={60}
                placeholder="Ej. Luz, Universidad, Netflix"
                placeholderTextColor={PALETTE.outline}
              />
              {errores.nombre !== null && <Text style={styles.errorText}>{errores.nombre}</Text>}
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de pago</Text>
              <View style={styles.tipoRow}>
                {TIPOS.map((t) => {
                  const selected = tipo === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      style={({ pressed }) => [styles.tipoCard, selected && styles.tipoCardSelected, pressed && pressedFeedback]}
                      onPress={() => setTipo(t.key)}
                    >
                      <Text style={[styles.tipoLabel, selected && styles.tipoLabelSelected]}>{t.label}</Text>
                      <Text style={[styles.tipoDesc, selected && styles.tipoDescSelected]}>{t.descripcion}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && pressedFeedback]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <TintPill color={PALETTE.categorias.finanzas} radius={16}>
              <Pressable style={({ pressed }) => [styles.saveButton, pressed && pressedFeedback]} onPress={handleGuardar}>
                <Text style={styles.saveText}>Guardar</Text>
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
  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoCard: {
    flex: 1,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  tipoCardSelected: {
    backgroundColor: PALETTE.categorias.finanzas,
  },
  tipoLabel: { fontSize: 13, fontWeight: '700', color: PALETTE.ink },
  tipoLabelSelected: { color: PALETTE.onDark },
  tipoDesc: { fontSize: 10, color: PALETTE.onSurfaceVariant },
  tipoDescSelected: { color: PALETTE.onDark, opacity: 0.8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 4 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: PALETTE.ink },
  saveButton: {
    backgroundColor: PALETTE.categorias.finanzas,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  saveText: { fontSize: 13, fontWeight: '700', color: PALETTE.onDark },
});