import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface KeyboardSheetProps {
  children: React.ReactNode
  /** Extra padding at the bottom beyond safe area (default 16) */
  extraBottom?: number
  /** Style for the inner ScrollView content container */
  contentStyle?: ViewStyle
  /** Whether to show scroll indicator (default false) */
  showIndicator?: boolean
}

/**
 * Wrapper reutilizable para bottom-sheets con formularios.
 * Garantiza que el teclado nunca tape el input activo.
 *
 * Uso: reemplazar la sección `<ScrollView>` dentro del sheet por:
 * ```tsx
 * <KeyboardSheet>
 *   {/* campos del formulario *\/}
 * </KeyboardSheet>
 * ```
 *
 * En iOS usa `behavior="padding"` para empujar el contenido.
 * En Android, Expo usa `adjustResize` por defecto → el sistema
 * ya reduce la ventana; `behavior` queda `undefined`.
 */
export function KeyboardSheet({
  children,
  extraBottom = 16,
  contentStyle,
  showIndicator = false,
}: KeyboardSheetProps) {
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={showIndicator}
        contentContainerStyle={[
          { paddingBottom: insets.bottom + extraBottom },
          contentStyle,
        ]}
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})
