import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Modal, Pressable, ScrollView } from 'react-native';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { getNotifConfig, setNotifConfig, requestPermissionsConContexto, getPermissionStatus } from '../services/notificaciones';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificacionesSheet({ visible, onClose }: Props) {
  const [granted, setGranted] = useState(false);
  const [config, setConfig] = useState({
    notif_actividad: true,
    notif_habito: true,
    notif_evitar: true,
    notif_comida: true,
    notif_resumen: true,
  });

  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const loadConfig = async () => {
    const isGranted = await getPermissionStatus();
    setGranted(isGranted);

    const actividad = await getNotifConfig('notif_actividad', '1');
    const habito = await getNotifConfig('notif_habito', '1');
    const evitar = await getNotifConfig('notif_evitar', '1');
    const comida = await getNotifConfig('notif_comida', '1');
    const resumen = await getNotifConfig('notif_resumen', '1');

    setConfig({
      notif_actividad: actividad === '1',
      notif_habito: habito === '1',
      notif_evitar: evitar === '1',
      notif_comida: comida === '1',
      notif_resumen: resumen === '1',
    });
  };

  const handleToggle = async (key: keyof typeof config, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    await setNotifConfig(key, value ? '1' : '0');
  };

  const handleActivarPermisos = async () => {
    const success = await requestPermissionsConContexto();
    setGranted(success);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Notificaciones</Text>
          <ScrollView contentContainerStyle={styles.scroll}>
            {!granted && (
              <View style={styles.permissionCard}>
                <Text style={styles.permissionTitle}>Permisos requeridos</Text>
                <Text style={styles.permissionText}>Activa las notificaciones para recibir recordatorios.</Text>
                <Pressable style={({pressed}) => [styles.btnActivar, pressed && pressedFeedback]} onPress={handleActivarPermisos}>
                  <Text style={styles.btnActivarText}>Activar Permisos</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Actividades</Text>
              <Switch
                value={config.notif_actividad}
                onValueChange={(val) => handleToggle('notif_actividad', val)}
                trackColor={{ true: PALETTE.primary }}
                disabled={!granted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Hábitos</Text>
              <Switch
                value={config.notif_habito}
                onValueChange={(val) => handleToggle('notif_habito', val)}
                trackColor={{ true: PALETTE.primary }}
                disabled={!granted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Conductas a evitar</Text>
              <Switch
                value={config.notif_evitar}
                onValueChange={(val) => handleToggle('notif_evitar', val)}
                trackColor={{ true: PALETTE.primary }}
                disabled={!granted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Alimentación</Text>
              <Switch
                value={config.notif_comida}
                onValueChange={(val) => handleToggle('notif_comida', val)}
                trackColor={{ true: PALETTE.primary }}
                disabled={!granted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Resumen Diario</Text>
              <Switch
                value={config.notif_resumen}
                onValueChange={(val) => handleToggle('notif_resumen', val)}
                trackColor={{ true: PALETTE.primary }}
                disabled={!granted}
              />
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable style={({pressed}) => [styles.btnCerrar, pressed && pressedFeedback]} onPress={onClose}>
              <Text style={styles.btnCerrarText}>Cerrar</Text>
            </Pressable>
          </View>
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
  sheet: {
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    ...SHADOW.modal,
    maxHeight: '80%',
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  permissionCard: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...SHADOW.card,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 12,
  },
  btnActivar: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnActivarText: {
    color: PALETTE.onAccent,
    fontWeight: '600',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  settingLabel: {
    fontSize: 16,
    color: PALETTE.ink,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
    paddingBottom: 32, // SafeArea fallback
  },
  btnCerrar: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnCerrarText: {
    color: PALETTE.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
});
