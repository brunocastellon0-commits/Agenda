import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { TipoActividad } from '../repositories/actividadRepo'

interface ContextButtonProps {
  tipo: TipoActividad
  onPress: () => void
}

export function ContextButton({ tipo, onPress }: ContextButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View style={[styles.emojiBadge, { backgroundColor: tint(tipo.color) }]}>
          {tipo.emoji ? (
            <Text style={styles.emoji}>{tipo.emoji}</Text>
          ) : (
            <MaterialIcons name="flag" size={18} color={tipo.color} />
          )}
        </View>
        <View>
          <Text style={styles.label}>Tipo de actividad</Text>
          <Text style={[styles.value, { color: tipo.color }]}>{tipo.nombre}</Text>
        </View>
      </View>
      <MaterialIcons name="keyboard-arrow-down" size={24} color={PALETTE.onSurfaceVariant} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    marginBottom: 16,
    ...SHADOW.card,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.interior,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
})