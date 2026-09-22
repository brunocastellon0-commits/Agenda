import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'
import { DayItem } from '../utils/semana'

interface NotebookCalendarProps {
  days: DayItem[]
  selectedDayId: string
  onSelectDay: (dayId: string) => void
  accentColor: string
  monthLabel?: string
  onPrevWeek?: () => void
  onNextWeek?: () => void
}

export function NotebookCalendar({
  days,
  selectedDayId,
  onSelectDay,
  accentColor,
  monthLabel,
  onPrevWeek,
  onNextWeek,
}: NotebookCalendarProps) {
  return (
    <View style={styles.notebookPage}>
      {/* Espiral del cuadernito (Binder Rings) */}
      <View style={styles.binderRings}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View key={index} style={styles.ringHole} />
        ))}
      </View>

      {/* Cabecera de Cuaderno */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="edit-calendar" size={20} color={accentColor} />
          <Text style={styles.monthTitle}>{monthLabel || 'Agenda de Planificación'}</Text>
        </View>

        {(onPrevWeek || onNextWeek) && (
          <View style={styles.navRow}>
            {onPrevWeek && (
              <Pressable
                onPress={onPrevWeek}
                style={({ pressed }) => [styles.navBtn, pressed && pressedFeedback]}
              >
                <MaterialIcons name="chevron-left" size={20} color={PALETTE.ink} />
              </Pressable>
            )}
            {onNextWeek && (
              <Pressable
                onPress={onNextWeek}
                style={({ pressed }) => [styles.navBtn, pressed && pressedFeedback]}
              >
                <MaterialIcons name="chevron-right" size={20} color={PALETTE.ink} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Grilla de Días Estilo Cuadernito */}
      <View style={styles.grid}>
        {days.map((day) => {
          const isSelected = day.id === selectedDayId

          return (
            <Pressable
              key={day.id}
              onPress={() => onSelectDay(day.id)}
              style={({ pressed }) => [
                styles.dayCell,
                isSelected && [styles.dayCellSelected, { backgroundColor: accentColor }],
                day.isToday && !isSelected && styles.dayCellToday,
                pressed && pressedFeedback,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                  day.isToday && !isSelected && { color: accentColor },
                ]}
              >
                {day.dayLabel}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  day.isToday && !isSelected && { color: accentColor, fontWeight: '800' },
                ]}
              >
                {day.date}
              </Text>

              {day.isToday && !isSelected && (
                <View style={[styles.todayIndicator, { backgroundColor: accentColor }]} />
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  notebookPage: {
    borderRadius: 20,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
    ...SHADOW.card,
    position: 'relative',
  },
  binderRings: {
    position: 'absolute',
    top: 6,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.surfaceContainer,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    textTransform: 'capitalize',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PALETTE.surfaceContainer,
    minHeight: 56,
    position: 'relative',
  },
  dayCellSelected: {
    ...SHADOW.card,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: PALETTE.hairline,
    backgroundColor: PALETTE.surfaceContainerLow,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  dayNumberSelected: {
    color: PALETTE.onAccent,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
})
