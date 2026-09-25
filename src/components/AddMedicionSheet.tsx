import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme';
import { parseNumero } from '../utils/validacion';
import { RegistroFisico, registrarMedicion } from '../repositories/estadoFisicoRepo';

interface Props {
  visible: boolean;
  ultimoRegistro: RegistroFisico | null;
  ciUsuario: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AddMedicionSheet({ visible, ultimoRegistro, ciUsuario, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [cintura, setCintura] = useState('');
  const [cuello, setCuello] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (visible) {
      if (ultimoRegistro) {
        setPeso(ultimoRegistro.peso?.toString() || '');
        setAltura(ultimoRegistro.altura?.toString() || '');
        setCintura(ultimoRegistro.cintura?.toString() || '');
        setCuello(ultimoRegistro.cuello?.toString() || '');
      } else {
        setPeso('');
        setAltura('');
        setCintura('');
        setCuello('');
      }
      setNotas('');
    }
  }, [visible, ultimoRegistro]);

  const handleSave = async () => {
    const p = parseNumero(peso);
    const a = parseNumero(altura);
    const c = parseNumero(cintura);
    const cu = parseNumero(cuello);

    const hasNoValidNumbers = isNaN(p) && isNaN(a) && isNaN(c) && isNaN(cu);
    
    if (hasNoValidNumbers && notas.trim() === '') {
       Alert.alert('Campos vacíos', 'Ingresá al menos una medida o una nota para registrar.');
       return;
    }

    try {
      const hoyIso = new Date().toISOString().split('T')[0];
      const hoyHoraIso = new Date().toISOString();
      
      await registrarMedicion({
        ci_usuario: ciUsuario,
        fecha_medicion: hoyIso,
        fecha_registro: hoyHoraIso,
        peso: isNaN(p) ? null : p,
        altura: isNaN(a) ? null : a,
        cintura: isNaN(c) ? null : c,
        cuello: isNaN(cu) ? null : cu,
        notas: notas.trim() || null
      });
      onSave();
    } catch (error) {
       console.error('Error guardando medicion:', error);
       Alert.alert('Error', 'Hubo un problema al registrar tu medición.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 24, paddingTop: 16 }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <Text style={styles.title}>Registrar Medición</Text>

            <ScrollView 
              style={styles.scroll} 
              contentContainerStyle={{ gap: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Peso (kg)</Text>
                  {ultimoRegistro?.peso ? <Text style={styles.reference}>Anterior: {ultimoRegistro.peso} kg</Text> : null}
                </View>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  value={peso}
                  onChangeText={setPeso}
                  placeholder="Ej: 75.5"
                  placeholderTextColor={PALETTE.ash}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Altura (cm)</Text>
                  {ultimoRegistro?.altura ? <Text style={styles.reference}>Anterior: {ultimoRegistro.altura} cm</Text> : null}
                </View>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  value={altura}
                  onChangeText={setAltura}
                  placeholder="Ej: 175"
                  placeholderTextColor={PALETTE.ash}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Cintura (cm)</Text>
                  </View>
                  <TextInput 
                    style={styles.input}
                    keyboardType="numeric"
                    value={cintura}
                    onChangeText={setCintura}
                    placeholder="Ej: 85"
                    placeholderTextColor={PALETTE.ash}
                  />
                  {ultimoRegistro?.cintura ? <Text style={styles.referenceBottom}>Anterior: {ultimoRegistro.cintura} cm</Text> : null}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Cuello (cm)</Text>
                  </View>
                  <TextInput 
                    style={styles.input}
                    keyboardType="numeric"
                    value={cuello}
                    onChangeText={setCuello}
                    placeholder="Ej: 38"
                    placeholderTextColor={PALETTE.ash}
                  />
                  {ultimoRegistro?.cuello ? <Text style={styles.referenceBottom}>Anterior: {ultimoRegistro.cuello} cm</Text> : null}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notas</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]}
                  value={notas}
                  onChangeText={setNotas}
                  placeholder="Ej: En ayunas, después de entrenar..."
                  placeholderTextColor={PALETTE.ash}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable 
                style={({ pressed }) => [styles.btnCancel, pressed && pressedFeedback]} 
                onPress={onClose}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.btnSave, pressed && pressedFeedback]} 
                onPress={handleSave}
              >
                <Text style={styles.btnSaveText}>Guardar</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(19,26,24,0.4)', justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { backgroundColor: PALETTE.surfaceContainerLowest, borderTopLeftRadius: RADIUS.hero, borderTopRightRadius: RADIUS.hero, paddingHorizontal: 24, ...SHADOW.modal, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: PALETTE.outline, borderRadius: 2, alignSelf: 'center', marginBottom: 16, opacity: 0.5 },
  title: { fontSize: 20, fontWeight: '700', color: PALETTE.ink, marginBottom: 16 },
  scroll: { maxHeight: 500, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  inputGroup: { flexShrink: 1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: PALETTE.onSurfaceVariant },
  reference: { fontSize: 12, color: PALETTE.ash, fontWeight: '500' },
  referenceBottom: { fontSize: 12, color: PALETTE.ash, fontWeight: '500', marginTop: 4 },
  input: { backgroundColor: PALETTE.surfaceContainer, borderRadius: RADIUS.interior, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: PALETTE.ink },
  textArea: { height: 80 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, paddingVertical: 14, backgroundColor: PALETTE.surfaceContainer, borderRadius: RADIUS.buttons, alignItems: 'center' },
  btnCancelText: { fontSize: 16, fontWeight: '600', color: PALETTE.ink },
  btnSave: { flex: 1, paddingVertical: 14, backgroundColor: PALETTE.primary, borderRadius: RADIUS.buttons, alignItems: 'center' },
  btnSaveText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
