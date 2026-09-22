import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { TipoActividad } from '../repositories/actividadRepo'

interface ContextButtonProps {
  tipo: TipoActividad
  pendingCount?: number
  onPress: () => void
}

export function ContextButton({ tipo, pendingCount = 0, onPress }: ContextButtonProps) {
  const iconName = (tipo.emoji as keyof typeof MaterialIcons.glyphMap) || 'folder'

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View style={[styles.iconBadge, { backgroundColor: tint(tipo.color) }]}>
          <MaterialIcons name={iconName} size={20} color={tipo.color} />
          {pendingCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: tipo.color }]}>
              <Text style={styles.notificationText}>
                {pendingCount > 99 ? '99+' : pendingCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Área de Actividad</Text>
          <Text style={[styles.value, { color: tipo.color }]}>{tipo.nombre}</Text>
        </View>
      </View>
      
      <View style={styles.right}>
        {pendingCount > 0 && (
          <View style={[styles.counterPill, { backgroundColor: tint(tipo.color) }]}>
            <Text style={[styles.counterPillText, { color: tipo.color }]}>
              {pendingCount}
            </Text>
          </View>
        )}
        <MaterialIcons name="keyboard-arrow-down" size={24} color={PALETTE.onSurfaceVariant} />
      </View>
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
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: PALETTE.surfaceContainerLowest,
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.onAccent,
  },
  textContainer: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  counterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  counterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
})