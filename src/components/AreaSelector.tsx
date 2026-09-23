import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { TipoActividad } from '../repositories/actividadRepo'

interface AreaSelectorProps {
  tipoSeleccionado?: TipoActividad
  pendingCount?: number
  onPress: () => void
}

export function AreaSelector({
  tipoSeleccionado,
  pendingCount = 0,
  onPress,
}: AreaSelectorProps) {
  const nombre = tipoSeleccionado ? tipoSeleccionado.nombre : 'Todas las áreas'
  const color = tipoSeleccionado ? tipoSeleccionado.color : PALETTE.primary
  const iconName = (tipoSeleccionado?.emoji as keyof typeof MaterialIcons.glyphMap) || 'grid-view'

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: tint(color) }]}>
          <MaterialIcons name={iconName} size={18} color={color} />
        </View>
        <Text style={[styles.label, { color }]}>{nombre}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={PALETTE.onSurfaceVariant} />
      </View>

      {pendingCount > 0 && (
        <View style={[styles.pill, { backgroundColor: tint(color) }]}>
          <Text style={[styles.pillText, { color }]}>
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    ...SHADOW.card,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
})
