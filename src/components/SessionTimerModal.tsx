import React, { useEffect, useState, useRef } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'

interface SessionTimerModalProps {
  visible: boolean
  actividadTitulo: string
  accentColor: string
  onClose: () => void
  onFinish: (duracionEfectivaMin: number, duracionPausaMin: number, notas?: string) => void
}

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

export function SessionTimerModal({
  visible,
  actividadTitulo,
  accentColor,
  onClose,
  onFinish,
}: SessionTimerModalProps) {
  const insets = useSafeAreaInsets()
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [totalPauseMs, setTotalPauseMs] = useState(0)
  const [notas, setNotas] = useState('')

  const startTimeRef = useRef<number | null>(null)
  const pauseStartTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (visible && timerState === 'idle') {
      setElapsedMs(0)
      setTotalPauseMs(0)
      setNotas('')
      setTimerState('idle')
      startTimeRef.current = null
      pauseStartTimeRef.current = null
    }
    if (!visible) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setTimerState('idle')
    }
  }, [visible])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now()
          setElapsedMs(now - startTimeRef.current - totalPauseMs)
        }
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState, totalPauseMs])

  const handleStart = () => {
    if (timerState === 'idle') {
      startTimeRef.current = Date.now()
    } else if (timerState === 'paused' && pauseStartTimeRef.current) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current
      setTotalPauseMs((prev) => prev + pauseDuration)
      pauseStartTimeRef.current = null
    }
    setTimerState('running')
  }

  const handlePause = () => {
    if (timerState === 'running') {
      pauseStartTimeRef.current = Date.now()
      setTimerState('paused')
    }
  }

  const handleFinishSession = () => {
    let finalPauseMs = totalPauseMs
    if (timerState === 'paused' && pauseStartTimeRef.current) {
      finalPauseMs += Date.now() - pauseStartTimeRef.current
    }
    setTotalPauseMs(finalPauseMs)
    setTimerState('finished')
  }

  const handleSaveAndClose = () => {
    const totalElapsed = elapsedMs
    const duracionEfectivaMin = Math.round(totalElapsed / 60000)
    const duracionPausaMin = Math.round(totalPauseMs / 60000)
    onFinish(duracionEfectivaMin, duracionPausaMin, notas.trim() || undefined)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Sesión activa</Text>
            <Text style={[styles.subtitle, { color: accentColor }]}>{actividadTitulo}</Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {timerState !== 'finished' ? (
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>{formatTime(elapsedMs)}</Text>
                  
                  <View style={styles.controlsRow}>
                    {timerState === 'idle' && (
                      <Pressable
                        style={({ pressed }) => [styles.btnPrimary, { backgroundColor: accentColor }, pressed && pressedFeedback]}
                        onPress={handleStart}
                      >
                        <MaterialIcons name="play-arrow" size={24} color={PALETTE.onAccent} />
                        <Text style={styles.btnPrimaryText}>Iniciar</Text>
                      </Pressable>
                    )}

                    {(timerState === 'running' || timerState === 'paused') && (
                      <>
                        <Pressable
                          style={({ pressed }) => [styles.btnSecondary, pressed && pressedFeedback]}
                          onPress={timerState === 'running' ? handlePause : handleStart}
                        >
                          <MaterialIcons name={timerState === 'running' ? 'pause' : 'play-arrow'} size={24} color={PALETTE.ink} />
                          <Text style={styles.btnSecondaryText}>{timerState === 'running' ? 'Pausar' : 'Reanudar'}</Text>
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [styles.btnPrimary, { backgroundColor: accentColor }, pressed && pressedFeedback]}
                          onPress={handleFinishSession}
                        >
                          <MaterialIcons name="stop" size={24} color={PALETTE.onAccent} />
                          <Text style={styles.btnPrimaryText}>Finalizar</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.finishContainer}>
                  <Text style={styles.summaryText}>Tiempo enfocado: {formatTime(elapsedMs)}</Text>
                  
                  <View style={styles.field}>
                    <Text style={styles.label}>Notas de la sesión (opcional)</Text>
                    <TextInput
                      style={styles.input}
                      value={notas}
                      onChangeText={setNotas}
                      placeholder="¿Qué lograste?"
                      placeholderTextColor={PALETTE.onSurfaceVariant}
                      multiline
                    />
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [styles.btnPrimary, { backgroundColor: accentColor }, pressed && pressedFeedback]}
                      onPress={handleSaveAndClose}
                    >
                      <Text style={styles.btnPrimaryText}>Guardar sesión</Text>
                    </Pressable>
                  </View>
                </View>
              )}
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
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  finishContainer: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 8,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
    backgroundColor: PALETTE.surfaceContainer,
    gap: 8,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
})
