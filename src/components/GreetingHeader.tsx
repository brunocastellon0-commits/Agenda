import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { PALETTE } from '../theme/theme'

interface GreetingHeaderProps {
  dateLabel: string
  greeting: string
  pendingCount: number
  accentColor: string
}

export function GreetingHeader({ dateLabel, greeting, pendingCount, accentColor }: GreetingHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.subtitle}>
        Tienes{' '}
        <Text style={[styles.pendingCount, { color: accentColor }]}>
          {pendingCount} {pendingCount === 1 ? 'actividad' : 'actividades'}
        </Text>{' '}
        pendientes hoy.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  pendingCount: {
    fontWeight: '700',
  },
})