import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'
import { DayItem } from '../utils/semana'

interface WeekStripProps {
  days: DayItem[]
  selectedDayId: string
  onSelectDay: (dayId: string) => void
  accentColor: string
}

export function WeekStrip({ days, selectedDayId, onSelectDay, accentColor }: WeekStripProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {days.map((day) => {
          const isSelected = day.id === selectedDayId
          return (
            <Pressable
              key={day.id}
              onPress={() => onSelectDay(day.id)}
              style={({ pressed }) => [
                styles.dayButton,
                isSelected && { backgroundColor: accentColor },
                pressed && pressedFeedback,
              ]}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {day.dayLabel}
              </Text>
              <Text style={[styles.dayDate, isSelected ? styles.dayDateSelected : day.isToday && { color: accentColor, fontWeight: '700' }]}>
                {day.date}
              </Text>
              <View
                style={[
                  styles.dot,
                  day.isToday && !isSelected ? { backgroundColor: accentColor } : styles.dotHidden,
                ]}
              />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 16,
    ...SHADOW.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayButton: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.interior,
    minWidth: 40,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  dayDateSelected: {
    color: PALETTE.onAccent,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotHidden: {
    backgroundColor: 'transparent',
  },
})