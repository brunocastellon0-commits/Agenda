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
  totalPendientes?: number
  onSelect: (tipo: TipoActividad | null) => void
  onCreateTipo: () => void
  onClose: () => void
}

export function ContextSelectorSheet({
  visible,
  tipos,
  activeTipoId,
  pendientesPorTipo,
  totalPendientes = 0,
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
            <Text style={styles.headerText}>Seleccionar Área</Text>
          </View>

          {/* Opción 'Todas las áreas' */}
          <Pressable
            onPress={() => onSelect(null)}
            style={({ pressed }) => [
              styles.option,
              activeTipoId === undefined && { backgroundColor: tint(PALETTE.primary) },
              pressed && pressedFeedback,
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: tint(PALETTE.primary) }]}>
              <MaterialIcons name="grid-view" size={20} color={PALETTE.primary} />
              {totalPendientes > 0 && (
                <View style={[styles.socialBadge, { backgroundColor: PALETTE.primary }]}>
                  <Text style={styles.socialBadgeText}>
                    {totalPendientes > 99 ? '99+' : totalPendientes}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.optionTextContainer}>
              <Text
                style={[styles.optionLabel, { color: activeTipoId === undefined ? PALETTE.primary : PALETTE.ink }]}
              >
                Todas las áreas
              </Text>
            </View>
            {totalPendientes > 0 && (
              <View style={[styles.badgePill, { backgroundColor: tint(PALETTE.primary) }]}>
                <Text style={[styles.badgePillText, { color: PALETTE.primary }]}>
                  {totalPendientes}
                </Text>
              </View>
            )}
            {activeTipoId === undefined && <View style={[styles.activeDot, { backgroundColor: PALETTE.primary }]} />}
          </Pressable>

          {tipos.map((tipo, index) => {
            const isActive = tipo.id === activeTipoId
            const pendientes = pendientesPorTipo[tipo.id ?? -1] ?? 0
            const iconName = (tipo.emoji as keyof typeof MaterialIcons.glyphMap) || 'folder'

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
                <View style={[styles.iconBox, { backgroundColor: tint(tipo.color) }]}>
                  <MaterialIcons name={iconName} size={20} color={tipo.color} />
                  {pendientes > 0 && (
                    <View style={[styles.socialBadge, { backgroundColor: tipo.color }]}>
                      <Text style={styles.socialBadgeText}>
                        {pendientes > 99 ? '99+' : pendientes}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[styles.optionLabel, { color: isActive ? tipo.color : PALETTE.ink }]}
                  >
                    {tipo.nombre}
                  </Text>
                </View>
                {pendientes > 0 && (
                  <View style={[styles.badgePill, { backgroundColor: tint(tipo.color) }]}>
                    <Text style={[styles.badgePillText, { color: tipo.color }]}>
                      {pendientes}
                    </Text>
                  </View>
                )}
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
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  socialBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PALETTE.surfaceContainerLowest,
  },
  socialBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.onAccent,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
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