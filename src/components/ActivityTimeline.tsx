import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'
import { TaskCard } from './TaskCard'

interface ActivityTimelineProps {
  actividades: Actividad[]
  tipos: TipoActividad[]
  accentColor: string
  areaFiltrada?: TipoActividad
  subtareasCounts?: Record<number, { total: number; completadas: number }>
  onToggle: (actividadId: number) => void
  onPostpone: (actividad: Actividad) => void
  onToggleEnProgreso: (actividadId: number) => void
  onDelete: (actividadId: number) => void
  onPressSubtareas?: (actividad: Actividad) => void
  onAddPress: () => void
}

export function ActivityTimeline({
  actividades,
  tipos,
  accentColor,
  areaFiltrada,
  subtareasCounts,
  onToggle,
  onPostpone,
  onToggleEnProgreso,
  onDelete,
  onPressSubtareas,
  onAddPress,
}: ActivityTimelineProps) {
  // Mapa de tipos para etiquetas de área
  const mapaTipos = React.useMemo(() => {
    const map: Record<number, TipoActividad> = {}
    for (const t of tipos) {
      if (t.id) map[t.id] = t
    }
    return map
  }, [tipos])

  // Vista general: agrupar el día por área cuando no hay filtro activo
  const seccionesPorArea = React.useMemo(() => {
    if (areaFiltrada) return null
    return tipos
      .filter((tipo) => tipo.id !== undefined)
      .map((tipo) => {
        const delArea = actividades.filter((a) => a.tipo_actividad_id === tipo.id)
        if (delArea.length === 0) return null
        const programadas = delArea
          .filter((a) => !!a.hora && a.hora.trim().length > 0)
          .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
        const flexibles = delArea.filter((a) => !a.hora || a.hora.trim().length === 0)
        const pendientes = delArea.filter((a) => a.completado === 0).length
        return { tipo, programadas, flexibles, pendientes }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }, [actividades, tipos, areaFiltrada])

  // Separar en Programadas (con hora) y Sin hora (flexibles)
  const programadas = React.useMemo(() => {
    return actividades
      .filter((a) => !!a.hora && a.hora.trim().length > 0)
      .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
  }, [actividades])

  const flexibles = React.useMemo(() => {
    return actividades.filter((a) => !a.hora || a.hora.trim().length === 0)
  }, [actividades])

  // Estado vacío contextual (respira directamente sobre el fondo sin tarjeta)
  if (actividades.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <MaterialIcons name="wb-sunny" size={32} color={accentColor} />
        </View>

        <Text style={styles.emptyTitle}>
          {areaFiltrada ? `Día despejado de ${areaFiltrada.nombre}` : 'Día despejado'}
        </Text>

        <Text style={styles.emptySubtitle}>
          {areaFiltrada
            ? 'No tienes tareas programadas para esta área hoy.'
            : 'No tienes actividades pendientes para este momento.'}
        </Text>

        <Pressable
          onPress={onAddPress}
          style={({ pressed }) => [
            styles.emptyButton,
            { backgroundColor: accentColor },
            pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={areaFiltrada ? 'Crear actividad' : 'Planificar mi día'}
        >
          <MaterialIcons name="add" size={17} color={PALETTE.onAccent} />
          <Text style={styles.emptyButtonText}>
            {areaFiltrada ? 'Crear actividad' : 'Planificar mi día'}
          </Text>
        </Pressable>
      </View>
    )
  }

  if (seccionesPorArea) {
    return (
      <View style={styles.container}>
        {seccionesPorArea.map(({ tipo, programadas: progArea, flexibles: flexArea, pendientes }) => {
          const color = tipo.color ?? accentColor
          const iconName = (tipo.emoji as keyof typeof MaterialIcons.glyphMap) || 'folder'

          return (
            <View key={tipo.id} style={styles.areaSection}>
              <View style={styles.areaHeader}>
                <View style={[styles.areaIconBox, { backgroundColor: tint(color) }]}>
                  <MaterialIcons name={iconName} size={16} color={color} />
                </View>
                <Text style={[styles.areaName, { color }]} numberOfLines={1}>
                  {tipo.nombre}
                </Text>
                {pendientes > 0 && (
                  <View style={[styles.areaPendingPill, { backgroundColor: tint(color) }]}>
                    <Text style={[styles.areaPendingText, { color }]}>
                      {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'}
                    </Text>
                  </View>
                )}
                <Text style={styles.areaCount}>{progArea.length + flexArea.length}</Text>
              </View>

              {progArea.length > 0 && (
                <View style={styles.list}>
                  {progArea.map((act) => (
                    <TaskCard
                      key={act.id ?? Math.random()}
                      actividad={act}
                      accentColor={color}
                      subtareaProgreso={act.id && subtareasCounts ? subtareasCounts[act.id] : null}
                      onToggle={onToggle}
                      onPostpone={onPostpone}
                      onToggleEnProgreso={onToggleEnProgreso}
                      onDelete={onDelete}
                      onPressSubtareas={onPressSubtareas}
                    />
                  ))}
                </View>
              )}

              {flexArea.length > 0 && (
                <View style={styles.list}>
                  {flexArea.map((act) => (
                    <TaskCard
                      key={act.id ?? Math.random()}
                      actividad={act}
                      accentColor={color}
                      subtareaProgreso={act.id && subtareasCounts ? subtareasCounts[act.id] : null}
                      onToggle={onToggle}
                      onPostpone={onPostpone}
                      onToggleEnProgreso={onToggleEnProgreso}
                      onDelete={onDelete}
                      onPressSubtareas={onPressSubtareas}
                    />
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Sección: PROGRAMADAS */}
      {programadas.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="schedule" size={16} color={accentColor} />
              <Text style={styles.sectionTitle}>PROGRAMADAS</Text>
            </View>
            <Text style={styles.sectionCount}>{programadas.length}</Text>
          </View>

          <View style={styles.list}>
            {programadas.map((act) => {
              const tipoAct = mapaTipos[act.tipo_actividad_id]
              const colorAct = tipoAct?.color ?? accentColor

              return (
                <TaskCard
                  key={act.id ?? Math.random()}
                  actividad={act}
                  accentColor={colorAct}
                  subtareaProgreso={act.id && subtareasCounts ? subtareasCounts[act.id] : null}
                  onToggle={onToggle}
                  onPostpone={onPostpone}
                  onToggleEnProgreso={onToggleEnProgreso}
                  onDelete={onDelete}
                  onPressSubtareas={onPressSubtareas}
                />
              )
            })}
          </View>
        </View>
      )}

      {/* Sección: SIN HORA */}
      {flexibles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="drag-indicator" size={16} color={PALETTE.onSurfaceVariant} />
              <Text style={styles.sectionTitle}>SIN HORA</Text>
            </View>
            <Text style={styles.sectionCount}>{flexibles.length}</Text>
          </View>

          <View style={styles.list}>
            {flexibles.map((act) => {
              const tipoAct = mapaTipos[act.tipo_actividad_id]
              const colorAct = tipoAct?.color ?? accentColor

              return (
                <TaskCard
                  key={act.id ?? Math.random()}
                  actividad={act}
                  accentColor={colorAct}
                  subtareaProgreso={act.id && subtareasCounts ? subtareasCounts[act.id] : null}
                  onToggle={onToggle}
                  onPostpone={onPostpone}
                  onToggleEnProgreso={onToggleEnProgreso}
                  onDelete={onDelete}
                  onPressSubtareas={onPressSubtareas}
                />
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  areaSection: {
    gap: 8,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  areaIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  areaPendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  areaPendingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  areaCount: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
  },
  list: {
    gap: 8,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 19,
    maxWidth: 260,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: RADIUS.buttons,
    ...SHADOW.card,
  },
  emptyButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
})
