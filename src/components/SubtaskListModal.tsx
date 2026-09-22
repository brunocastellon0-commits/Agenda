import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View, TextInput, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'
import { ActividadSubtarea } from '../repositories/actividadRepo'

interface SubtaskListModalProps {
  visible: boolean
  actividadTitulo: string
  accentColor: string
  subtareas: ActividadSubtarea[]
  onToggle: (id: number) => void
  onAdd: (titulo: string) => void
  onDelete: (id: number) => void
  onClose: () => void
}

export function SubtaskListModal({
  visible,
  actividadTitulo,
  accentColor,
  subtareas,
  onToggle,
  onAdd,
  onDelete,
  onClose,
}: SubtaskListModalProps) {
  const insets = useSafeAreaInsets()
  const [nuevaSubtarea, setNuevaSubtarea] = useState('')

  const handleAdd = () => {
    if (nuevaSubtarea.trim().length > 0) {
      onAdd(nuevaSubtarea.trim())
      setNuevaSubtarea('')
    }
  }

  const completadas = subtareas.filter((s) => s.completado === 1).length
  const total = subtareas.length
  const progreso = total > 0 ? completadas / total : 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Subtareas</Text>
            <Text style={[styles.subtitle, { color: accentColor }]}>{actividadTitulo}</Text>
            
            {total > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { backgroundColor: accentColor, width: `${progreso * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{completadas}/{total}</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {subtareas.map((subtarea) => {
              const done = subtarea.completado === 1
              return (
                <View key={subtarea.id} style={styles.subtaskRow}>
                  <Pressable
                    onPress={() => subtarea.id !== undefined && onToggle(subtarea.id)}
                    style={({ pressed }) => [
                      styles.checkbox,
                      {
                        borderColor: done ? accentColor : PALETTE.outline,
                        backgroundColor: done ? accentColor : 'transparent',
                      },
                      pressed && pressedFeedback,
                    ]}
                  >
                    {done && <MaterialIcons name="check" size={13} color={PALETTE.onAccent} />}
                  </Pressable>
                  <Text style={[styles.subtaskTitle, done && styles.subtaskTitleDone]}>
                    {subtarea.titulo}
                  </Text>
                  <Pressable
                    onPress={() => subtarea.id !== undefined && onDelete(subtarea.id)}
                    style={({ pressed }) => [styles.deleteBtn, pressed && pressedFeedback]}
                  >
                    <MaterialIcons name="close" size={18} color={PALETTE.onSurfaceVariant} />
                  </Pressable>
                </View>
              )
            })}
          </ScrollView>

          <View style={styles.addContianer}>
            <TextInput
              style={styles.input}
              value={nuevaSubtarea}
              onChangeText={setNuevaSubtarea}
              placeholder="Nueva subtarea..."
              placeholderTextColor={PALETTE.onSurfaceVariant}
              onSubmitEditing={handleAdd}
            />
            <Pressable
              style={({ pressed }) => [styles.addBtn, { backgroundColor: accentColor }, pressed && pressedFeedback]}
              onPress={handleAdd}
            >
              <MaterialIcons name="add" size={20} color={PALETTE.onAccent} />
            </Pressable>
          </View>
          
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && pressedFeedback]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>Cerrar</Text>
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
    marginHorizontal: 12,
    marginBottom: 8,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
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
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  listContainer: {
    marginBottom: 16,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  subtaskTitleDone: {
    color: PALETTE.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    padding: 4,
  },
  addContianer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.ink,
  },
  addBtn: {
    width: 48,
    borderRadius: RADIUS.interior,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
})
