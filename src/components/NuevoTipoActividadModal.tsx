import React, { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'
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

export function NuevoTipoActividadModal({ visible, onClose, onSave }: NuevoTipoActividadModalProps) {
  const insets = useSafeAreaInsets()
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('')
  const [colorIndex, setColorIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNombre('')
      setEmoji('')
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
      emoji: emoji.trim().length ? emoji.trim() : undefined,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Tipo de actividad</Text>
              <Text style={styles.subtitle}>Trabajo, universidad, ocio o cualquier cosa que quieras registrar.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej. Universidad"
                placeholderTextColor={PALETTE.onSurfaceVariant}
                maxLength={40}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ícono (opcional)</Text>
              <TextInput
                style={styles.input}
                value={emoji}
                onChangeText={setEmoji}
                placeholder="Ej. 🎓"
                placeholderTextColor={PALETTE.onSurfaceVariant}
                maxLength={4}
              />
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
    ...SHADOW.modal,
  },
  header: {
    marginBottom: 16,
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
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.ink,
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