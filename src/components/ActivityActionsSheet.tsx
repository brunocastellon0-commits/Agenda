import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'

interface ActivityActionsSheetProps {
  visible: boolean
  actividad: Actividad | null
  tipo?: TipoActividad
  subtareaProgreso?: { total: number; completadas: number } | null
  /** Cierra el sheet (estado del padre). Siempre llamarlo antes de cualquier acción. */
  onClose: () => void
  onToggle: (actividadId: number) => void
  onToggleEnProgreso: (actividadId: number) => void
  /** Se invoca DESPUÉS de que el sheet terminó de cerrarse (delay interno). */
  onPostpone: (actividad: Actividad) => void
  onSubtareas: (actividad: Actividad) => void
  onDelete: (actividad: Actividad) => void
}

/** Delay para que el sheet termine su animación de cierre antes de abrir otro modal. */
const CIERRE_MS = 280

export function ActivityActionsSheet({
  visible,
  actividad,
  tipo,
  subtareaProgreso,
  onClose,
  onToggle,
  onToggleEnProgreso,
  onPostpone,
  onSubtareas,
  onDelete,
}: ActivityActionsSheetProps) {
  const insets = useSafeAreaInsets()

  if (!actividad) return null

  const done = actividad.completado === 1
  const enProgreso = actividad.estado_ejecucion === 'en_progreso' && !done
  const color = tipo?.color ?? PALETTE.primary

  /** Cierra primero; abre el siguiente modal recién cuando el sheet ya no está. */
  const ejecutarConCierre = (cb: () => void) => {
    onClose()
    setTimeout(cb, CIERRE_MS)
  }

  const handleToggle = () => {
    const id = actividad.id
    onClose()
    if (id !== undefined) onToggle(id)
  }

  const handleEnProgreso = () => {
    const id = actividad.id
    onClose()
    if (id !== undefined) onToggleEnProgreso(id)
  }

  const accionBase = (iconName: string, label: string, onPress: () => void, tintC?: string) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && pressedFeedback]}
    >
      <View style={[styles.actionIcon, { backgroundColor: tint(tintC ?? color, 0.12) }]}>
        <MaterialIcons name={iconName as any} size={18} color={tintC ?? color} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header con identidad de la actividad */}
          <View style={styles.header}>
            <View style={[styles.headerDot, { backgroundColor: color }]} />
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {actividad.titulo}
              </Text>
              <View style={styles.headerMeta}>
                <View style={[styles.areaPill, { backgroundColor: tint(color, 0.12) }]}>
                  <Text style={[styles.areaPillText, { color }]}>
                    {tipo?.nombre ?? 'Área'}
                  </Text>
                </View>
                {!!actividad.hora && <Text style={styles.headerHora}>{actividad.hora}</Text>}
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {accionBase(
            done ? 'replay' : 'check-circle-outline',
            done ? 'Reactivar' : 'Completar',
            handleToggle
          )}

          {!done &&
            accionBase(
              enProgreso ? 'pause-circle-outline' : 'play-circle-outline',
              enProgreso ? 'Pausar' : 'En progreso',
              handleEnProgreso
            )}

          {!done &&
            accionBase(
              'schedule',
              'Pospuesta',
              () => ejecutarConCierre(() => onPostpone(actividad)),
              PALETTE.categorias.importante
            )}

          {accionBase(
            'checklist',
            subtareaProgreso && subtareaProgreso.total > 0
              ? `Subtareas (${subtareaProgreso.completadas}/${subtareaProgreso.total})`
              : 'Subtareas',
            () => ejecutarConCierre(() => onSubtareas(actividad))
          )}

          <View style={styles.divider} />

          {accionBase(
            'delete-outline',
            'Eliminar',
            () => ejecutarConCierre(() => onDelete(actividad)),
            PALETTE.categorias.critico
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
    alignItems: 'flex-start',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  headerTexts: {
    flex: 1,
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
    lineHeight: 20,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  areaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  areaPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerHora: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.hairline,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.interior,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
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
