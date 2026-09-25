import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { COLORES_TIPO_ACTIVIDAD } from '../repositories/actividadRepo'

export interface NuevoTipoData {
  nombre: string
  color: string
  emoji?: string
}

interface NuevoTipoActividadModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: NuevoTipoData) => void
}

export const ICONOS_DISPONIBLES: (keyof typeof MaterialIcons.glyphMap)[] = [
  'work',
  'school',
  'gamepad',
  'fitness-center',
  'menu-book',
  'code',
  'palette',
  'payments',
  'shopping-cart',
  'directions-run',
  'music-note',
  'flight',
  'home',
  'restaurant',
  'favorite',
  'star',
]

export function NuevoTipoActividadModal({ visible, onClose, onSave }: NuevoTipoActividadModalProps) {
  const insets = useSafeAreaInsets()
  const [nombre, setNombre] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string>('work')
  const [colorIndex, setColorIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNombre('')
      setSelectedIcon('work')
      setColorIndex(0)
      setError(null)
    }
  }, [visible])

  const handleGuardar = () => {
    const n = nombre.trim()
    if (n.length < 2 || n.length > 40) {
      setError('El nombre debe tener entre 2 y 40 caracteres.')
      return
    }
    setError(null)
    onSave({
      nombre: n,
      color: COLORES_TIPO_ACTIVIDAD[colorIndex].color,
      emoji: selectedIcon,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Nuevo Tipo de Actividad</Text>
                <Text style={styles.subtitle}>Define una nueva área o categoría personalizada.</Text>
              </View>

              {/* Vista previa en tiempo real */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>VISTA PREVIA</Text>
                <View style={[styles.previewCard, { backgroundColor: tint(COLORES_TIPO_ACTIVIDAD[colorIndex].color, 0.08) }]}>
                  <View
                    style={[
                      styles.previewIconBox,
                      { backgroundColor: COLORES_TIPO_ACTIVIDAD[colorIndex].color },
                    ]}
                  >
                    <MaterialIcons
                      name={(selectedIcon as keyof typeof MaterialIcons.glyphMap) || 'folder'}
                      size={22}
                      color={PALETTE.onAccent}
                    />
                  </View>
                  <View style={styles.previewTextContainer}>
                    <Text
                      style={[
                        styles.previewTitle,
                        { color: COLORES_TIPO_ACTIVIDAD[colorIndex].color },
                      ]}
                    >
                      {nombre.trim().length > 0 ? nombre.trim() : 'Nombre del área'}
                    </Text>
                    <Text style={styles.previewSubtitle}>Área de actividad personalizada</Text>
                  </View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ej. Programación, Salud, Finanzas..."
                  placeholderTextColor={PALETTE.onSurfaceVariant}
                  maxLength={40}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Selecciona un Ícono</Text>
                <View style={styles.iconGrid}>
                  {ICONOS_DISPONIBLES.map((iconName) => {
                    const isSelected = selectedIcon === iconName
                    const colorActual = COLORES_TIPO_ACTIVIDAD[colorIndex].color
                    return (
                      <Pressable
                        key={iconName}
                        onPress={() => setSelectedIcon(iconName)}
                        style={({ pressed }) => [
                          styles.iconBox,
                          isSelected ? { backgroundColor: colorActual } : { backgroundColor: PALETTE.surfaceContainer },
                          pressed && pressedFeedback,
                        ]}
                      >
                        <MaterialIcons
                          name={iconName}
                          size={20}
                          color={isSelected ? PALETTE.onAccent : PALETTE.ink}
                        />
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorRow}>
                  {COLORES_TIPO_ACTIVIDAD.map((opcion, index) => {
                    const isSelected = index === colorIndex
                    return (
                      <Pressable
                        key={opcion.color}
                        onPress={() => setColorIndex(index)}
                        style={({ pressed }) => [
                          styles.colorCircle,
                          { backgroundColor: opcion.color },
                          isSelected && styles.colorCircleSelected,
                          pressed && pressedFeedback,
                        ]}
                      />
                    )
                  })}
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && pressedFeedback]}
                  onPress={onClose}
                >
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.button, styles.primaryButton, pressed && pressedFeedback]}
                  onPress={handleGuardar}
                >
                  <Text style={styles.primaryText}>Crear</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
    ...SHADOW.modal,
  },
  header: {
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.interior,
  },
  previewIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTextContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewSubtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 8,
  },
  input: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.ink,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: PALETTE.ink,
  },
  error: {
    fontSize: 12,
    color: PALETTE.categorias.critico,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
  },
  secondaryButton: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  primaryButton: {
    backgroundColor: PALETTE.primary,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
})