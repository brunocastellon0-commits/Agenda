import React, { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'

interface UndoToastProps {
  visible: boolean
  mensaje: string
  onUndo: () => void
  onDismiss: () => void
  durationMs?: number
}

export function UndoToast({
  visible,
  mensaje,
  onUndo,
  onDismiss,
  durationMs = 4000,
}: UndoToastProps) {
  const translateY = useRef(new Animated.Value(60)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(() => {
        handleDismiss()
      }, durationMs)

      return () => clearTimeout(timer)
    } else {
      translateY.setValue(60)
      opacity.setValue(0)
    }
  }, [visible])

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 60,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss()
    })
  }

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.content}>
          <MaterialIcons name="info-outline" size={18} color={PALETTE.onDark} />
          <Text style={styles.text} numberOfLines={1}>
            {mensaje}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            onUndo()
            handleDismiss()
          }}
          style={({ pressed }) => [styles.undoButton, pressed && pressedFeedback]}
        >
          <Text style={styles.undoText}>Deshacer</Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84, // Por encima de la BottomNavigationBar
    left: 20,
    right: 20,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.surfaceDark,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...SHADOW.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.onDark,
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 8,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
})
