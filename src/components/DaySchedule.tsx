import React, { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'
import {
  finVisual,
  inicioDe,
  layoutColumnas,
  minutosDeAhora,
  rangoAgenda,
} from '../utils/scheduleLayout'
import { AtrasadasSection } from './AtrasadasSection'
import { TimeGrid } from './TimeGrid'
import { UntimedActivities } from './UntimedActivities'

interface DayScheduleProps {
  /** ya filtradas por día */
  programadas: Actividad[]
  sinHora: Actividad[]
  atrasadas: Actividad[]
  tipos: TipoActividad[]
  esHoy: boolean
  fechaISO: string
  ahoraRef: Date
  cargando: boolean
  accentColor: string
  subtareasCounts?: Record<number, { total: number; completadas: number }>
  onToggle: (actividadId: number) => void
  onToggleEnProgreso: (actividadId: number) => void
  onPostpone: (actividad: Actividad) => void
  onDelete: (actividad: Actividad) => void
  onPressSubtareas: (actividad: Actividad) => void
  onOpenActions: (actividad: Actividad) => void
  onReprogramarLoteAtrasadas: () => void
  onPressTime?: (minute: number) => void
}

/**
 * Agenda horaria del día: atrasadas (solo hoy) → rejilla temporal → sin hora.
 * No renderiza su propio ScrollView: el de ActividadesScreen ya existe.
 */
export function DaySchedule({
  programadas,
  sinHora,
  atrasadas,
  tipos,
  esHoy,
  ahoraRef,
  cargando,
  accentColor,
  subtareasCounts,
  onToggle,
  onToggleEnProgreso,
  onPostpone,
  onDelete,
  onPressSubtareas,
  onOpenActions,
  onReprogramarLoteAtrasadas,
  onPressTime,
}: DayScheduleProps) {
  const ahoraMin = minutosDeAhora(ahoraRef)

  const rango = useMemo(
    () => rangoAgenda(programadas, esHoy, ahoraMin),
    [programadas, esHoy, ahoraMin]
  )

  const bloques = useMemo(() => {
    if (!rango) return []
    return layoutColumnas(
      programadas.map((a) => ({
        id: a.id!,
        inicio: inicioDe(a),
        fin: finVisual(a),
      }))
    )
  }, [programadas, rango])

  // ── Cargando ──
  if (cargando && programadas.length === 0 && sinHora.length === 0 && atrasadas.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <ActivityIndicator size="small" color={accentColor} />
        <Text style={styles.emptyText}>Cargando agenda…</Text>
      </View>
    )
  }

  const vacio =
    programadas.length === 0 && sinHora.length === 0 && atrasadas.length === 0

  if (vacio) {
    return (
      <View style={styles.emptyCard}>
        <View style={[styles.emptyIcon, { backgroundColor: tint(accentColor, 0.12) }]}>
          <MaterialIcons name="event-available" size={22} color={accentColor} />
        </View>
        <Text style={styles.emptyTitle}>Día libre</Text>
        <Text style={styles.emptyText}>
          No hay actividades para este día. Usa el botón «Agregar actividad».
        </Text>
      </View>
    )
  }

  // Solo "Sin hora" (sin agenda horaria que mostrar)
  const sinRejilla = programadas.length === 0

  return (
    <View style={styles.root}>
      {esHoy && atrasadas.length > 0 && (
        <AtrasadasSection
          atrasadas={atrasadas}
          tipos={tipos}
          subtareasCounts={subtareasCounts}
          onToggle={onToggle}
          onPostpone={onPostpone}
          onToggleEnProgreso={onToggleEnProgreso}
          onDelete={(id) => {
            const act = atrasadas.find((a) => a.id === id)
            if (act) onDelete(act)
          }}
          onPressSubtareas={onPressSubtareas}
          onReprogramarLoteAtrasadas={onReprogramarLoteAtrasadas}
        />
      )}

      {!sinRejilla && rango && (
        <TimeGrid
          startMin={rango.startMin}
          endMin={rango.endMin}
          bloques={bloques}
          actividades={programadas}
          tipos={tipos}
          esHoy={esHoy}
          ahoraMin={ahoraMin}
          accentColor={accentColor}
          subtareasCounts={subtareasCounts}
          onToggle={onToggle}
          onOpenActions={onOpenActions}
          onPressTime={onPressTime}
        />
      )}

      {!sinRejilla && !rango && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No se pudo calcular el rango de la agenda.</Text>
        </View>
      )}

      {sinHora.length > 0 && (
        <View style={styles.untimedCard}>
          <View style={styles.untimedHeader}>
            <MaterialIcons name="schedule" size={15} color={PALETTE.onSurfaceVariant} />
            <Text style={styles.untimedTitle}>Sin hora</Text>
            <View style={styles.untimedBadge}>
              <Text style={styles.untimedBadgeText}>{sinHora.length}</Text>
            </View>
          </View>
          <UntimedActivities
            actividades={sinHora}
            tipos={tipos}
            accentColor={accentColor}
            onToggle={onToggle}
            onOpenActions={onOpenActions}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  emptyCard: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    ...SHADOW.card,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
  },
  untimedCard: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    padding: 14,
    gap: 10,
    ...SHADOW.card,
  },
  untimedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  untimedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  untimedBadge: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  untimedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
  },
})
