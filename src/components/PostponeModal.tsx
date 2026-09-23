import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme'
import { Actividad } from '../repositories/actividadRepo'
import { calcularOpcionesPosponer, toFechaISO } from '../utils/calendario'

interface PostponeModalProps {
  visible: boolean
  actividad: Actividad | null
  onClose: () => void
  onPostpone: (actividadId: number, nuevaFecha: string, nuevaHora?: string | null) => void
}

export function PostponeModal({
  visible,
  actividad,
  onClose,
  onPostpone,
}: PostponeModalProps) {
  const insets = useSafeAreaInsets()
  const [mostrarDias, setMostrarDias] = useState(false)

  if (!actividad || !actividad.id) return null

  const { opcionTarde, opcionManana, opcionProximoLunes } = calcularOpcionesPosponer(
    actividad.fecha,
    actividad.hora
  )

  // Generar los próximos 7 días para "Elegir fecha"
  const proximosDias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 2) // A partir de pasado mañana
    const iso = toFechaISO(d)
    const diaNum = d.getDate()
    const diaNombre = d.toLocaleDateString('es-ES', { weekday: 'short' })
    return { iso, diaNum, diaNombre }
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={styles.iconTitle}>
              <MaterialIcons name="schedule" size={20} color={PALETTE.categorias.importante} />
              <Text style={styles.title}>Posponer actividad</Text>
            </View>
            <Text style={styles.actividadTitulo} numberOfLines={1}>
              "{actividad.titulo}"
            </Text>
          </View>

          <View style={styles.optionsList}>
            {opcionTarde && (
              <Pressable
                onPress={() => onPostpone(actividad.id!, opcionTarde.fecha, opcionTarde.hora)}
                style={({ pressed }) => [styles.optionRow, pressed && pressedFeedback]}
              >
                <View style={[styles.optionIcon, { backgroundColor: tint(PALETTE.categorias.importante) }]}>
                  <MaterialIcons name="wb-twilight" size={18} color={PALETTE.categorias.importante} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{opcionTarde.label}</Text>
                  <Text style={styles.optionSub}>Reprogramar para hoy más tarde</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={PALETTE.outline} />
              </Pressable>
            )}

            <Pressable
              onPress={() => onPostpone(actividad.id!, opcionManana.fecha, opcionManana.hora)}
              style={({ pressed }) => [styles.optionRow, pressed && pressedFeedback]}
            >
              <View style={[styles.optionIcon, { backgroundColor: tint(PALETTE.primary) }]}>
                <MaterialIcons name="wb-sunny" size={18} color={PALETTE.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{opcionManana.label}</Text>
                <Text style={styles.optionSub}>Mover a la jornada de mañana</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={PALETTE.outline} />
            </Pressable>

            <Pressable
              onPress={() => onPostpone(actividad.id!, opcionProximoLunes.fecha, opcionProximoLunes.hora)}
              style={({ pressed }) => [styles.optionRow, pressed && pressedFeedback]}
            >
              <View style={[styles.optionIcon, { backgroundColor: tint(PALETTE.categorias.trabajo) }]}>
                <MaterialIcons name="next-week" size={18} color={PALETTE.categorias.trabajo} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{opcionProximoLunes.label}</Text>
                <Text style={styles.optionSub}>Comenzar la próxima semana</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={PALETTE.outline} />
            </Pressable>

            <Pressable
              onPress={() => setMostrarDias(!mostrarDias)}
              style={({ pressed }) => [styles.optionRow, pressed && pressedFeedback]}
            >
              <View style={[styles.optionIcon, { backgroundColor: tint(PALETTE.categorias.eventos) }]}>
                <MaterialIcons name="event" size={18} color={PALETTE.categorias.eventos} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Elegir fecha</Text>
                <Text style={styles.optionSub}>Seleccionar otro día específico</Text>
              </View>
              <MaterialIcons
                name={mostrarDias ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color={PALETTE.outline}
              />
            </Pressable>

            {mostrarDias && (
              <View style={styles.daysStrip}>
                {proximosDias.map((d) => (
                  <Pressable
                    key={d.iso}
                    onPress={() => onPostpone(actividad.id!, d.iso, actividad.hora)}
                    style={({ pressed }) => [styles.dayPill, pressed && pressedFeedback]}
                  >
                    <Text style={styles.dayPillName}>{d.diaNombre}</Text>
                    <Text style={styles.dayPillNum}>{d.diaNum}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && pressedFeedback]}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,26,24,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 20,
    paddingTop: 18,
    ...SHADOW.modal,
  },
  header: {
    marginBottom: 14,
  },
  iconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  actividadTitulo: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    fontStyle: 'italic',
  },
  optionsList: {
    gap: 8,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.interior,
    backgroundColor: PALETTE.surfaceContainer,
    gap: 12,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  optionSub: {
    fontSize: 11,
    color: PALETTE.onSurfaceVariant,
    marginTop: 1,
  },
  daysStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: PALETTE.surfaceContainer,
  },
  dayPillName: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  dayPillNum: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.buttons,
    backgroundColor: PALETTE.surfaceContainer,
    marginTop: 6,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
})
