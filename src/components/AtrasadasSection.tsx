import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'
import { TaskCard } from './TaskCard'

interface AtrasadasSectionProps {
  atrasadas: Actividad[]
  tipos: TipoActividad[]
  subtareasCounts?: Record<number, { total: number; completadas: number }>
  onToggle: (actividadId: number) => void
  onPostpone: (actividad: Actividad) => void
  onToggleEnProgreso: (actividadId: number) => void
  onDelete: (actividadId: number) => void
  onPressSubtareas: (actividad: Actividad) => void
  onReprogramarLoteAtrasadas: () => void
}

/**
 * Sección "Atrasadas" (actividades de días anteriores aún pendientes).
 * Solo debe renderizarse cuando la screen verifica esHoy === true.
 * Markup extraído de AllAreasDayView (colapso >3 + "Mover a hoy").
 */
export function AtrasadasSection({
  atrasadas,
  tipos,
  subtareasCounts,
  onToggle,
  onPostpone,
  onToggleEnProgreso,
  onDelete,
  onPressSubtareas,
  onReprogramarLoteAtrasadas,
}: AtrasadasSectionProps) {
  const [expandidas, setExpandidas] = useState(false)

  const mapaTipos = React.useMemo(() => {
    const mapa = new Map<number, TipoActividad>()
    for (const t of tipos) {
      if (t.id !== undefined) mapa.set(t.id, t)
    }
    return mapa
  }, [tipos])

  if (atrasadas.length === 0) return null

  const total = atrasadas.length
  const mostrarTodas = total <= 3 || expandidas
  const lista = mostrarTodas ? atrasadas : atrasadas.slice(0, 3)

  return (
    <View style={styles.overdueSection}>
      <View style={styles.overdueHeader}>
        <View style={styles.overdueTitleGroup}>
          <MaterialIcons name="error-outline" size={18} color={PALETTE.categorias.critico} />
          <Text style={styles.overdueTitle}>Atrasadas</Text>
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>{total}</Text>
          </View>
        </View>

        <Pressable
          onPress={onReprogramarLoteAtrasadas}
          hitSlop={8}
          style={({ pressed }) => [styles.overdueActionBtn, pressed && pressedFeedback]}
          accessible={true}
          accessibilityLabel="Mover todas las actividades atrasadas a hoy"
        >
          <Text style={styles.overdueActionText}>Mover a hoy ›</Text>
        </Pressable>
      </View>

      <View style={styles.overdueList}>
        {lista.map((act) => {
          const tipo = mapaTipos.get(act.tipo_actividad_id)
          return (
            <TaskCard
              key={act.id ?? Math.random()}
              actividad={act}
              accentColor={tipo?.color ?? PALETTE.categorias.critico}
              barraColor={tipo?.color}
              showArea={tipo?.nombre}
              subtareaProgreso={act.id ? subtareasCounts?.[act.id] : undefined}
              onToggle={onToggle}
              onPostpone={onPostpone}
              onToggleEnProgreso={onToggleEnProgreso}
              onDelete={onDelete}
              onPressSubtareas={onPressSubtareas}
            />
          )
        })}

        {total > 3 && (
          <Pressable
            onPress={() => setExpandidas(!expandidas)}
            style={({ pressed }) => [styles.overdueExpandBtn, pressed && pressedFeedback]}
          >
            <Text style={styles.overdueExpandText}>
              {expandidas ? 'Ocultar atrasadas ▴' : `Ver ${total - 3} más ▾`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overdueSection: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    padding: 14,
    ...SHADOW.card,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  overdueTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overdueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.categorias.critico,
    letterSpacing: 0.3,
  },
  overdueBadge: {
    backgroundColor: tint(PALETTE.categorias.critico, 0.14),
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.categorias.critico,
  },
  overdueActionBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: tint(PALETTE.categorias.critico, 0.1),
  },
  overdueActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.categorias.critico,
  },
  overdueList: {
    gap: 8,
  },
  overdueExpandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
    marginTop: 4,
  },
  overdueExpandText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
  },
})
