import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { validarTexto, validarMonto } from '../utils/validacion';

interface Props {
  visible: boolean;
  tipo: 'ingreso' | 'egreso';
  cuentaNombre: string;
  onClose: () => void;
  onSave: (movimiento: { titulo: string; descripcion?: string; monto: number }) => void;
}

const LIMITES = { tituloMax: 60, descripcionMax: 160 };

export function AddMovimientoModal({ visible, tipo, cuentaNombre, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  const [errores, setErrores] = useState<{ titulo: string | null; descripcion: string | null; monto: string | null }>({
    titulo: null,
    descripcion: null,
    monto: null,
  });

  useEffect(() => {
    if (visible) {
      setTitulo('');
      setDescripcion('');
      setMonto('');
      setErrores({ titulo: null, descripcion: null, monto: null });
    }
  }, [visible]);

  const handleGuardar = () => {
    const nuevosErrores = {
      titulo: validarTexto(titulo, 2, LIMITES.tituloMax, 'Título'),
      descripcion: validarTexto(descripcion, 0, LIMITES.descripcionMax, 'Descripción'),
      monto: validarMonto(monto),
    };
    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some((error) => error !== null)) {
      return;
    }

    onSave({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      monto: parseFloat(monto.replace(',', '.')),
    });
  };

  const renderInput = (
    label: string,
    valor: string,
    onChangeText: (texto: string) => void,
    error: string | null,
    opts?: { numeric?: boolean; multiline?: boolean },
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error !== null && styles.textInputError, opts?.multiline && styles.multilineInput]}
        value={valor}
        onChangeText={onChangeText}
        keyboardType={opts?.numeric ? 'decimal-pad' : undefined}
        multiline={opts?.multiline}
        maxLength={opts?.numeric ? undefined : LIMITES.tituloMax}
      />
      {error !== null && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const esIngreso = tipo === 'ingreso';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <MaterialIcons
                name={esIngreso ? 'add-circle' : 'remove-circle'}
                size={22}
                color={PALETTE.ink}
              />
              <Text style={styles.modalTitle}>
                {esIngreso ? 'Registrar ingreso' : 'Registrar salida'}
              </Text>
            </View>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Cuenta: {cuentaNombre}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {renderInput('Título', titulo, setTitulo, errores.titulo)}
            {renderInput('Descripción (opcional)', descripcion, setDescripcion, errores.descripcion, { multiline: true })}
            {renderInput('Monto', monto, setMonto, errores.monto, { numeric: true })}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && pressedFeedback]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <TintPill color={esIngreso ? PALETTE.categorias.finanzas : PALETTE.categorias.importante} radius={16}>
              <Pressable
                style={({ pressed }) => [styles.saveButton, !esIngreso && styles.saveButtonEgreso, pressed && pressedFeedback]}
                onPress={handleGuardar}
              >
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.onSurface,
  },
  subtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
  },
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
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderWidth: 1,
    borderColor: PALETTE.categorias.critico,
  },
  errorText: {
    fontSize: 11,
    color: PALETTE.categorias.critico,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 4,
  },
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
  saveButtonEgreso: {
    backgroundColor: PALETTE.categorias.importante,
  },
  saveText: { fontSize: 13, fontWeight: '700', color: PALETTE.onDark },
});