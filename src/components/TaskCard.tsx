import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad } from '../repositories/actividadRepo'
import { TintPill } from './TintPill'
import { toFechaISO } from '../utils/calendario'

interface TaskCardProps {
  actividad: Actividad
  accentColor: string
  origenLabel?: string
  subtareaProgreso?: { total: number; completadas: number } | null
  /** Barra lateral de color del área (modo "Todas las áreas") */
  barraColor?: string
  /** Etiqueta del nombre del área (modo "Todas las áreas") */
  showArea?: string
  /** Aviso de choque de horario: "Choca con 09:00" */
  avisoChoque?: string
  onToggle: (actividadId: number) => void
  onPostpone?: (actividad: Actividad) => void
  onToggleEnProgreso?: (actividadId: number) => void
  onDelete?: (actividadId: number) => void
  onPressSubtareas?: (actividad: Actividad) => void
  onLongPress?: () => void
}

export function TaskCard({
  actividad,
  accentColor,
  origenLabel,
  subtareaProgreso,
  barraColor,
  showArea,
  avisoChoque,
  onToggle,
  onPostpone,
  onToggleEnProgreso,
  onDelete,
  onPressSubtareas,
  onLongPress,
}: TaskCardProps) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const done = actividad.completado === 1
  const enProgreso = actividad.estado_ejecucion === 'en_progreso' && !done

  // Determinar si está vencida
  const hoyISO = toFechaISO(new Date())
  let estaVencida = false
  if (!done && actividad.fecha < hoyISO) {
    estaVencida = true
  } else if (!done && actividad.fecha === hoyISO && actividad.hora) {
    const ahora = new Date()
    const [h, m] = actividad.hora.split(':').map(Number)
    const horaActividadMin = h * 60 + m
    const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes()
    if (horaActualMin > horaActividadMin) {
      estaVencida = true
    }
  }

  const esPospuesta = !!actividad.instancia_origen_id && !done

  // ── Identidad visual ─────────────────────────────────────────────
  // Color del área (barra lateral en modo "Todas"; si no, el acento)
  const areaColor = barraColor || accentColor
  // Urgencia: wash y detalles se pintan con el color de criticidad
  const esCritica = !done && actividad.prioridad === 'critica'
  const esAlta = !done && actividad.prioridad === 'alta'
  const esUrgente = esCritica || esAlta
  const urgenteColor = esCritica
    ? PALETTE.categorias.critico
    : PALETTE.categorias.importante
  const washColor = esUrgente ? urgenteColor : areaColor
  const barColor = esUrgente ? urgenteColor : areaColor
  const barWidth = esCritica ? 8 : esUrgente ? 6 : 5

  // Gradiente diagonal fuerte del área (o gris si está completada)
  const barColours = [barColor, tint(barColor, 0)] as const
  const cardColours: readonly [string, string, ...string[]] = done
    ? [tint(PALETTE.ash, 0.12), PALETTE.surfaceContainer]
    : [
        tint(washColor, 0.32),
        tint(washColor, 0.14),
        PALETTE.surfaceContainerLowest,
      ]

  return (
    <View style={[styles.shadowWrap, done && styles.shadowWrapDone]}>
      <LinearGradient
        colors={cardColours}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.65 }}
        style={[styles.card, done && styles.cardDone]}
      >
        {!!barraColor && (
          <LinearGradient
            colors={barColours}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.barraColor, { width: barWidth }]}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        )}
        <Pressable
          onPress={() => setMenuAbierto(!menuAbierto)}
          onLongPress={onLongPress}
          delayLongPress={400}
          style={({ pressed }) => [styles.mainPressable, pressed && pressedFeedback]}
        >
          <View style={styles.row}>
            {/* Checkbox / Indicador de estado */}
            <View
              style={[
                styles.checkboxHalo,
                done && { backgroundColor: tint(accentColor, 0.2) },
              ]}
            >
              <Pressable
                onPress={() => actividad.id !== undefined && onToggle(actividad.id)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.checkbox,
                  enProgreso && [styles.checkboxEnProgreso, { borderColor: accentColor }],
                  done && [styles.checkboxDone, { backgroundColor: accentColor }],
                  pressed && pressedFeedback,
                ]}
              >
                {done ? (
                  <MaterialIcons name="check" size={14} color={PALETTE.onAccent} style={styles.checkIcon} />
                ) : enProgreso ? (
                  <View style={[styles.innerProgresoDot, { backgroundColor: accentColor }]} />
                ) : null}
              </Pressable>
            </View>

            {/* Contenido principal */}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    done && styles.titleDone,
                  ]}
                  numberOfLines={2}
                >
                  {actividad.titulo}
                </Text>

                {!!actividad.hora && (
                  <View style={[styles.timeBadge, { backgroundColor: tint(areaColor, 0.1) }]}>
                    <MaterialIcons name="schedule" size={12} color={areaColor} />
                    <Text style={styles.timeText}>{actividad.hora}</Text>
                  </View>
                )}
              </View>

              {!!actividad.descripcion && !done && (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {actividad.descripcion}
                </Text>
              )}

              {/* Fila de metadatos y estados */}
              <View style={styles.metaRow}>
                {/* Estado En Progreso */}
                {enProgreso && (
                  <TintPill color={accentColor} radius={6} style={styles.metaPill}>
                    <Text style={[styles.metaPillText, { color: accentColor }]}>En progreso</Text>
                  </TintPill>
                )}

                {/* Estado Vencida */}
                {estaVencida && (
                  <View style={[styles.metaPill, { backgroundColor: PALETTE.categorias.critico }]}>
                    <Text style={[styles.metaPillText, styles.metaPillTextOnFill]}>Atrasada</Text>
                  </View>
                )}

                {/* Estado Pospuesta */}
                {esPospuesta && (
                  <TintPill
                    color={PALETTE.categorias.importante}
                    radius={6}
                    alpha={0.16}
                    style={styles.metaPill}
                  >
                    <Text style={[styles.metaPillText, { color: PALETTE.categorias.importante }]}>
                      Reprogramada
                    </Text>
                  </TintPill>
                )}

                {/* Aviso de choque de horario */}
                {!!avisoChoque && !done && (
                  <View
                    style={styles.choqueBadge}
                    accessible={true}
                    accessibilityLabel={`Conflicto de horario: ${avisoChoque}`}
                  >
                    <MaterialIcons name="warning" size={12} color={PALETTE.categorias.importante} />
                    <Text style={styles.choqueText}>{avisoChoque}</Text>
                  </View>
                )}

                {/* Prioridad Alta o Crítica */}
                {!done && (esCritica || esAlta) && (
                  <View
                    style={[
                      styles.metaPill,
                      esCritica
                        ? { backgroundColor: PALETTE.categorias.critico }
                        : { backgroundColor: tint(PALETTE.categorias.importante, 0.16) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.metaPillText,
                        esCritica
                          ? styles.metaPillTextOnFill
                          : { color: PALETTE.categorias.importante },
                      ]}
                    >
                      {esCritica ? 'Crítica' : 'Alta'}
                    </Text>
                  </View>
                )}

                {/* Duración estimada */}
                {!done && actividad.duracion_estimada_min != null && (
                  <View style={styles.metaIconText}>
                    <MaterialIcons name="timelapse" size={13} color={PALETTE.onSurfaceVariant} />
                    <Text style={styles.metaText}>{actividad.duracion_estimada_min} min</Text>
                  </View>
                )}

                {/* Subtareas */}
                {subtareaProgreso && subtareaProgreso.total > 0 && (
                  <Pressable
                    onPress={() => onPressSubtareas && onPressSubtareas(actividad)}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.subtareasPill,
                      { backgroundColor: tint(areaColor, 0.1) },
                      pressed && pressedFeedback,
                    ]}
                  >
                    <MaterialIcons name="checklist" size={12} color={areaColor} />
                    <Text style={[styles.subtareasText, { color: areaColor }]}>
                      {subtareaProgreso.completadas}/{subtareaProgreso.total}
                    </Text>
                  </Pressable>
                )}

                {/* Tag de Área / Origen */}
                {!done && (showArea || origenLabel) && (
                  <View
                    style={[styles.areaTag, { backgroundColor: tint(areaColor, 0.12) }]}
                    accessible={true}
                    accessibilityLabel={`Área: ${showArea || origenLabel}`}
                  >
                    <View style={[styles.areaDot, { backgroundColor: areaColor }]} />
                    <Text style={[styles.areaText, { color: areaColor }]}>
                      {showArea || origenLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>

        {/* Menú de acciones rápidas expandible */}
        {menuAbierto && (
          <View style={styles.actionsMenu}>
            {onPostpone && !done && (
              <Pressable
                onPress={() => {
                  setMenuAbierto(false)
                  onPostpone(actividad)
                }}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <MaterialIcons name="schedule" size={16} color={PALETTE.categorias.importante} />
                <Text style={styles.actionButtonText}>Posponer</Text>
              </Pressable>
            )}

            {onToggleEnProgreso && actividad.id !== undefined && !done && (
              <Pressable
                onPress={() => {
                  setMenuAbierto(false)
                  onToggleEnProgreso(actividad.id!)
                }}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <MaterialIcons
                  name={enProgreso ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={16}
                  color={accentColor}
                />
                <Text style={styles.actionButtonText}>
                  {enProgreso ? 'Pausar' : 'En progreso'}
                </Text>
              </Pressable>
            )}

            {onDelete && actividad.id !== undefined && (
              <Pressable
                onPress={() => {
                  setMenuAbierto(false)
                  onDelete(actividad.id!)
                }}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <MaterialIcons name="delete-outline" size={16} color={PALETTE.categorias.critico} />
                <Text style={[styles.actionButtonText, { color: PALETTE.categorias.critico }]}>
                  Eliminar
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  // Capa exterior: conserva la sombra sin que el gradiente la recorte
  shadowWrap: {
    borderRadius: RADIUS.cards,
    backgroundColor: PALETTE.surfaceContainerLowest,
    ...SHADOW.card,
  },
  shadowWrapDone: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  card: {
    borderRadius: RADIUS.cards,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  cardDone: {
    opacity: 0.7,
  },
  mainPressable: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxHalo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -3,
    marginLeft: -3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PALETTE.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxDone: {
    borderWidth: 0,
  },
  checkIcon: {
    zIndex: 2,
  },
  checkboxEnProgreso: {
    borderWidth: 2,
  },
  innerProgresoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.ink,
    lineHeight: 20,
  },
  titleDone: {
    color: PALETTE.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 3,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  metaPill: {
    minHeight: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    justifyContent: 'center',
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaPillTextOnFill: {
    color: PALETTE.onAccent,
  },
  metaIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  subtareasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subtareasText: {
    fontSize: 11,
    fontWeight: '800',
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  areaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  areaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
  },
  barraColor: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: RADIUS.cards,
    borderBottomLeftRadius: RADIUS.cards,
  },
  choqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: tint(PALETTE.categorias.importante, 0.14),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  choqueText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.categorias.importante,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  actionButtonPressed: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.ink,
  },
})