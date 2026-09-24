import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { getActividadesSeguibles, seguirActividad } from '../repositories/habitosRepo';

interface FollowActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onFollow: () => void;
}

export default function FollowActivityModal({ visible, onClose, onFollow }: FollowActivityModalProps) {
  const insets = useSafeAreaInsets();
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      cargarSeguibles();
    }
  }, [visible]);

  const cargarSeguibles = async () => {
    setLoading(true);
    try {
      const segs = await getActividadesSeguibles();
      setActividades(segs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (reglaId: number) => {
    try {
      await seguirActividad(reglaId);
      onFollow();
      onClose();
    } catch (e) {
      console.error('Error al seguir actividad', e);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 24 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Selecciona una actividad</Text>
          <Text style={styles.subtitle}>Solo se muestran actividades recurrentes no seguidas.</Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={PALETTE.primary} />
          ) : actividades.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay actividades recurrentes disponibles.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 16 }}>
              {actividades.map((act) => (
                <Pressable
                  key={act.id}
                  style={({ pressed }) => [styles.item, pressed && pressedFeedback]}
                  onPress={() => handleSelect(act.id)}
                >
                  <View style={styles.itemRow}>
                    <View style={[styles.iconBox, { backgroundColor: tint(act.tipo_color || PALETTE.primary, 0.12) }]}>
                      {act.tipo_emoji ? (
                        <Text style={{ fontSize: 16 }}>{act.tipo_emoji}</Text>
                      ) : (
                        <View style={[styles.dot, { backgroundColor: act.tipo_color }]} />
                      )}
                    </View>
                    <View style={styles.itemTexts}>
                      <Text style={styles.itemTitle}>{act.titulo}</Text>
                      <Text style={styles.itemSub}>{act.patron === 'diario' ? 'Diario' : 'Semanal / Días específicos'}</Text>
                    </View>
                  </View>
                  <Text style={styles.addText}>Seguir</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    paddingHorizontal: 24,
    paddingTop: 12,
    ...SHADOW.modal,
    maxHeight: '80%',
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 24,
  },
  list: {
    marginTop: 8,
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
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.primary,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
});
