import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { DIVISAS, Divisa, Billetera } from '../repositories/billetera';
import { validarTexto, validarMonto, parseNumero } from '../utils/validacion';

interface Props {
  visible: boolean;
  ciUsuario: string | undefined;
  onClose: () => void;
  onSave: (billetera: Billetera) => void;
}

const LIMITES = {
  nombreMax: 60,
  entidadMax: 60,
};

export function AddBilleteraModal({ visible, ciUsuario, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [entidad, setEntidad] = useState('');
  const [divisa, setDivisa] = useState<Divisa>('BOB');
  const [monto, setMonto] = useState('');

  const [errores, setErrores] = useState<{
    nombre: string | null;
    entidad: string | null;
    monto: string | null;
  }>({ nombre: null, entidad: null, monto: null });

  useEffect(() => {
    if (visible) {
      setNombre('');
      setEntidad('');
      setDivisa('BOB');
      setMonto('');
      setErrores({ nombre: null, entidad: null, monto: null });
    }
  }, [visible]);

  const handleGuardar = () => {
    const nuevosErrores = {
      nombre: validarTexto(nombre, 2, LIMITES.nombreMax, 'Nombre'),
      entidad: validarTexto(entidad, 2, LIMITES.entidadMax, 'Entidad'),
      monto: validarMonto(monto),
    };
    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some((error) => error !== null)) {
      return;
    }

    onSave({
      nombre: nombre.trim(),
      entidad: entidad.trim(),
      monto: parseNumero(monto),
      divisa,
      ci_usuario: ciUsuario,
    });
  };

  const renderInput = (
    label: string,
    valor: string,
    onChangeText: (texto: string) => void,
    error: string | null,
    numeric?: boolean,
    maxLength?: number,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error !== null && styles.textInputError]}
        value={valor}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'decimal-pad' : undefined}
        maxLength={maxLength ?? LIMITES.nombreMax}
      />
      {error !== null && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Billetera</Text>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {renderInput('Nombre', nombre, setNombre, errores.nombre)}
            {renderInput('Entidad', entidad, setEntidad, errores.entidad)}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Divisa</Text>
              <View style={styles.divisaRow}>
                {DIVISAS.map((d) => {
                  const selected = divisa === d;
                  return (
                    <Pressable
                      key={d}
                      style={({ pressed }) => [styles.divisaChip, selected && styles.divisaChipSelected, pressed && pressedFeedback]}
                      onPress={() => setDivisa(d)}
                    >
                      <Text style={[styles.divisaChipText, selected && styles.divisaChipTextSelected]}>
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {renderInput('Monto inicial', monto, setMonto, errores.monto, true)}
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
    maxHeight: '85%',
    ...SHADOW.modal,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.ink },
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
  errorText: {
    fontSize: 11,
    color: PALETTE.categorias.critico,
  },
  divisaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divisaChip: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  divisaChipSelected: {
    backgroundColor: PALETTE.categorias.finanzas,
  },
  divisaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  divisaChipTextSelected: {
    color: PALETTE.onDark,
    fontWeight: '700',
  },
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