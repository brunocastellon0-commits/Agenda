import React, { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'

import { PRIORIDADES, CONTEXTOS } from '../repositories/actividadRepo'
import { validarEntero, parseNumero } from '../utils/validacion'

export interface NuevaActividadData {
  titulo: string
  descripcion?: string
  hora?: string
  duracion_estimada_min?: number | null
  prioridad?: string
  contexto?: string
}

interface AddActividadModalProps {
  visible: boolean
  tipoNombre: string
  accentColor: string
  onClose: () => void
  onSave: (data: NuevaActividadData) => void
}

const HORA_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function AddActividadModal({
  visible,
  tipoNombre,
  accentColor,
  onClose,
  onSave,
}: AddActividadModalProps) {
  const insets = useSafeAreaInsets()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [hora, setHora] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [duracion, setDuracion] = useState('')
  const [prioridad, setPrioridad] = useState<string>('normal')
  const [contexto, setContexto] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setTitulo('')
      setDescripcion('')
      setHora('')
      setError(null)
      setShowAdvanced(false)
      setDuracion('')
      setPrioridad('normal')
      setContexto(null)
    }
  }, [visible])

  const handleGuardar = () => {
    const t = titulo.trim()
    const d = descripcion.trim()
    const h = hora.trim()
    if (t.length < 2 || t.length > 60) {
      setError('El título debe tener entre 2 y 60 caracteres.')
      return
    }
    if (d.length > 160) {
      setError('La descripción no puede superar los 160 caracteres.')
      return
    }
    if (h.length > 0 && !HORA_REGEX.test(h)) {
      setError('La hora debe tener formato HH:MM (ej. 18:30).')
      return
    }
    if (duracion.trim().length > 0) {
      const errDuracion = validarEntero(duracion, 1, 1440)
      if (errDuracion) {
        setError(`Duración: ${errDuracion}`)
        return
      }
    }
    setError(null)
    onSave({ 
      titulo: t, 
      descripcion: d.length ? d : undefined, 
      hora: h.length ? h : undefined,
      duracion_estimada_min: duracion.trim().length ? parseNumero(duracion) : null,
      prioridad: prioridad,
      contexto: contexto ?? undefined
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Nueva actividad</Text>
              <Text style={[styles.subtitle, { color: accentColor }]}>{tipoNombre}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="¿Qué vas a hacer?"
                placeholderTextColor={PALETTE.onSurfaceVariant}
                maxLength={60}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Detalle breve"
                placeholderTextColor={PALETTE.onSurfaceVariant}
                maxLength={160}
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Hora (opcional)</Text>
              <TextInput
                style={styles.input}
                value={hora}
                onChangeText={setHora}
                placeholder="18:30"
                placeholderTextColor={PALETTE.onSurfaceVariant}
                maxLength={5}
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Text style={[styles.advancedToggleText, { color: accentColor }]}>
                {showAdvanced ? 'Menos opciones ▲' : 'Más opciones ▼'}
              </Text>
            </Pressable>

            {showAdvanced && (
              <View style={styles.advancedSection}>
                <View style={styles.field}>
                  <Text style={styles.label}>Duración estimada (minutos)</Text>
                  <TextInput
                    style={styles.input}
                    value={duracion}
                    onChangeText={setDuracion}
                    placeholder="Ej. 45"
                    placeholderTextColor={PALETTE.onSurfaceVariant}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Prioridad</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                    {PRIORIDADES.map((p) => {
                      const selected = prioridad === p.valor;
                      return (
                        <Pressable
                          key={p.valor}
                          onPress={() => setPrioridad(p.valor)}
                          style={[
                            styles.chip,
                            selected && { backgroundColor: p.color }
                          ]}
                        >
                          <Text style={[
                            styles.chipText,
                            selected && { color: PALETTE.onAccent }
                          ]}>{p.label}</Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Contexto</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                    {CONTEXTOS.map((c) => {
                      const selected = contexto === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setContexto(selected ? null : c)}
                          style={[
                            styles.chip,
                            selected && { backgroundColor: accentColor }
                          ]}
                        >
                          <Text style={[
                            styles.chipText,
                            selected && { color: PALETTE.onAccent }
                          ]}>{c}</Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && pressedFeedback]}
                onPress={onClose}
              >
                <Text style={styles.secondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.button, { backgroundColor: accentColor }, pressed && pressedFeedback]}
                onPress={handleGuardar}
              >
                <Text style={styles.primaryText}>Guardar</Text>
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
    fontWeight: '600',
    marginTop: 2,
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
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
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
  advancedToggle: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  advancedToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  advancedSection: {
    marginBottom: 8,
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.buttons,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.ink,
  },
})