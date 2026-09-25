import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { getTiposActividad, TipoActividad, crearReglaRecurrencia } from '../repositories/actividadRepo';
import { seguirActividad } from '../repositories/habitosRepo';
import { toFechaISO } from '../utils/calendario';

interface AddHabitSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DIAS_SEMANA = [
  { valor: 1, label: 'Lun' },
  { valor: 2, label: 'Mar' },
  { valor: 3, label: 'Mié' },
  { valor: 4, label: 'Jue' },
  { valor: 5, label: 'Vie' },
  { valor: 6, label: 'Sáb' },
  { valor: 7, label: 'Dom' },
];

export default function AddHabitSheet({ visible, onClose, onSaved }: AddHabitSheetProps) {
  const insets = useSafeAreaInsets();
  
  const [titulo, setTitulo] = useState('');
  const [tipos, setTipos] = useState<TipoActividad[]>([]);
  const [tipoIdSeleccionado, setTipoIdSeleccionado] = useState<number>(1);
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitulo('');
      setDiasSeleccionados([1,2,3,4,5,6,7]); // Diario por defecto
      setError(null);
      cargarTipos();
    }
  }, [visible]);

  const cargarTipos = async () => {
    const data = await getTiposActividad();
    setTipos(data);
    if (data.length > 0) setTipoIdSeleccionado(data[0].id!);
  };

  const handleToggleDia = (valor: number) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(valor)) {
        return prev.filter(d => d !== valor);
      } else {
        return [...prev, valor].sort();
      }
    });
  };

  const handleGuardar = async () => {
    const t = titulo.trim();
    if (t.length < 2) {
      setError('El nombre del hábito debe ser más largo.');
      return;
    }
    if (diasSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un día.');
      return;
    }

    setError(null);
    try {
      const hoyISO = toFechaISO(new Date());
      const patron = diasSeleccionados.length === 7 ? 'diario' : 'dias_semana';
      
      const reglaId = await crearReglaRecurrencia({
        titulo: t,
        tipo_actividad_id: tipoIdSeleccionado,
        patron: patron,
        dias_semana: diasSeleccionados.join(','),
        dia_inicio: diasSeleccionados[0],
        dia_fin: diasSeleccionados[diasSeleccionados.length - 1],
        fecha_inicio: hoyISO,
        prioridad: 'normal'
      });

      // Seguir automáticamente como hábito
      await seguirActividad(reglaId);

      onSaved();
    } catch (e) {
      console.error(e);
      setError('Ocurrió un error al guardar.');
    }
  };

  const colorActual = tipos.find(t => t.id === tipoIdSeleccionado)?.color || PALETTE.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={e => e.stopPropagation()}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={[styles.headerDot, { backgroundColor: colorActual }]} />
                  <Text style={styles.headerTitle}>Crear Nuevo Hábito</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.mainInput}
                  value={titulo}
                  onChangeText={(val) => { setTitulo(val); setError(null); }}
                  placeholder="Ej. Leer 10 páginas, Meditar..."
                  placeholderTextColor={PALETTE.outline}
                  maxLength={60}
                  autoFocus
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Área</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollRow}>
                  {tipos.map(tipo => {
                    const isSelected = tipo.id === tipoIdSeleccionado;
                    return (
                      <Pressable
                        key={tipo.id}
                        onPress={() => tipo.id && setTipoIdSeleccionado(tipo.id)}
                        style={[
                          styles.areaChip,
                          isSelected ? { backgroundColor: tipo.color } : { backgroundColor: PALETTE.surfaceContainer }
                        ]}
                      >
                        <Text style={[styles.areaChipText, { color: isSelected ? PALETTE.onAccent : PALETTE.ink }]}>
                          {tipo.nombre}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Días de la semana</Text>
                <View style={styles.diasRow}>
                  {DIAS_SEMANA.map((dia) => {
                    const seleccionado = diasSeleccionados.includes(dia.valor);
                    return (
                      <Pressable
                        key={dia.valor}
                        onPress={() => handleToggleDia(dia.valor)}
                        style={[
                          styles.diaChip,
                          seleccionado ? { backgroundColor: colorActual } : styles.diaChipLibre
                        ]}
                      >
                        <Text style={[styles.diaChipText, seleccionado && styles.diaChipTextActive]}>
                          {dia.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleGuardar}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colorActual },
                  pressed && pressedFeedback,
                ]}
              >
                <Text style={styles.saveButtonText}>Guardar Hábito</Text>
              </Pressable>

            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,26,24,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    marginHorizontal: 10,
    marginBottom: 6,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
    ...SHADOW.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  inputContainer: {
    marginBottom: 20,
  },
  mainInput: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.ink,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: PALETTE.hairline,
  },
  errorText: {
    color: PALETTE.categorias.critico,
    fontSize: 12,
    marginTop: 4,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  chipsScrollRow: {
    gap: 8,
    paddingVertical: 2,
  },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.interior,
  },
  areaChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  diasRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  diaChip: {
    flex: 1,
    minWidth: 40,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.interior,
  },
  diaChipLibre: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  diaChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  diaChipTextActive: {
    color: PALETTE.onAccent,
    fontWeight: '700',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
});
