import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { DIAS_SEMANA_HEADERS, DiaMes, formatoMesAno } from '../utils/calendario'
import { IndicadorDiaMes } from '../repositories/actividadRepo'

interface MonthlyCalendarProps {
  year: number
  monthIndex: number // 0 a 11
  dias: DiaMes[]
  indicadoresPorFecha: Record<string, IndicadorDiaMes>
  accentColor: string
  esMesHoy: boolean
  /** True cuando estamos en vista "Todas las áreas" — muestra dots multicolores + "+" */
  modoTodas?: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDay: (fechaISO: string) => void
  onGoToToday: () => void
}

export function MonthlyCalendar({
  year,
  monthIndex,
  dias,
  indicadoresPorFecha,
  accentColor,
  esMesHoy,
  modoTodas = false,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onGoToToday,
}: MonthlyCalendarProps) {
  const mesLabel = formatoMesAno(year, monthIndex)

  return (
    <View style={styles.card}>
      {/* Cabecera del mes con navegación */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.monthTitle}>{mesLabel}</Text>
          {!esMesHoy && (
            <Pressable
              onPress={onGoToToday}
              style={({ pressed }) => [styles.todayButton, pressed && pressedFeedback]}
            >
              <Text style={[styles.todayButtonText, { color: accentColor }]}>Hoy</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.navButtons}>
          <Pressable
            onPress={onPrevMonth}
            hitSlop={8}
            style={({ pressed }) => [styles.navBtn, pressed && pressedFeedback]}
          >
            <MaterialIcons name="chevron-left" size={22} color={PALETTE.ink} />
          </Pressable>
          <Pressable
            onPress={onNextMonth}
            hitSlop={8}
            style={({ pressed }) => [styles.navBtn, pressed && pressedFeedback]}
          >
            <MaterialIcons name="chevron-right" size={22} color={PALETTE.ink} />
          </Pressable>
        </View>
      </View>

      {/* Días de la semana (L M X J V S D) */}
      <View style={styles.weekdaysRow}>
        {DIAS_SEMANA_HEADERS.map((dia, idx) => (
          <View key={idx} style={styles.weekdayCol}>
            <Text style={styles.weekdayText}>{dia}</Text>
          </View>
        ))}
      </View>

      {/* Grilla mensual de 7 columnas */}
      <View style={styles.grid}>
        {dias.map((dia) => {
          const indicador = indicadoresPorFecha[dia.fechaISO]
          const total = indicador?.total ?? 0
          const pendientes = indicador?.pendientes ?? 0
          const colores = indicador?.colores ?? []
          const totalAreas = indicador?.totalAreas ?? 0
          const todosCompletados = total > 0 && pendientes === 0

          return (
            <Pressable
              key={dia.fechaISO}
              onPress={() => onSelectDay(dia.fechaISO)}
              style={({ pressed }) => [
                styles.dayCell,
                pressed && pressedFeedback,
              ]}
            >
              <View
                style={[
                  styles.dayNumberContainer,
                  dia.esSeleccionado && [styles.selectedContainer, { backgroundColor: accentColor }],
                  dia.esHoy && !dia.esSeleccionado && [styles.todayContainer, { borderColor: accentColor }],
                ]}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    !dia.esMesActual && styles.dayNumberOutOfMonth,
                    dia.esHoy && !dia.esSeleccionado && { color: accentColor, fontWeight: '700' },
                    dia.esSeleccionado && styles.dayNumberSelected,
                  ]}
                >
                  {dia.diaNumero}
                </Text>
              </View>

              {/* Indicadores sutiles (dots) */}
              <View style={styles.dotsRow}>
                {todosCompletados ? (
                  <View
                    style={[
                      modoTodas ? styles.completedDotOutline : styles.completedDot,
                      modoTodas
                        ? { borderColor: dia.esSeleccionado ? PALETTE.outline : PALETTE.categorias.finanzas }
                        : { backgroundColor: dia.esSeleccionado ? PALETTE.outline : PALETTE.categorias.finanzas },
                    ]}
                  />
                ) : (
                  <>
                    {colores.slice(0, 3).map((col, cIdx) => (
                      <View
                        key={cIdx}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: dia.esSeleccionado
                              ? PALETTE.onAccent
                              : modoTodas ? col : accentColor,
                          },
                        ]}
                      />
                    ))}
                    {modoTodas && totalAreas > 3 && (
                      <Text
                        style={[
                          styles.plusIndicator,
                          { color: dia.esSeleccionado ? PALETTE.onAccent : PALETTE.onSurfaceVariant },
                        ]}
                      >
                        +
                      </Text>
                    )}
                  </>
                )}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
    ...SHADOW.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: 0.6,
  },
  todayButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: PALETTE.surfaceContainer,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
    paddingBottom: 8,
    marginBottom: 4,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    minHeight: 44,
  },
  dayNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedContainer: {
    ...SHADOW.card,
  },
  todayContainer: {
    borderWidth: 1.5,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  dayNumberOutOfMonth: {
    color: PALETTE.outline,
    opacity: 0.5,
  },
  dayNumberSelected: {
    color: PALETTE.onAccent,
    fontWeight: '800',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
    height: 5,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  completedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
  completedDotOutline: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    opacity: 0.6,
  },
  plusIndicator: {
    fontSize: 7,
    fontWeight: '700',
    lineHeight: 7,
    marginLeft: 0.5,
  },
})
