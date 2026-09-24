import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad } from '../repositories/actividadRepo'

export type ModoEliminacion =
  | 'solo_dia'
  | 'todas_repeticiones'
  | 'terminar_repeticion'

interface DeleteActividadModalProps {
  visible: boolean
  actividad: Actividad | null
  accentColor: string
  onConfirm: (modo: ModoEliminacion) => void
  onClose: () => void
}

export function DeleteActividadModal({
  visible,
  actividad,
  accentColor,
  onConfirm,
  onClose,
}: DeleteActividadModalProps) {
  const insets = useSafeAreaInsets()
  const esRecurrente = !!actividad?.regla_recurrencia_id

  if (!actividad) return null

  const confirmar = (modo: ModoEliminacion) => {
    onConfirm(modo)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={[styles.headerDot, { backgroundColor: PALETTE.categorias.critico }]} />
            <Text style={styles.headerTitle}>Eliminar actividad</Text>
            <View style={styles.headerSpacer} />
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.actividadTitulo} numberOfLines={2}>
            {actividad.titulo}
          </Text>

          {esRecurrente ? (
            <>
              <Text style={styles.subtitle}>
                Esta actividad se repite. Elige hasta dónde quieres eliminarla:
              </Text>

              <Pressable
                onPress={() => confirmar('solo_dia')}
                style={({ pressed }) => [styles.optionCard, pressed && pressedFeedback]}
              >
                <View style={[styles.optionIcon, { backgroundColor: tint(accentColor, 0.12) }]}>
                  <MaterialIcons name="event-busy" size={18} color={accentColor} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Eliminar solo este día</Text>
                  <Text style={styles.optionDesc}>
                    Se borra únicamente la instancia de esta fecha; las demás repeticiones siguen.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => confirmar('todas_repeticiones')}
                style={({ pressed }) => [styles.optionCard, pressed && pressedFeedback]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: tint(PALETTE.categorias.critico, 0.12) },
                  ]}
                >
                  <MaterialIcons
                    name="delete-forever"
                    size={18}
                    color={PALETTE.categorias.critico}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Eliminar todas las repeticiones</Text>
                  <Text style={styles.optionDesc}>
                    Borra la actividad de todos los días y también su regla de repetición.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => confirmar('terminar_repeticion')}
                style={({ pressed }) => [styles.optionCard, pressed && pressedFeedback]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: tint(PALETTE.categorias.importante, 0.12) },
                  ]}
                >
                  <MaterialIcons
                    name="pause-circle-outline"
                    size={18}
                    color={PALETTE.categorias.importante}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Terminar repetición</Text>
                  <Text style={styles.optionDesc}>
                    Esta actividad ya no se volverá a repetir; las instancias existentes se
                    conservan.
                  </Text>
                </View>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => confirmar('solo_dia')}
              style={({ pressed }) => [styles.optionCard, pressed && pressedFeedback]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: tint(PALETTE.categorias.critico, 0.12) },
                ]}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={18}
                  color={PALETTE.categorias.critico}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Eliminar actividad</Text>
                <Text style={styles.optionDesc}>Se eliminará del día seleccionado.</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelButton, pressed && pressedFeedback]}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
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
    paddingHorizontal: 18,
    paddingTop: 18,
    ...SHADOW.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  headerSpacer: {
    flex: 1,
  },
  actividadTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  optionDesc: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    lineHeight: 16,
  },
  cancelButton: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.buttons,
    backgroundColor: PALETTE.surfaceContainer,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
})
