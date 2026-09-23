import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { PALETTE } from '../theme/theme'

interface GreetingHeaderProps {
  dateLabel: string
  greeting: string
  pendingCount: number
  inProgressCount?: number
  completedCount?: number
  accentColor: string
  /** Número de áreas distintas con pendientes (modo "Todas") */
  areasCount?: number
  /** Nombre del área filtrada (modo individual) */
  areaNombre?: string
}

export function GreetingHeader({
  dateLabel,
  greeting,
  pendingCount,
  inProgressCount = 0,
  completedCount = 0,
  accentColor,
  areasCount = 0,
  areaNombre,
}: GreetingHeaderProps) {
  const renderResumen = () => {
    // Modo "Todas las áreas" con en_progreso
    if (inProgressCount > 0 && !areaNombre && areasCount > 1) {
      return (
        <Text style={styles.subtitle}>
          <Text style={[styles.highlight, { color: accentColor }]}>
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </Text>
          {' en '}
          <Text style={[styles.highlight, { color: accentColor }]}>
            {areasCount} áreas
          </Text>
          {' · '}
          <Text style={[styles.highlight, { color: PALETTE.primary }]}>
            {inProgressCount} en progreso
          </Text>
        </Text>
      )
    }

    if (inProgressCount > 0) {
      return (
        <Text style={styles.subtitle}>
          <Text style={[styles.highlight, { color: accentColor }]}>
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </Text>
          {areaNombre ? ` de ${areaNombre}` : ''}
          {' · '}
          <Text style={[styles.highlight, { color: PALETTE.primary }]}>
            {inProgressCount} en progreso
          </Text>
        </Text>
      )
    }

    if (completedCount > 0 && pendingCount > 0) {
      // Modo "Todas" con múltiples áreas
      if (!areaNombre && areasCount > 1) {
        return (
          <Text style={styles.subtitle}>
            <Text style={[styles.highlight, { color: accentColor }]}>
              {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
            </Text>
            {' en '}
            <Text style={[styles.highlight, { color: accentColor }]}>
              {areasCount} áreas
            </Text>
            {' · '}
            <Text style={{ color: PALETTE.onSurfaceVariant }}>
              {completedCount} completada{completedCount === 1 ? '' : 's'}
            </Text>
          </Text>
        )
      }
      return (
        <Text style={styles.subtitle}>
          <Text style={[styles.highlight, { color: accentColor }]}>
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </Text>
          {areaNombre ? ` de ${areaNombre}` : ''}
          {' · '}
          <Text style={{ color: PALETTE.onSurfaceVariant }}>
            {completedCount} completada{completedCount === 1 ? '' : 's'}
          </Text>
        </Text>
      )
    }

    if (completedCount > 0 && pendingCount === 0) {
      return (
        <Text style={styles.subtitle}>
          <Text style={[styles.highlight, { color: PALETTE.categorias.finanzas }]}>
            ¡Todas las actividades completadas! ({completedCount})
          </Text>
        </Text>
      )
    }

    // Solo pendientes, modo "Todas"
    if (!areaNombre && areasCount > 1) {
      return (
        <Text style={styles.subtitle}>
          <Text style={[styles.highlight, { color: accentColor }]}>
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </Text>
          {' en '}
          <Text style={[styles.highlight, { color: accentColor }]}>
            {areasCount} áreas
          </Text>
        </Text>
      )
    }

    return (
      <Text style={styles.subtitle}>
        Tienes{' '}
        <Text style={[styles.highlight, { color: accentColor }]}>
          {pendingCount} {pendingCount === 1 ? 'actividad' : 'actividades'}
        </Text>{' '}
        {areaNombre ? `de ${areaNombre} ` : ''}pendientes hoy.
      </Text>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.greeting}>{greeting}</Text>
      {renderResumen()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    marginTop: 3,
  },
  highlight: {
    fontWeight: '700',
  },
})