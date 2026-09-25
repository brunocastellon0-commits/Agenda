import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { getHabitosActivos, HabitoProgreso, dejarDeSeguirActividad } from '../repositories/habitosRepo';
import { getConductasActivas, ConductaProgreso, desactivarConducta } from '../repositories/conductaRepo';

import AddHabitSheet from './AddHabitSheet';

interface ManageTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void; // Para recargar los datos en la pantalla principal
}

export default function ManageTrackingModal({ visible, onClose, onChanged }: ManageTrackingModalProps) {
  const insets = useSafeAreaInsets();
  const [habitos, setHabitos] = useState<HabitoProgreso[]>([]);
  const [conductas, setConductas] = useState<ConductaProgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddHabit, setShowAddHabit] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [habs, conds] = await Promise.all([
        getHabitosActivos(),
        getConductasActivas()
      ]);
      setHabitos(habs);
      setConductas(conds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      cargarDatos();
    }
  }, [visible]);

  const handleStopHabit = (habito: HabitoProgreso) => {
    Alert.alert(
      'Dejar de seguir',
      `¿Estás seguro de que quieres dejar de seguir el hábito "${habito.detalle.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Dejar de seguir', 
          style: 'destructive',
          onPress: async () => {
            await dejarDeSeguirActividad(habito.detalle.regla_recurrencia_id);
            onChanged();
            cargarDatos();
          }
        }
      ]
    );
  };

  const handleStopConducta = (progreso: ConductaProgreso) => {
    Alert.alert(
      'Eliminar seguimiento',
      `¿Dejar de seguir la conducta "${progreso.conducta.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await desactivarConducta(progreso.conducta.id);
            onChanged();
            cargarDatos();
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 24 }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Gestionar Seguimientos</Text>
            <Text style={styles.subtitle}>Aquí puedes dejar de seguir hábitos o eliminar conductas que ya no quieras monitorear.</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={PALETTE.primary} />
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 16 }}>
              
              {/* Sección Hábitos */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Tus Hábitos</Text>
                <Pressable onPress={() => setShowAddHabit(true)} style={({pressed}) => pressed && pressedFeedback}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: PALETTE.primary }}>+ Crear nuevo</Text>
                </Pressable>
              </View>
              {habitos.length === 0 ? (
                <Text style={styles.emptyText}>No sigues ningún hábito actualmente.</Text>
              ) : (
                habitos.map((h) => (
                  <View key={h.detalle.id} style={styles.item}>
                    <View style={styles.itemRow}>
                      <View style={[styles.iconBox, { backgroundColor: tint(h.detalle.tipo_actividad_color || PALETTE.primary, 0.12) }]}>
                        {h.detalle.tipo_actividad_emoji ? (
                          <Text style={{ fontSize: 16 }}>{h.detalle.tipo_actividad_emoji}</Text>
                        ) : (
                          <View style={[styles.dot, { backgroundColor: h.detalle.tipo_actividad_color }]} />
                        )}
                      </View>
                      <View style={styles.itemTexts}>
                        <Text style={styles.itemTitle}>{h.detalle.titulo}</Text>
                        <Text style={styles.itemSub}>{h.detalle.tipo_actividad_nombre}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.actionBtn, pressed && pressedFeedback]}
                      onPress={() => handleStopHabit(h)}
                    >
                      <Ionicons name="trash-outline" size={20} color={PALETTE.categorias.critico} />
                    </Pressable>
                  </View>
                ))
              )}

              {/* Sección Conductas */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Conductas a Evitar</Text>
              {conductas.length === 0 ? (
                <Text style={styles.emptyText}>No monitoreas ninguna conducta.</Text>
              ) : (
                conductas.map((c) => (
                  <View key={c.conducta.id} style={styles.item}>
                    <View style={styles.itemRow}>
                      <View style={[styles.iconBox, { backgroundColor: tint(PALETTE.categorias.importante, 0.12) }]}>
                        <Ionicons name="shield-outline" size={16} color={PALETTE.categorias.importante} />
                      </View>
                      <View style={styles.itemTexts}>
                        <Text style={styles.itemTitle}>{c.conducta.nombre}</Text>
                        <Text style={styles.itemSub}>{c.conducta.modalidad === 'limite' ? 'Límite periódico' : 'Evitación total'}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.actionBtn, pressed && pressedFeedback]}
                      onPress={() => handleStopConducta(c)}
                    >
                      <Ionicons name="trash-outline" size={20} color={PALETTE.categorias.critico} />
                    </Pressable>
                  </View>
                ))
              )}

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
    <AddHabitSheet 
      visible={showAddHabit}
      onClose={() => setShowAddHabit(false)}
      onSaved={() => {
        setShowAddHabit(false);
        cargarDatos();
        onChanged();
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,26,24,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    paddingHorizontal: 24,
    paddingTop: 12,
    ...SHADOW.modal,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: PALETTE.outline,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
    opacity: 0.5,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
  list: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemTexts: {
    justifyContent: 'center',
    flex: 1,
    paddingRight: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
  },
  actionBtn: {
    padding: 8,
  },
});
