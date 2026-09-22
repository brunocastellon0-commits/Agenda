import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { TipoActividad } from '../repositories/actividadRepo'

interface ContextSelectorSheetProps {
  visible: boolean
  tipos: TipoActividad[]
  activeTipoId?: number
  pendientesPorTipo: Record<number, number>
  onSelect: (tipo: TipoActividad) => void
  onCreateTipo: () => void
  onClose: () => void
}

export function ContextSelectorSheet({
  visible,
  tipos,
  activeTipoId,
  pendientesPorTipo,
  onSelect,
  onCreateTipo,
  onClose,
}: ContextSelectorSheetProps) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Tipo de actividad</Text>
          </View>

          {tipos.map((tipo, index) => {
            const isActive = tipo.id === activeTipoId
            const pendientes = pendientesPorTipo[tipo.id ?? -1] ?? 0
            return (
              <Pressable
                key={tipo.id ?? String(index)}
                onPress={() => onSelect(tipo)}
                style={({ pressed }) => [
                  styles.option,
                  isActive && { backgroundColor: tint(tipo.color) },
                  pressed && pressedFeedback,
                ]}
              >
                <Text style={styles.optionEmoji}>{tipo.emoji || '·'}</Text>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[styles.optionLabel, { color: isActive ? tipo.color : PALETTE.ink }]}
                  >
                    {tipo.nombre}
                  </Text>
                  <Text style={styles.optionSubtitle}>
                    {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'}
                  </Text>
                </View>
                {isActive && <View style={[styles.activeDot, { backgroundColor: tipo.color }]} />}
              </Pressable>
            )
          })}

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && pressedFeedback]}
              onPress={onCreateTipo}
            >
              <MaterialIcons name="add" size={18} color={PALETTE.ink} />
              <Text style={styles.secondaryText}>Crear tipo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && pressedFeedback]}
              onPress={onClose}
            >
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
          </View>
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
    marginHorizontal: 12,
    marginBottom: 8,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    backgroundColor: PALETTE.surfaceContainerLowest,
    overflow: 'hidden',
    ...SHADOW.modal,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  optionEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
})