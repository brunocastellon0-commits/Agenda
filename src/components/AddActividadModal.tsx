import React, { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme'
import {
  PRIORIDADES,
  Prioridad,
  TipoActividad,
  UnidadRepeticion,
} from '../repositories/actividadRepo'
import { padCero, toFechaISO } from '../utils/calendario'
import { getUltimaAreaUsadaId, setUltimaAreaUsadaId } from '../utils/triage'

export interface NuevaActividadData {
  titulo: string
  fecha: string
  tipo_actividad_id: number
  descripcion?: string
  hora?: string
  duracion_estimada_min?: number | null
  prioridad?: Prioridad
  /** Rango de días de la semana (1=Lun … 7=Dom). Si se define, la actividad es recurrente */
  dia_inicio?: number
  dia_fin?: number
  repeticion_numero?: number
  repeticion_unidad?: UnidadRepeticion
}

interface AddActividadModalProps {
  visible: boolean
  tipos: TipoActividad[]
  tipoPorDefectoId?: number
  fechaPorDefecto?: string
  accentColor: string
  onClose: () => void
  onSave: (data: NuevaActividadData) => void
}

const HORA_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/

const DIAS_SEMANA: { valor: number; label: string }[] = [
  { valor: 1, label: 'Lun' },
  { valor: 2, label: 'Mar' },
  { valor: 3, label: 'Mié' },
  { valor: 4, label: 'Jue' },
  { valor: 5, label: 'Vie' },
  { valor: 6, label: 'Sáb' },
  { valor: 7, label: 'Dom' },
]

const UNIDADES_REPETICION: { valor: UnidadRepeticion; label: string }[] = [
  { valor: 'dias', label: 'Días' },
  { valor: 'semanas', label: 'Semanas' },
  { valor: 'meses', label: 'Meses' },
  { valor: 'indefinido', label: 'Indefinido' },
]

export function AddActividadModal({
  visible,
  tipos,
  tipoPorDefectoId,
  fechaPorDefecto,
  accentColor,
  onClose,
  onSave,
}: AddActividadModalProps) {
  const insets = useSafeAreaInsets()
  const hoyISO = toFechaISO(new Date())

  // Estado del formulario
  const [titulo, setTitulo] = useState('')
  const [tipoIdSeleccionado, setTipoIdSeleccionado] = useState<number>(1)
  const [hora, setHora] = useState<string>('')
  const [mostrarPicker, setMostrarPicker] = useState(false)

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [duracionMin, setDuracionMin] = useState<number | null>(null)
  const [mostrarPickerDuracion, setMostrarPickerDuracion] = useState(false)
  const [prioridad, setPrioridad] = useState<Prioridad>('normal')
  // Recurrencia: rango de días de la semana + período (número + unidad)
  const [diaInicio, setDiaInicio] = useState<number | null>(null)
  const [diaFin, setDiaFin] = useState<number | null>(null)
  const [repeticionNumero, setRepeticionNumero] = useState(1)
  const [repeticionUnidad, setRepeticionUnidad] = useState<UnidadRepeticion>('indefinido')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setTitulo('')
      // Si hay un área filtrada, usarla; si no (modo Todas), usar la última usada o la primera disponible
      const ultimaArea = getUltimaAreaUsadaId()
      const areaInicial =
        tipoPorDefectoId ||
        (ultimaArea && tipos.some((t) => t.id === ultimaArea) ? ultimaArea : tipos[0]?.id || 1)
      setTipoIdSeleccionado(areaInicial)
      setHora('')
      setMostrarPicker(false)
      setShowAdvanced(false)
      setDescripcion('')
      setDuracionMin(null)
      setMostrarPickerDuracion(false)
      setPrioridad('normal')
      setDiaInicio(null)
      setDiaFin(null)
      setRepeticionNumero(1)
      setRepeticionUnidad('indefinido')
      setError(null)
    }
  }, [visible, fechaPorDefecto, tipoPorDefectoId, tipos])

  const tipoActual = tipos.find((t) => t.id === tipoIdSeleccionado) || tipos[0]
  const colorActual = tipoActual?.color || accentColor

  const aplicarHora = (date: Date) => {
    setHora(`${padCero(date.getHours())}:${padCero(date.getMinutes())}`)
  }

  const aplicarDuracion = (date: Date) => {
    const minutos = date.getHours() * 60 + date.getMinutes()
    setDuracionMin(minutos > 0 ? minutos : null)
  }

  const abrirPicker = () => {
    setMostrarPicker(true)
  }

  /** Primer toque = día inicio; segundo toque = día fin (rango con wraparound). */
  const seleccionarDiaRango = (valor: number) => {
    if (diaInicio === null || diaFin !== null) {
      // Sin inicio, o rango ya completo: un toque nuevo (re)inicia el rango
      setDiaInicio(valor)
      setDiaFin(null)
      return
    }
    // Segundo toque: fija el fin (si es el mismo día, queda como un solo día)
    setDiaFin(valor)
  }

  const limpiarRangoDias = () => {
    setDiaInicio(null)
    setDiaFin(null)
  }

  const diasSeleccionados = (() => {
    if (diaInicio === null) return []
    if (diaFin === null) return [diaInicio]
    const dias: number[] = []
    if (diaInicio <= diaFin) {
      for (let d = diaInicio; d <= diaFin; d++) dias.push(d)
    } else {
      for (let d = diaInicio; d <= 7; d++) dias.push(d)
      for (let d = 1; d <= diaFin; d++) dias.push(d)
    }
    return dias
  })()

  const etiquetaRangoDias = (() => {
    if (diaInicio === null) return 'No repetir'
    const labelDe = (v: number) => DIAS_SEMANA.find((d) => d.valor === v)?.label ?? ''
    if (diaFin === null || diaFin === diaInicio) return `Solo ${labelDe(diaInicio)}`
    return `De ${labelDe(diaInicio)} a ${labelDe(diaFin)}`
  })()

  const formatearDuracion = (min: number | null): string => {
    if (min == null) return 'Sin duración'
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${padCero(h)}:${padCero(m)}`
  }

  const handleGuardar = () => {
    const t = titulo.trim()
    const d = descripcion.trim()
    const h = hora.trim()

    if (t.length < 2 || t.length > 60) {
      setError('El título debe tener entre 2 y 60 caracteres.')
      return
    }
    if (d.length > 160) {
      setError('La descripción no puede superar los 160 caracteres.')
      return
    }
    if (h.length > 0 && !HORA_REGEX.test(h)) {
      setError('La hora debe tener formato HH:MM (ej. 14:30).')
      return
    }

    if (!tipoIdSeleccionado) {
      setError('Debes seleccionar un área para la actividad.')
      return
    }

    setError(null)
    setUltimaAreaUsadaId(tipoIdSeleccionado)
    onSave({
      titulo: t,
      fecha: fechaPorDefecto || hoyISO,
      tipo_actividad_id: tipoIdSeleccionado,
      descripcion: d.length > 0 ? d : undefined,
      hora: h.length > 0 ? h : undefined,
      duracion_estimada_min: duracionMin,
      prioridad,
      dia_inicio: diaInicio ?? undefined,
      dia_fin: diaFin ?? diaInicio ?? undefined,
      repeticion_numero: repeticionUnidad === 'indefinido' ? undefined : repeticionNumero,
      repeticion_unidad: diaInicio !== null ? repeticionUnidad : undefined,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header del modal */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.headerDot, { backgroundColor: colorActual }]} />
                <Text style={styles.headerTitle}>Nueva actividad</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={PALETTE.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Input principal ultra-rápido */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                value={titulo}
                onChangeText={(val) => {
                  setTitulo(val)
                  if (error) setError(null)
                }}
                placeholder="¿Qué necesitas hacer?"
                placeholderTextColor={PALETTE.outline}
                maxLength={60}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleGuardar}
              />
            </View>

            {/* Selector de Hora con picker nativo */}
            <View style={styles.quickChipsSection}>
              <Text style={styles.quickLabel}>Hora</Text>
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => {
                    setHora('')
                    setMostrarPicker(false)
                  }}
                  style={[
                    styles.chip,
                    !hora && [styles.chipActive, { backgroundColor: colorActual }],
                  ]}
                >
                  <Text style={[styles.chipText, !hora && styles.chipTextActive]}>Sin hora</Text>
                </Pressable>

                <Pressable
                  onPress={abrirPicker}
                  style={({ pressed }) => [
                    styles.chipRow,
                    styles.timeChip,
                    hora && [styles.chipActive, { backgroundColor: colorActual }],
                    pressed && pressedFeedback,
                  ]}
                >
                  <MaterialIcons
                    name="schedule"
                    size={14}
                    color={hora ? PALETTE.onAccent : PALETTE.ink}
                  />
                  <Text style={[styles.chipText, hora && styles.chipTextActive]}>
                    {hora || 'Elegir hora'}
                  </Text>
                </Pressable>
              </View>

              {mostrarPicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    value={
                      hora
                        ? (() => {
                            const [h, m] = hora.split(':').map(Number)
                            const d = new Date()
                            d.setHours(h, m, 0, 0)
                            return d
                          })()
                        : new Date()
                    }
                    is24Hour
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') {
                        setMostrarPicker(false)
                        if (event.type === 'set' && date) aplicarHora(date)
                      } else if (date) {
                        aplicarHora(date)
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={() => setMostrarPicker(false)}
                      style={({ pressed }) => [styles.pickerDoneBtn, pressed && pressedFeedback]}
                    >
                      <Text style={[styles.pickerDoneText, { color: colorActual }]}>Listo</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            {/* Selector de Área con Chips coloreados */}
            <View style={styles.quickChipsSection}>
              <Text style={styles.quickLabel}>Área</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollRow}
              >
                {tipos.map((tipo) => {
                  const isSelected = tipo.id === tipoIdSeleccionado
                  return (
                    <Pressable
                      key={tipo.id}
                      onPress={() => tipo.id && setTipoIdSeleccionado(tipo.id)}
                      style={[
                        styles.areaChip,
                        isSelected
                          ? { backgroundColor: tipo.color }
                          : { backgroundColor: PALETTE.surfaceContainer },
                        pressedFeedback,
                      ]}
                    >
                      <View
                        style={[
                          styles.chipDot,
                          { backgroundColor: isSelected ? PALETTE.onAccent : tipo.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.areaChipText,
                          { color: isSelected ? PALETTE.onAccent : PALETTE.ink },
                        ]}
                      >
                        {tipo.nombre}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>

            {/* Alternar Más opciones ▼ */}
            <Pressable
              onPress={() => setShowAdvanced(!showAdvanced)}
              style={({ pressed }) => [styles.advancedToggle, pressed && pressedFeedback]}
            >
              <Text style={[styles.advancedToggleText, { color: colorActual }]}>
                {showAdvanced ? 'Menos opciones ▲' : 'Más opciones ▼'}
              </Text>
            </Pressable>

            {/* Opciones avanzadas colapsables */}
            {showAdvanced && (
              <View style={styles.advancedSection}>
                {/* Descripción */}
                <View style={styles.field}>
                  <Text style={styles.label}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    placeholder="Detalles adicionales o notas..."
                    placeholderTextColor={PALETTE.outline}
                    maxLength={160}
                    multiline
                  />
                </View>

                {/* Duración estimada: selector tipo hora (HH:MM) */}
                <View style={styles.field}>
                  <Text style={styles.label}>Duración estimada</Text>
                  <View style={styles.chipsRow}>
                    <Pressable
                      onPress={() => setMostrarPickerDuracion(true)}
                      style={({ pressed }) => [
                        styles.chipRow,
                        styles.timeChip,
                        duracionMin != null && [
                          styles.chipActive,
                          { backgroundColor: colorActual },
                        ],
                        pressed && pressedFeedback,
                      ]}
                    >
                      <MaterialIcons
                        name="timelapse"
                        size={14}
                        color={duracionMin != null ? PALETTE.onAccent : PALETTE.ink}
                      />
                      <Text
                        style={[styles.chipText, duracionMin != null && styles.chipTextActive]}
                      >
                        {formatearDuracion(duracionMin)}
                      </Text>
                    </Pressable>

                    {duracionMin != null && (
                      <Pressable
                        onPress={() => {
                          setDuracionMin(null)
                          setMostrarPickerDuracion(false)
                        }}
                        style={({ pressed }) => [styles.chip, pressed && pressedFeedback]}
                      >
                        <Text style={styles.chipText}>Quitar</Text>
                      </Pressable>
                    )}
                  </View>

                  {mostrarPickerDuracion && (
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        value={
                          duracionMin != null
                            ? (() => {
                                const d = new Date()
                                d.setHours(
                                  Math.floor(duracionMin / 60),
                                  duracionMin % 60,
                                  0,
                                  0
                                )
                                return d
                              })()
                            : (() => {
                                const d = new Date()
                                d.setHours(0, 30, 0, 0)
                                return d
                              })()
                        }
                        is24Hour
                        onChange={(event, date) => {
                          if (Platform.OS === 'android') {
                            setMostrarPickerDuracion(false)
                            if (event.type === 'set' && date) aplicarDuracion(date)
                          } else if (date) {
                            aplicarDuracion(date)
                          }
                        }}
                      />
                      {Platform.OS === 'ios' && (
                        <Pressable
                          onPress={() => setMostrarPickerDuracion(false)}
                          style={({ pressed }) => [styles.pickerDoneBtn, pressed && pressedFeedback]}
                        >
                          <Text style={[styles.pickerDoneText, { color: colorActual }]}>Listo</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {/* Prioridad */}
                <View style={styles.field}>
                  <Text style={styles.label}>Prioridad</Text>
                  <View style={styles.chipsRow}>
                    {PRIORIDADES.map((p) => {
                      const isSel = prioridad === p.valor
                      return (
                        <Pressable
                          key={p.valor}
                          onPress={() => setPrioridad(p.valor)}
                          style={[
                            styles.chip,
                            isSel && { backgroundColor: p.color },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSel && { color: PALETTE.onAccent, fontWeight: '700' },
                            ]}
                          >
                            {p.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>

                {/* Recurrencia: rango de días de la semana + período (número + unidad) */}
                <View style={styles.field}>
                  <View style={styles.repeatHeaderRow}>
                    <Text style={styles.label}>Repetir de día a día</Text>
                    {diaInicio !== null && (
                      <Pressable onPress={limpiarRangoDias} hitSlop={6}>
                        <Text style={[styles.repeatClear, { color: colorActual }]}>No repetir</Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.diasRow}>
                    {DIAS_SEMANA.map((dia) => {
                      const seleccionado = diasSeleccionados.includes(dia.valor)
                      const esExtremo = dia.valor === diaInicio || dia.valor === diaFin
                      return (
                        <Pressable
                          key={dia.valor}
                          onPress={() => seleccionarDiaRango(dia.valor)}
                          style={({ pressed }) => [
                            styles.diaChip,
                            seleccionado && { backgroundColor: colorActual },
                            !seleccionado && styles.diaChipLibre,
                            esExtremo && styles.diaChipExtremo,
                            pressed && pressedFeedback,
                          ]}
                        >
                          <Text
                            style={[
                              styles.diaChipText,
                              seleccionado && styles.diaChipTextActive,
                            ]}
                          >
                            {dia.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>

                  <Text style={styles.repeatSummary}>{etiquetaRangoDias}</Text>

                  {diaInicio !== null && (
                    <>
                      {/* Selector de número */}
                      <View style={styles.periodoRow}>
                        <Text style={styles.periodoLabel}>Durante</Text>
                        <View
                          style={[
                            styles.stepper,
                            repeticionUnidad === 'indefinido' && styles.stepperDisabled,
                          ]}
                        >
                          <Pressable
                            onPress={() =>
                              repeticionUnidad !== 'indefinido' &&
                              setRepeticionNumero((n) => Math.max(1, n - 1))
                            }
                            style={({ pressed }) => [styles.stepperBtn, pressed && pressedFeedback]}
                            disabled={repeticionUnidad === 'indefinido'}
                          >
                            <MaterialIcons
                              name="remove"
                              size={16}
                              color={
                                repeticionUnidad === 'indefinido'
                                  ? PALETTE.outline
                                  : PALETTE.ink
                              }
                            />
                          </Pressable>
                          <Text
                            style={[
                              styles.stepperValue,
                              repeticionUnidad === 'indefinido' && styles.stepperValueDisabled,
                            ]}
                          >
                            {repeticionUnidad === 'indefinido' ? '—' : repeticionNumero}
                          </Text>
                          <Pressable
                            onPress={() =>
                              repeticionUnidad !== 'indefinido' &&
                              setRepeticionNumero((n) => Math.min(99, n + 1))
                            }
                            style={({ pressed }) => [styles.stepperBtn, pressed && pressedFeedback]}
                            disabled={repeticionUnidad === 'indefinido'}
                          >
                            <MaterialIcons
                              name="add"
                              size={16}
                              color={
                                repeticionUnidad === 'indefinido'
                                  ? PALETTE.outline
                                  : PALETTE.ink
                              }
                            />
                          </Pressable>
                        </View>
                      </View>

                      {/* Selector de unidad */}
                      <View style={styles.chipsRow}>
                        {UNIDADES_REPETICION.map((u) => {
                          const isSel = repeticionUnidad === u.valor
                          return (
                            <Pressable
                              key={u.valor}
                              onPress={() => setRepeticionUnidad(u.valor)}
                              style={[
                                styles.chip,
                                isSel && [styles.chipActive, { backgroundColor: colorActual }],
                              ]}
                            >
                              <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                                {u.label}
                              </Text>
                            </Pressable>
                          )
                        })}
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Botón principal de guardado */}
            <View style={styles.actions}>
              <Pressable
                onPress={handleGuardar}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colorActual },
                  pressed && pressedFeedback,
                ]}
              >
                <Text style={styles.saveButtonText}>Agregar actividad</Text>
              </Pressable>
            </View>
          </ScrollView>
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
    marginHorizontal: 10,
    marginBottom: 6,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingHorizontal: 18,
    paddingTop: 18,
    maxHeight: '90%',
    ...SHADOW.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  inputContainer: {
    marginBottom: 14,
  },
  mainInput: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.ink,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: PALETTE.hairline,
  },
  quickChipsSection: {
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipsScrollRow: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.interior,
    backgroundColor: PALETTE.surfaceContainer,
  },
  chipActive: {
    ...SHADOW.card,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  chipTextActive: {
    color: PALETTE.onAccent,
    fontWeight: '700',
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.interior,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  areaChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeChip: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  pickerContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  pickerDoneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.interior,
    backgroundColor: PALETTE.surfaceContainer,
    marginTop: 4,
  },
  pickerDoneText: {
    fontSize: 13,
    fontWeight: '700',
  },
  advancedToggle: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  advancedToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  advancedSection: {
    marginTop: 4,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
    paddingTop: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  repeatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatClear: {
    fontSize: 12,
    fontWeight: '700',
  },
  diasRow: {
    flexDirection: 'row',
    gap: 5,
  },
  diaChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.interior,
  },
  diaChipLibre: {
    backgroundColor: PALETTE.surfaceContainer,
  },
  diaChipExtremo: {
    ...SHADOW.card,
  },
  diaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  diaChipTextActive: {
    color: PALETTE.onAccent,
    fontWeight: '800',
  },
  repeatSummary: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  periodoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  periodoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    overflow: 'hidden',
  },
  stepperDisabled: {
    opacity: 0.55,
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stepperValue: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  stepperValueDisabled: {
    color: PALETTE.outline,
  },
  input: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: PALETTE.ink,
  },
  multiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: PALETTE.categorias.critico,
    marginTop: 6,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
})