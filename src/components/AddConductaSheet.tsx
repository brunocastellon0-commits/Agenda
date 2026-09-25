import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal, TouchableWithoutFeedback, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { ConductaEvitar, registrarEventoConducta, getConductasActivas } from '../repositories/conductaRepo';
import { toISODate } from '../utils/semana';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddConductaSheetProps {
  visible: boolean;
  onClose: () => void;
  conducta: ConductaEvitar | null;
  onSaved: () => void;
}

interface FeedbackState {
  anterior: number;
  nueva: number;
  mejor: number;
}

export default function AddConductaSheet({ visible, onClose, conducta, onSaved }: AddConductaSheetProps) {
  const [cantidad, setCantidad] = useState('1');
  const [nota, setNota] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setCantidad('1');
      setNota('');
      setFeedback(null);
      setLoading(false);
    }
  }, [visible]);

  if (!conducta) return null;

  const isEvitacion = conducta.modalidad === 'evitacion_total';

  const handleSave = async () => {
    const cant = parseFloat(cantidad);
    if (isNaN(cant) || cant <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0.');
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener estado anterior
      const activasAntes = await getConductasActivas();
      const progresoAnterior = activasAntes.find(c => c.conducta.id === conducta.id);
      const rachaAnterior = progresoAnterior?.rachaActual || 0;

      // 2. Registrar
      const hoy = new Date();
      const fecha = toISODate(hoy);
      const hora = `${hoy.getHours().toString().padStart(2, '0')}:${hoy.getMinutes().toString().padStart(2, '0')}`;
      
      await registrarEventoConducta(conducta.id, fecha, hora, cant, conducta.unidad, nota.trim());
      
      // 3. Obtener estado nuevo
      const activasDespues = await getConductasActivas();
      const progresoNuevo = activasDespues.find(c => c.conducta.id === conducta.id);
      
      if (isEvitacion && progresoNuevo) {
        setFeedback({
          anterior: rachaAnterior,
          nueva: progresoNuevo.rachaActual,
          mejor: progresoNuevo.mejorRacha
        });
      } else {
        // Para límites, cerramos de inmediato tras guardar
        onSaved();
        onClose();
      }

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarFeedback = () => {
    onSaved();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardOverlay}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          {feedback ? (
            // ESTADO DE FEEDBACK (Solo para evitación total)
            <View style={styles.feedbackContainer}>
              <View style={styles.feedbackIconBox}>
                <Text style={styles.feedbackIcon}>📝</Text>
              </View>
              <Text style={styles.feedbackTitle}>Registro completado</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Racha anterior</Text>
                  <Text style={styles.statValue}>{feedback.anterior} d</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Nueva racha</Text>
                  <Text style={[styles.statValue, { color: PALETTE.categorias.critico }]}>{feedback.nueva} d</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Mejor racha</Text>
                  <Text style={[styles.statValue, { color: PALETTE.primary }]}>{feedback.mejor} d</Text>
                </View>
              </View>

              <Pressable 
                style={({pressed}) => [styles.saveBtn, pressed && pressedFeedback, { width: '100%', marginTop: 24 }]}
                onPress={handleCerrarFeedback}
              >
                <Text style={styles.saveText}>Aceptar</Text>
              </Pressable>
            </View>
          ) : (
            // ESTADO DE FORMULARIO
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Registrar ocurrencia</Text>
                <Text style={styles.subtitle}>{conducta.nombre}</Text>
              </View>

              {!isEvitacion && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cantidad ({conducta.unidad})</Text>
                  <TextInput
                    style={styles.input}
                    value={cantidad}
                    onChangeText={setCantidad}
                    keyboardType="numeric"
                    placeholder="Ej. 1"
                    placeholderTextColor={PALETTE.onSurfaceVariant}
                    editable={!loading}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nota (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={nota}
                  onChangeText={setNota}
                  placeholder="¿Qué pasó? (Opcional)"
                  placeholderTextColor={PALETTE.onSurfaceVariant}
                  editable={!loading}
                />
              </View>

              <View style={styles.actions}>
                <Pressable 
                  style={({pressed}) => [styles.cancelBtn, pressed && pressedFeedback]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable 
                  style={({pressed}) => [styles.saveBtn, pressed && pressedFeedback, loading && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={styles.saveText}>{loading ? 'Guardando...' : 'Registrar'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,26,24,0.4)',
  },
  keyboardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.cards,
    borderTopRightRadius: RADIUS.cards,
    padding: 24,
    ...SHADOW.modal,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: PALETTE.ink,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.buttons,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: PALETTE.ink,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
    backgroundColor: PALETTE.surfaceContainer,
  },
  cancelText: {
    color: PALETTE.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Feedback
  feedbackContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  feedbackIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tint(PALETTE.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  feedbackIcon: {
    fontSize: 24,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.cards,
    padding: 16,
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: PALETTE.outline,
    opacity: 0.3,
  },
  statLabel: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
  },
});
