import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { Usuario } from '../repositories/usuario';
import { validarTexto, validarNumero, validarEntero, parseNumero } from '../utils/validacion';

interface Props {
  visible: boolean;
  currentProfile: Usuario;
  onClose: () => void;
  onSave: (updated: Usuario) => void;
}

const LIMITES = {
  nombreMin: 2,
  nombreMax: 60,
  pesoMin: 1,
  pesoMax: 500,
  alturaMin: 30,
  alturaMax: 250,
  cinturaMin: 20,
  cinturaMax: 300,
  cuelloMin: 10,
  cuelloMax: 100,
  edadMin: 1,
  edadMax: 120,
};

export function EditProfileModal({ visible, currentProfile, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState(currentProfile.nombre);
  const [apellido, setApellido] = useState(currentProfile.apellido);
  const [peso, setPeso] = useState(currentProfile.peso.toString());
  const [altura, setAltura] = useState(currentProfile.altura.toString());
  const [cintura, setCintura] = useState(currentProfile.cintura.toString());
  const [cuello, setCuello] = useState(currentProfile.cuello.toString());
  const [edad, setEdad] = useState(currentProfile.edad.toString());

  const [errores, setErrores] = useState<{
    nombre: string | null;
    apellido: string | null;
    peso: string | null;
    altura: string | null;
    cintura: string | null;
    cuello: string | null;
    edad: string | null;
  }>({ nombre: null, apellido: null, peso: null, altura: null, cintura: null, cuello: null, edad: null });

  // Sincroniza el estado local si el perfil externo cambia
  useEffect(() => {
    if (visible) {
      setNombre(currentProfile.nombre);
      setApellido(currentProfile.apellido);
      setPeso(currentProfile.peso.toString());
      setAltura(currentProfile.altura.toString());
      setCintura(currentProfile.cintura.toString());
      setCuello(currentProfile.cuello.toString());
      setEdad(currentProfile.edad.toString());
      setErrores({ nombre: null, apellido: null, peso: null, altura: null, cintura: null, cuello: null, edad: null });
    }
  }, [visible, currentProfile]);

  const handleGuardar = () => {
    const nuevosErrores = {
      nombre: validarTexto(nombre, LIMITES.nombreMin, LIMITES.nombreMax, 'Nombre'),
      apellido: validarTexto(apellido, LIMITES.nombreMin, LIMITES.nombreMax, 'Apellido'),
      peso: validarNumero(peso, LIMITES.pesoMin, LIMITES.pesoMax, 'kg'),
      altura: validarNumero(altura, LIMITES.alturaMin, LIMITES.alturaMax, 'cm'),
      cintura: validarNumero(cintura, LIMITES.cinturaMin, LIMITES.cinturaMax, 'cm'),
      cuello: validarNumero(cuello, LIMITES.cuelloMin, LIMITES.cuelloMax, 'cm'),
      edad: validarEntero(edad, LIMITES.edadMin, LIMITES.edadMax),
    };
    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some((error) => error !== null)) {
      return;
    }

    onSave({
      ...currentProfile,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      peso: parseNumero(peso),
      altura: parseNumero(altura),
      cintura: parseNumero(cintura),
      cuello: parseNumero(cuello),
      edad: parseNumero(edad),
    });
  };

  const renderInput = (
    label: string,
    valor: string,
    onChangeText: (texto: string) => void,
    error: string | null,
    extra?: { numeric?: boolean; accentColor?: boolean },
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error !== null && styles.textInputError]}
        value={valor}
        onChangeText={onChangeText}
        keyboardType={extra?.numeric ? 'numeric' : undefined}
        maxLength={LIMITES.nombreMax}
      />
      {error !== null && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && pressedFeedback]} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.inputRow}>
              {renderInput('Nombre', nombre, setNombre, errores.nombre)}
              {renderInput('Apellido', apellido, setApellido, errores.apellido)}
            </View>

            <View style={styles.inputRow}>
              {renderInput('Peso (kg)', peso, setPeso, errores.peso, { numeric: true })}
              {renderInput('Altura (cm)', altura, setAltura, errores.altura, { numeric: true })}
            </View>

            <View style={styles.inputRow}>
              {renderInput('Cintura (cm)', cintura, setCintura, errores.cintura, { numeric: true })}
              {renderInput('Cuello (cm)', cuello, setCuello, errores.cuello, { numeric: true })}
            </View>

            {renderInput('Edad (años)', edad, setEdad, errores.edad, { numeric: true })}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && pressedFeedback]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <TintPill color={PALETTE.categorias.trabajo} radius={16}>
              <Pressable style={({ pressed }) => [styles.saveButton, pressed && pressedFeedback]} onPress={handleGuardar}>
                <Text style={styles.saveText}>Guardar Cambios</Text>
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
    backgroundColor: 'rgba(41, 50, 47, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 8,
    maxHeight: '85%',
    ...SHADOW.modal,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.ink },
  iconButton: { padding: 4 },
  inputGroup: { gap: 6, flex: 1 },
  inputRow: { flexDirection: 'row', gap: 12 },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 8 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
  },
  cancelText: { fontSize: 12, fontWeight: '700', color: PALETTE.ink },
  saveButton: { backgroundColor: PALETTE.categorias.trabajo, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 },
  saveText: { fontSize: 12, fontWeight: '700', color: PALETTE.onDark },
});