import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native'
import { PALETTE } from '../theme/theme'

interface AreaVerticalTransitionProps {
  /** Clave única del área actual ('todas' o id de área). */
  areaKey: string | number
  /** Índice ordenado del área para determinar si la transición es hacia abajo o hacia arriba (-1 para Todas). */
  areaIndex?: number
  /** Página completa del día (con su propio ScrollView). */
  children: React.ReactNode
}

// Misma especificación que la navegación entre pantallas (Easing cúbico in/out),
// con duración levemente mayor para que el cambio de área se lea como página completa.
const DURACION_MS = 680

/** Transición vertical estilo Linux entre áreas: la página vieja completa se desliza
 *  fuera (solo translateY, sin scale/opacity para no laggear capas pesadas) y desde
 *  el fondo queda la del área seleccionada, que se renderiza estática debajo. */
export function AreaVerticalTransition({
  areaKey,
  areaIndex = 0,
  children,
}: AreaVerticalTransitionProps) {
  const { height: screenHeight } = useWindowDimensions()

  // Página vieja que se está yendo (única capa animada)
  const [exitingNode, setExitingNode] = useState<React.ReactNode>(null)
  const [dir, setDir] = useState<1 | -1>(1)

  const currentKey = String(areaKey)

  // Captura del último children commiteado (durante el render, patrón "latest value")
  const lastChildrenRef = useRef<React.ReactNode>(children)
  const pendingExitRef = useRef<React.ReactNode>(null)
  const prevKeyRef = useRef(currentKey)
  const prevIndexRef = useRef(areaIndex)

  const rafSeqRef = useRef(0)
  const rafHandleRef = useRef<number | null>(null)

  const progress = useRef(new Animated.Value(0)).current

  if (currentKey !== prevKeyRef.current) {
    // Cambio de área: congelar la página vieja ANTES del commit de la nueva,
    // para que el overlay se monte cubriendo en el mismo commit (sin destape).
    pendingExitRef.current = lastChildrenRef.current
    prevKeyRef.current = currentKey
    progress.setValue(0)
  }
  lastChildrenRef.current = children

  useEffect(() => {
    const exiting = pendingExitRef.current
    if (!exiting) return
    pendingExitRef.current = null

    const direction: 1 | -1 = areaIndex >= prevIndexRef.current ? 1 : -1
    prevIndexRef.current = areaIndex

    setExitingNode(exiting)
    setDir(direction)

    // El valor se reusa: cancelar cualquier animación en vuelo y volver a 0
    progress.stopAnimation()
    progress.setValue(0)

    // Arrancar el timing recién en el frame siguiente, cuando la capa saliente
    // ya esté commiteada y su nodo nativo atado. Si arrancara acá (mismo effect),
    // con useNativeDriver el progreso ya habría avanzado antes de montarse.
    const seq = ++rafSeqRef.current
    if (rafHandleRef.current != null) cancelAnimationFrame(rafHandleRef.current)
    rafHandleRef.current = requestAnimationFrame(() => {
      rafHandleRef.current = null
      if (seq !== rafSeqRef.current) return
      Animated.timing(progress, {
        toValue: 1,
        duration: DURACION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setExitingNode(null)
      })
    })
  }, [areaKey, areaIndex, progress])

  // Cancelar RAF pendiente y animación al desmontar
  useEffect(() => {
    return () => {
      if (rafHandleRef.current != null) cancelAnimationFrame(rafHandleRef.current)
      progress.stopAnimation()
    }
  }, [progress])

  // Capa saliente: solo translateY, la página completa se va de pantalla
  const exitTranslateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, dir * screenHeight],
      }),
    [progress, dir, screenHeight]
  )

  // El overlay se monta en el mismo commit en que cambia la base (sin flash de la página nueva)
  const exitNode = exitingNode ?? pendingExitRef.current

  return (
    <View style={styles.container}>
      {/* Base: página nueva (estática, se descubre debajo de la que sale) */}
      {children}

      {/* Capa saliente: página vieja completa deslizándose fuera */}
      {exitNode != null && (
        <Animated.View
          pointerEvents="none"
          style={[styles.exitLayer, { transform: [{ translateY: exitTranslateY }] }]}
        >
          {exitNode}
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exitLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    // En Android, la elevation eleva el overlay por encima de la base aunque sus
    // tarjetas tengan elevation (sin esto, la página nueva se pintaba arriba del
    // formulario que sale y "heredaba" su color/nombre de área). iOS la ignora.
    elevation: 30,
    backgroundColor: PALETTE.surface,
  },
})