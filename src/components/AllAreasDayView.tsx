import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad, TipoActividad } from '../repositories/actividadRepo'
import { TaskCard } from './TaskCard'
import {
  buildAllAreasDay,
  getModoVistaTodas,
  resolverPorArea,
  setModoVistaTodas,
  type ModoVistaTodas,
} from '../utils/triage'

interface AllAreasDayViewProps {
  actividades: Actividad[]
  atrasadas: Actividad[]
  tipos: TipoActividad[]
  esHoy: boolean
  ahoraRef: Date
  subtareasCounts?: Record<number, { total: number; completadas: number }>
  onToggle: (actividadId: number) => void
  onPostpone: (actividad: Actividad) => void
  onToggleEnProgreso: (actividadId: number) => void
  onDelete: (actividadId: number) => void
  onPressSubtareas?: (actividad: Actividad) => void
  onAddPress: () => void
  onReprogramarLoteAtrasadas: () => void
}

export function AllAreasDayView({
  actividades,
  atrasadas,
  tipos,
  esHoy,
  ahoraRef,
  subtareasCounts,
  onToggle,
  onPostpone,
  onToggleEnProgreso,
  onDelete,
  onPressSubtareas,
  onAddPress,
  onReprogramarLoteAtrasadas,
}: AllAreasDayViewProps) {
  // Modo de visualización: cronológico o por área (persistido en memoria a nivel módulo)
  const [modoVista, setModoVista] = useState<ModoVistaTodas>(() => getModoVistaTodas())

  // Estado de colapso de atrasadas (inicia colapsada si son más de 3)
  const [atrasadasExpandidas, setAtrasadasExpandidas] = useState(false)

  // Estado de colapso de cada área en modo "Por área" (id -> boolean colapsado)
  const [areasColapsadas, setAreasColapsadas] = useState<Record<number, boolean>>({})

  // Estructura pura de triage para el día
  const triage = useMemo(
    () => buildAllAreasDay(actividades, atrasadas, esHoy, ahoraRef),
    [actividades, atrasadas, esHoy, ahoraRef]
  )

  // Agrupación por área para el modo "Por área"
  const seccionesPorArea = useMemo(
    () => resolverPorArea(actividades, tipos),
    [actividades, tipos]
  )

  // Mapa rápido de tipos por ID para obtener color y nombre
  const mapaTipos = useMemo(() => {
    const mapa = new Map<number, TipoActividad>()
    for (const t of tipos) {
      if (t.id !== undefined) mapa.set(t.id, t)
    }
    return mapa
  }, [tipos])

  const cambiarModo = (nuevoModo: ModoVistaTodas) => {
    setModoVista(nuevoModo)
    setModoVistaTodas(nuevoModo)
  }

  const toggleColapsoArea = (tipoId: number) => {
    setAreasColapsadas((prev) => ({
      ...prev,
      [tipoId]: !prev[tipoId],
    }))
  }

  // Comprobar si todas las tareas del día están completadas
  const todasCompletadas =
    actividades.length > 0 &&
    actividades.every(
      (a) => a.completado === 1 || a.estado_ejecucion === 'completada'
    )

  return (
    <View style={styles.container}>
      {/* ── 1. BLOQUE 'AHORA' (solo si es Hoy y hay actividad activa/siguiente) ── */}
      {esHoy && triage.ahoraItem && (
        <View style={styles.nowCard}>
          {(() => {
            const item = triage.ahoraItem
            const act = item.actividad
            const tipo = mapaTipos.get(act.tipo_actividad_id)
            const areaColor = tipo?.color ?? PALETTE.primary
            const enCurso = item.estadoContextual === 'En curso'

            return (
              <>
                <View style={[styles.nowBarra, { backgroundColor: areaColor }]} />
                <View style={styles.nowContent}>
                  <View style={styles.nowHeaderRow}>
                    <View style={styles.nowBadgeRow}>
                      <View style={[styles.nowPulseDot, { backgroundColor: enCurso ? areaColor : PALETTE.onSurfaceVariant }]} />
                      <Text style={[styles.nowContextText, { color: enCurso ? areaColor : PALETTE.onSurfaceVariant }]}>
                        {item.estadoContextual}
                      </Text>
                      {tipo && (
                        <View style={[styles.nowAreaPill, { backgroundColor: tint(areaColor, 0.12) }]}>
                          <Text style={[styles.nowAreaText, { color: areaColor }]}>
                            {tipo.nombre}
                          </Text>
                        </View>
                      )}
                    </View>

                    {!!act.hora && (
                      <View style={styles.nowTimeBadge}>
                        <MaterialIcons name="schedule" size={12} color={PALETTE.onSurfaceVariant} />
                        <Text style={styles.nowTimeText}>{act.hora}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.nowTitle} numberOfLines={2}>
                    {act.titulo}
                  </Text>

                  {!!act.descripcion && (
                    <Text style={styles.nowDescription} numberOfLines={1}>
                      {act.descripcion}
                    </Text>
                  )}

                  {/* Acciones rápidas del bloque Ahora */}
                  <View style={styles.nowActionRow}>
                    <Pressable
                      onPress={() => act.id !== undefined && onToggle(act.id)}
                      style={({ pressed }) => [styles.nowBtnComplete, pressed && pressedFeedback]}
                    >
                      <MaterialIcons name="check" size={14} color={PALETTE.primary} />
                      <Text style={styles.nowBtnCompleteText}>Completar</Text>
                    </Pressable>

                    {act.id !== undefined && (
                      <Pressable
                        onPress={() => onToggleEnProgreso(act.id!)}
                        style={({ pressed }) => [styles.nowBtnAction, pressed && pressedFeedback]}
                      >
                        <MaterialIcons
                          name={act.estado_ejecucion === 'en_progreso' ? 'pause' : 'play-arrow'}
                          size={14}
                          color={areaColor}
                        />
                        <Text style={[styles.nowBtnActionText, { color: areaColor }]}>
                          {act.estado_ejecucion === 'en_progreso' ? 'Pausar' : 'Iniciar'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </>
            )
          })()}
        </View>
      )}

      {/* ── 2. SECCIÓN 'ATRASADAS' (solo si es Hoy y hay atrasadas) ── */}
      {esHoy && triage.atrasadasList.length > 0 && (
        <View style={styles.overdueSection}>
          <View style={styles.overdueHeader}>
            <View style={styles.overdueTitleGroup}>
              <MaterialIcons name="error-outline" size={18} color={PALETTE.categorias.critico} />
              <Text style={styles.overdueTitle}>Atrasadas</Text>
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueBadgeText}>
                  {triage.atrasadasList.length}
                </Text>
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

          {/* Listado de atrasadas: si son > 3 y no está expandido, se muestra colapsable */}
          {(() => {
            const total = triage.atrasadasList.length
            const mostrarTodas = total <= 3 || atrasadasExpandidas
            const lista = mostrarTodas
              ? triage.atrasadasList
              : triage.atrasadasList.slice(0, 3)

            return (
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
                    onPress={() => setAtrasadasExpandidas(!atrasadasExpandidas)}
                    style={({ pressed }) => [styles.overdueExpandBtn, pressed && pressedFeedback]}
                  >
                    <Text style={styles.overdueExpandText}>
                      {atrasadasExpandidas
                        ? 'Ocultar atrasadas ▴'
                        : `Ver ${total - 3} más ▾`}
                    </Text>
                  </Pressable>
                )}
              </View>
            )
          })()}
        </View>
      )}

      {/* ── 3. ESTADO VACÍO GENERAL O DE TODAS COMPLETADAS ── */}
      {actividades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="wb-sunny" size={32} color={PALETTE.primary} />
          </View>
          <Text style={styles.emptyTitle}>Día despejado</Text>
          <Text style={styles.emptySubtitle}>
            No tienes actividades programadas para este día en ninguna área.
          </Text>
          <Pressable
            onPress={onAddPress}
            style={({ pressed }) => [styles.emptyButton, pressed && pressedFeedback]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Planificar mi día"
          >
            <MaterialIcons name="add" size={17} color={PALETTE.onAccent} />
            <Text style={styles.emptyButtonText}>Planificar mi día</Text>
          </Pressable>
        </View>
      ) : todasCompletadas ? (
        <View style={styles.allDoneContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="check-circle" size={32} color={PALETTE.categorias.finanzas} />
          </View>
          <Text style={styles.allDoneTitle}>¡Todo completado por hoy!</Text>
          <Text style={styles.allDoneSubtitle}>
            Has completado todas las actividades del día en todas las áreas.
          </Text>
        </View>
      ) : null}

      {/* ── 4. CONTROL DE MODO: CRONOLÓGICO vs POR ÁREA (si hay actividades) ── */}
      {actividades.length > 0 && (
        <>
          <View style={styles.toggleRow}>
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => cambiarModo('cronologico')}
                style={[
                  styles.segmentBtn,
                  modoVista === 'cronologico' && styles.segmentBtnActive,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: modoVista === 'cronologico' }}
              >
                <MaterialIcons
                  name="schedule"
                  size={14}
                  color={modoVista === 'cronologico' ? PALETTE.ink : PALETTE.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.segmentText,
                    modoVista === 'cronologico' && styles.segmentTextActive,
                  ]}
                >
                  Cronológico
                </Text>
              </Pressable>

              <Pressable
                onPress={() => cambiarModo('por_area')}
                style={[
                  styles.segmentBtn,
                  modoVista === 'por_area' && styles.segmentBtnActive,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: modoVista === 'por_area' }}
              >
                <MaterialIcons
                  name="folder-open"
                  size={14}
                  color={modoVista === 'por_area' ? PALETTE.ink : PALETTE.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.segmentText,
                    modoVista === 'por_area' && styles.segmentTextActive,
                  ]}
                >
                  Por área
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── 5. MODO CRONOLÓGICO ── */}
          {modoVista === 'cronologico' ? (
            <View style={styles.agendaContainer}>
              {/* Programadas (con hora) */}
              {triage.programadas.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>PROGRAMADAS</Text>
                    <Text style={styles.sectionCountBadge}>
                      {triage.programadas.length}
                    </Text>
                  </View>

                  <View style={styles.list}>
                    {triage.programadas.map((act) => {
                      const tipo = mapaTipos.get(act.tipo_actividad_id)
                      const choqueMensaje = act.id ? triage.choques[act.id] : undefined

                      return (
                        <TaskCard
                          key={act.id ?? Math.random()}
                          actividad={act}
                          accentColor={tipo?.color ?? PALETTE.primary}
                          barraColor={tipo?.color}
                          showArea={tipo?.nombre}
                          avisoChoque={choqueMensaje}
                          subtareaProgreso={act.id ? subtareasCounts?.[act.id] : undefined}
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

              {/* Flexibles (sin hora) */}
              {triage.flexibles.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>SIN HORA</Text>
                    <Text style={styles.sectionCountBadge}>
                      {triage.flexibles.length}
                    </Text>
                  </View>

                  <View style={styles.list}>
                    {triage.flexibles.map((act) => {
                      const tipo = mapaTipos.get(act.tipo_actividad_id)
                      return (
                        <TaskCard
                          key={act.id ?? Math.random()}
                          actividad={act}
                          accentColor={tipo?.color ?? PALETTE.primary}
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
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* ── 6. MODO POR ÁREA (Acordeón por macro-área) ── */
            <View style={styles.agendaContainer}>
              {seccionesPorArea.map(({ tipo, programadas, flexibles, totalPendientes }) => {
                const tipoId = tipo.id ?? 0
                const colapsada = !!areasColapsadas[tipoId]
                const iconName = (tipo.emoji as keyof typeof MaterialIcons.glyphMap) || 'folder'
                const totalActividades = programadas.length + flexibles.length

                return (
                  <View key={tipoId} style={styles.areaAccordionCard}>
                    {/* Cabecera del acordeón */}
                    <Pressable
                      onPress={() => toggleColapsoArea(tipoId)}
                      style={({ pressed }) => [
                        styles.areaAccordionHeader,
                        pressed && pressedFeedback,
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Área ${tipo.nombre}, ${totalPendientes} pendientes de ${totalActividades} actividades`}
                    >
                      <View style={styles.areaAccordionLeft}>
                        <View style={[styles.areaIconBox, { backgroundColor: tint(tipo.color, 0.14) }]}>
                          <MaterialIcons name={iconName} size={16} color={tipo.color} />
                        </View>
                        <Text style={[styles.areaAccordionName, { color: tipo.color }]}>
                          {tipo.nombre}
                        </Text>
                        {totalPendientes > 0 ? (
                          <View style={[styles.areaPendingPill, { backgroundColor: tint(tipo.color, 0.14) }]}>
                            <Text style={[styles.areaPendingText, { color: tipo.color }]}>
                              {totalPendientes} {totalPendientes === 1 ? 'pendiente' : 'pendientes'}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.areaDonePill}>
                            <MaterialIcons name="check" size={11} color={PALETTE.categorias.finanzas} />
                            <Text style={styles.areaDoneText}>Al día</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.areaAccordionRight}>
                        <Text style={styles.areaTotalText}>{totalActividades}</Text>
                        <MaterialIcons
                          name={colapsada ? 'expand-more' : 'expand-less'}
                          size={20}
                          color={PALETTE.onSurfaceVariant}
                        />
                      </View>
                    </Pressable>

                    {/* Contenido expandible del área */}
                    {!colapsada && (
                      <View style={styles.areaAccordionContent}>
                        {programadas.length > 0 && (
                          <View style={styles.areaSubList}>
                            {programadas.map((act) => (
                              <TaskCard
                                key={act.id ?? Math.random()}
                                actividad={act}
                                accentColor={tipo.color}
                                barraColor={tipo.color}
                                subtareaProgreso={act.id ? subtareasCounts?.[act.id] : undefined}
                                onToggle={onToggle}
                                onPostpone={onPostpone}
                                onToggleEnProgreso={onToggleEnProgreso}
                                onDelete={onDelete}
                                onPressSubtareas={onPressSubtareas}
                              />
                            ))}
                          </View>
                        )}

                        {flexibles.length > 0 && (
                          <View style={styles.areaSubList}>
                            {flexibles.map((act) => (
                              <TaskCard
                                key={act.id ?? Math.random()}
                                actividad={act}
                                accentColor={tipo.color}
                                barraColor={tipo.color}
                                subtareaProgreso={act.id ? subtareasCounts?.[act.id] : undefined}
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
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // ── Bloque Ahora ──
  nowCard: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.card,
  },
  nowBarra: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: RADIUS.cards,
    borderBottomLeftRadius: RADIUS.cards,
  },
  nowContent: {
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 12,
  },
  nowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nowBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nowPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nowContextText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nowAreaPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nowAreaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  nowTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nowTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
  },
  nowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
    lineHeight: 20,
  },
  nowDescription: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  nowActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
  },
  nowBtnComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tint(PALETTE.primary, 0.12),
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.interior,
  },
  nowBtnCompleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  nowBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  nowBtnActionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Sección Atrasadas ──
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

  // ── Toggle Segmentado ──
  toggleRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 3,
    alignSelf: 'center',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    ...SHADOW.card,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  segmentTextActive: {
    color: PALETTE.ink,
    fontWeight: '700',
  },

  // ── Agenda Cronológica ──
  agendaContainer: {
    gap: 14,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  sectionCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.outline,
  },
  list: {
    gap: 8,
  },

  // ── Modo Por Área (Acordeón) ──
  areaAccordionCard: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    ...SHADOW.card,
    overflow: 'hidden',
  },
  areaAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  areaAccordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  areaIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaAccordionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  areaPendingPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  areaPendingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  areaDonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: tint(PALETTE.categorias.finanzas, 0.12),
  },
  areaDoneText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.categorias.finanzas,
  },
  areaAccordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  areaTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  areaAccordionContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
    paddingTop: 8,
  },
  areaSubList: {
    gap: 8,
  },

  // ── Estados Vacíos (respiran directamente sobre el fondo sin tarjeta) ──
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
    marginBottom: 22,
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.primary,
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
  allDoneContainer: {
    paddingHorizontal: 20,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allDoneTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  allDoneSubtitle: {
    fontSize: 13.5,
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 280,
    lineHeight: 19,
  },
})
