import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { MaterialIcons } from '@expo/vector-icons'
import { RootStackParamList } from '../navigation/types'
import { navigateToTab } from '../navigation/tabs'
import { PALETTE, RADIUS, pressedFeedback, tint } from '../theme/theme'
import {
  Actividad,
  ActividadSubtarea,
  IndicadorDiaMes,
  TipoActividad,
  activarRegla,
  asegurarTiposIniciales,
  contarSubtareas,
  crearActividad,
  crearReglaRecurrencia,
  crearSubtarea,
  crearTipoActividad,
  desactivarRegla,
  deshacerReprogramarLote,
  eliminarActividad,
  eliminarInstancia,
  eliminarSerie,
  eliminarSubtarea,
  generarInstanciasRecurrentes,
  getActividades,
  getActividadesAtrasadas,
  getIndicadoresMes,
  getSubtareas,
  getTiposActividad,
  marcarEnProgreso,
  reprogramarActividad,
  reprogramarLote,
  restaurarInstancia,
  toggleActividad,
  toggleSubtarea,
  transicionarEstado,
} from '../repositories/actividadRepo'
import {
  formatoFechaHeader,
  generarMatrizMes,
  padCero,
  parseFechaISO,
  toFechaISO,
} from '../utils/calendario'
import { saludoPorHora } from '../utils/semana'
import { GreetingHeader } from '../components/GreetingHeader'
import { AreaSelector } from '../components/AreaSelector'
import { MonthlyCalendar } from '../components/MonthlyCalendar'
import { DaySchedule } from '../components/DaySchedule'
import { ActivityActionsSheet } from '../components/ActivityActionsSheet'
import { AreaVerticalTransition } from '../components/AreaVerticalTransition'
import { ContextSelectorSheet } from '../components/ContextSelectorSheet'
import { AddActividadModal, NuevaActividadData } from '../components/AddActividadModal'
import { DeleteActividadModal, ModoEliminacion } from '../components/DeleteActividadModal'
import { NuevoTipoActividadModal } from '../components/NuevoTipoActividadModal'
import { PostponeModal } from '../components/PostponeModal'
import { SubtaskListModal } from '../components/SubtaskListModal'
import { UndoToast } from '../components/UndoToast'
import { BottomNavigationBar } from '../components/ButtonNavigationBar'

type Props = StackScreenProps<RootStackParamList, 'Actividades'>

export default function ActividadesScreen({ navigation }: Props) {
  const hoy = useMemo(() => new Date(), [])
  const hoyISO = useMemo(() => toFechaISO(hoy), [hoy])

  // Estado del mes visualizado
  const [currentMonth, setCurrentMonth] = useState(() => ({
    year: hoy.getFullYear(),
    monthIndex: hoy.getMonth(),
  }))

  // Fecha seleccionada (por defecto hoy)
  const [selectedDayId, setSelectedDayId] = useState<string>(hoyISO)

  // Filtro de área (undefined = Todas las áreas)
  const [activeTipoId, setActiveTipoId] = useState<number | undefined>(undefined)

  // Datos
  const [tipos, setTipos] = useState<TipoActividad[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [atrasadas, setAtrasadas] = useState<Actividad[]>([])
  const [indicadoresMes, setIndicadoresMes] = useState<Record<string, IndicadorDiaMes>>({})
  const [subtareasCounts, setSubtareasCounts] = useState<
    Record<number, { total: number; completadas: number }>
  >({})
  const [loading, setLoading] = useState(true)

  // Tick de referencia temporal para bloque "Ahora" (se actualiza cada minuto)
  const [ahoraRef, setAhoraRef] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => {
      setAhoraRef(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Modales
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const [isAddOpen, setAddOpen] = useState(false)
  const [isNuevoTipoOpen, setNuevoTipoOpen] = useState(false)
  const [postponeActividad, setPostponeActividad] = useState<Actividad | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Actividad | null>(null)
  const [subtasksTarget, setSubtasksTarget] = useState<Actividad | null>(null)
  const [subtareasList, setSubtareasList] = useState<ActividadSubtarea[]>([])
  /** Bottom-sheet de acciones (abierta desde bloques/chips de DaySchedule) */
  const [actionsTarget, setActionsTarget] = useState<Actividad | null>(null)

  // Deshacer (Undo)
  const [undoState, setUndoState] = useState<{
    visible: boolean
    mensaje: string
    onUndo: () => Promise<void>
  } | null>(null)

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      await asegurarTiposIniciales()

      // Horizonte de generación recurrente: cubrir el día seleccionado y el mes visible
      const finMesVisible = new Date(currentMonth.year, currentMonth.monthIndex + 1, 0)
      const finPeriodo = new Date(
        Math.max(
          parseFechaISO(selectedDayId).getTime(),
          finMesVisible.getTime()
        )
      )
      const diasHastaFin = Math.ceil((finPeriodo.getTime() - hoy.getTime()) / 86400000)
      await generarInstanciasRecurrentes(Math.max(14, diasHastaFin + 7))

      const tiposCargados = await getTiposActividad()
      setTipos(tiposCargados)

      // Indicadores del mes visible
      const anoMes = `${currentMonth.year}-${padCero(currentMonth.monthIndex + 1)}`
      const indicadores = await getIndicadoresMes(anoMes, activeTipoId)
      setIndicadoresMes(indicadores)

      // Actividades del día seleccionado
      const actividadesDia = await getActividades(selectedDayId, activeTipoId)
      setActividades(actividadesDia)

      // Actividades atrasadas pendientes
      const atrasadasData = await getActividadesAtrasadas()
      setAtrasadas(atrasadasData)

      // Conteo de subtareas
      const counts: Record<number, { total: number; completadas: number }> = {}
      for (const act of actividadesDia) {
        if (act.id) {
          counts[act.id] = await contarSubtareas(act.id)
        }
      }
      setSubtareasCounts(counts)
    } catch (error) {
      console.error('Error al cargar datos de Actividades:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, selectedDayId, activeTipoId])

  useFocusEffect(
    useCallback(() => {
      cargarDatos()
    }, [cargarDatos])
  )

  // Color de acento según área activa o primario
  const tipoSeleccionado = tipos.find((t) => t.id === activeTipoId)
  const accentColor = tipoSeleccionado?.color ?? PALETTE.primary

  // Conteo de pendientes por tipo
  const pendientesPorTipo = useMemo(() => {
    const map: Record<number, number> = {}
    for (const a of actividades) {
      if (a.completado === 0) {
        map[a.tipo_actividad_id] = (map[a.tipo_actividad_id] ?? 0) + 1
      }
    }
    return map
  }, [actividades])

  // Contadores generales del día
  const pendientesCount = useMemo(
    () => actividades.filter((a) => a.completado === 0).length,
    [actividades]
  )
  const inProgressCount = useMemo(
    () => actividades.filter((a) => a.estado_ejecucion === 'en_progreso' && a.completado === 0).length,
    [actividades]
  )
  const completedCount = useMemo(
    () => actividades.filter((a) => a.completado === 1).length,
    [actividades]
  )

  // Conteo de áreas distintas con actividades pendientes (para GreetingHeader en modo Todas)
  const areasCount = useMemo(() => {
    const set = new Set<number>()
    for (const a of actividades) {
      if (a.completado === 0) {
        set.add(a.tipo_actividad_id)
      }
    }
    return set.size
  }, [actividades])

  // Matriz de días del mes
  const diasMes = useMemo(() => {
    return generarMatrizMes(
      currentMonth.year,
      currentMonth.monthIndex,
      selectedDayId,
      hoyISO
    )
  }, [currentMonth, selectedDayId, hoyISO])

  const esMesHoy =
    currentMonth.year === hoy.getFullYear() && currentMonth.monthIndex === hoy.getMonth()

  // Manejadores de navegación de mes
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.monthIndex === 0) {
        return { year: prev.year - 1, monthIndex: 11 }
      }
      return { year: prev.year, monthIndex: prev.monthIndex - 1 }
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.monthIndex === 11) {
        return { year: prev.year + 1, monthIndex: 0 }
      }
      return { year: prev.year, monthIndex: prev.monthIndex + 1 }
    })
  }

  const handleGoToToday = () => {
    setCurrentMonth({ year: hoy.getFullYear(), monthIndex: hoy.getMonth() })
    setSelectedDayId(hoyISO)
  }

  const handleSelectDay = (fechaISO: string) => {
    setSelectedDayId(fechaISO)
    // Sincronizar el mes visible si el usuario selecciona un día de relleno de otro mes
    const d = parseFechaISO(fechaISO)
    if (d.getFullYear() !== currentMonth.year || d.getMonth() !== currentMonth.monthIndex) {
      setCurrentMonth({ year: d.getFullYear(), monthIndex: d.getMonth() })
    }
  }

  // Interacción: Completar actividad con Deshacer
  const handleToggle = (actividadId: number) => {
    const act =
      actividades.find((a) => a.id === actividadId) ??
      atrasadas.find((a) => a.id === actividadId)
    if (!act) return

    const estadoAnterior = act.completado
    // Optimista (día seleccionado y/o atrasadas)
    setActividades((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, completado: a.completado === 1 ? 0 : 1 } : a))
    )
    setAtrasadas((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, completado: a.completado === 1 ? 0 : 1 } : a))
    )

    toggleActividad(actividadId)
      .then(() => {
        cargarDatos()
        // Mostrar Deshacer
        setUndoState({
          visible: true,
          mensaje: estadoAnterior === 0 ? 'Actividad completada' : 'Actividad reactivada',
          onUndo: async () => {
            await toggleActividad(actividadId)
            cargarDatos()
          },
        })
      })
      .catch((err) => {
        console.error('Error al cambiar completado:', err)
        cargarDatos()
      })
  }

  // Interacción: En Progreso
  const handleToggleEnProgreso = (actividadId: number) => {
    marcarEnProgreso(actividadId)
      .then(() => cargarDatos())
      .catch((err) => console.error('Error al cambiar en progreso:', err))
  }

  const handleConfirmDelete = async (modo: ModoEliminacion) => {
    const act = deleteTarget
    setDeleteTarget(null)
    if (!act || act.id === undefined) return

    try {
      if (modo === 'solo_dia') {
        const id = act.id
        // Soft-delete optimista (la fila queda con eliminada=1 → no se regenera)
        setActividades((prev) => prev.filter((a) => a.id !== id))
        await eliminarInstancia(id)
        await cargarDatos()
        setUndoState({
          visible: true,
          mensaje: 'Actividad eliminada',
          onUndo: async () => {
            await restaurarInstancia(id)
            await cargarDatos()
          },
        })
        return
      }

      if (modo === 'todas_repeticiones') {
        if (act.regla_recurrencia_id == null) {
          Alert.alert('No se pudo eliminar', 'Esta actividad no pertenece a una serie.')
          return
        }
        await eliminarSerie(act.regla_recurrencia_id)
        await cargarDatos()
        return
      }

      // modo === 'terminar_repeticion'
      if (act.regla_recurrencia_id == null) {
        Alert.alert('No se pudo eliminar', 'Esta actividad no pertenece a una serie.')
        return
      }
      const reglaId = act.regla_recurrencia_id
      await desactivarRegla(reglaId)
      await cargarDatos()
      setUndoState({
        visible: true,
        mensaje: 'Repetición terminada',
        onUndo: async () => {
          await activarRegla(reglaId)
          await cargarDatos()
        },
      })
    } catch (err) {
      console.error('Error al eliminar actividad:', err)
      cargarDatos()
    }
  }

  // Interacción: Posponer con Deshacer
  const handleConfirmPostpone = async (
    actividadId: number,
    nuevaFecha: string,
    nuevaHora?: string | null
  ) => {
    setPostponeActividad(null)
    try {
      const nuevoId = await reprogramarActividad(actividadId, nuevaFecha, 'Pospuesta por usuario')
      if (nuevoId && nuevaHora) {
        // Si se especificó una nueva hora, la actualizamos
        const act = actividades.find((a) => a.id === actividadId)
        if (act) {
          // La nueva actividad ya se creó vinculada en reprogramarActividad
        }
      }
      cargarDatos()

      setUndoState({
        visible: true,
        mensaje: 'Actividad pospuesta',
        onUndo: async () => {
          if (nuevoId) await eliminarActividad(nuevoId)
          await transicionarEstado(actividadId, 'planificada', 'pendiente', 'Deshacer posponer')
          cargarDatos()
        },
      })
    } catch (err) {
      console.error('Error al posponer actividad:', err)
      cargarDatos()
    }
  }

  // Interacción: Reprogramar lote de atrasadas con Deshacer
  const handleReprogramarLoteAtrasadas = async () => {
    if (atrasadas.length === 0) return
    const ids = atrasadas
      .map((a) => a.id)
      .filter((id): id is number => id !== undefined)
    if (ids.length === 0) return

    try {
      const undoInfo = await reprogramarLote(ids, hoyISO)
      await cargarDatos()

      setUndoState({
        visible: true,
        mensaje: `${ids.length} ${ids.length === 1 ? 'actividad movida' : 'actividades movidas'} a hoy`,
        onUndo: async () => {
          await deshacerReprogramarLote(undoInfo)
          await cargarDatos()
        },
      })
    } catch (err) {
      console.error('Error al reprogramar atrasadas en lote:', err)
      cargarDatos()
    }
  }

  // Interacción: Subtareas
  const handleOpenSubtasks = async (act: Actividad) => {
    if (!act.id) return
    setSubtasksTarget(act)
    const list = await getSubtareas(act.id)
    setSubtareasList(list)
  }

  // Separar actividades con hora (agenda horaria) y sin hora (chips)
  const { programadas, sinHora } = useMemo(() => {
    const conHora: Actividad[] = []
    const sinH: Actividad[] = []
    for (const a of actividades) {
      if (a.hora) conHora.push(a)
      else sinH.push(a)
    }
    conHora.sort((a, b) => (a.hora! < b.hora! ? -1 : a.hora! > b.hora! ? 1 : 0))
    return { programadas: conHora, sinHora: sinH }
  }, [actividades])

  const handleToggleSubtarea = async (id: number) => {
    await toggleSubtarea(id)
    if (subtasksTarget?.id) {
      const list = await getSubtareas(subtasksTarget.id)
      setSubtareasList(list)
    }
    await cargarDatos()
  }

  const handleAddSubtarea = async (titulo: string) => {
    if (!subtasksTarget?.id) return
    await crearSubtarea(subtasksTarget.id, titulo)
    const list = await getSubtareas(subtasksTarget.id)
    setSubtareasList(list)
    await cargarDatos()
  }

  const handleDeleteSubtarea = async (id: number) => {
    if (!subtasksTarget?.id) return
    await eliminarSubtarea(id)
    const list = await getSubtareas(subtasksTarget.id)
    setSubtareasList(list)
    await cargarDatos()
  }

  // Creación rápida de actividad (con recurrencia opcional por rango de días)
  const handleAddActividad = async (data: NuevaActividadData) => {
    try {
      const esRecurrente =
        data.dia_inicio != null && data.dia_fin != null

      let reglaId: number | undefined
      if (esRecurrente) {
        // Derivar lista de días del rango (compat con columna legacy dias_semana)
        const dias: number[] = []
        const a = data.dia_inicio!
        const b = data.dia_fin!
        if (a <= b) {
          for (let d = a; d <= b; d++) dias.push(d)
        } else {
          for (let d = a; d <= 7; d++) dias.push(d)
          for (let d = 1; d <= b; d++) dias.push(d)
        }

        reglaId = await crearReglaRecurrencia({
          titulo: data.titulo,
          tipo_actividad_id: data.tipo_actividad_id,
          patron: 'dias_semana',
          dias_semana: dias.join(','),
          dia_inicio: a,
          dia_fin: b,
          fecha_inicio: data.fecha,
          repeticion_numero: data.repeticion_numero ?? null,
          repeticion_unidad: data.repeticion_unidad ?? 'indefinido',
          hora: data.hora,
          duracion_estimada_min: data.duracion_estimada_min,
          prioridad: data.prioridad ?? 'normal',
        })
      }

      // Crear la instancia base vinculada a la regla (evita duplicado el mismo día)
      await crearActividad({
        fecha: data.fecha,
        tipo_actividad_id: data.tipo_actividad_id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        hora: data.hora,
        duracion_estimada_min: data.duracion_estimada_min,
        prioridad: data.prioridad,
        regla_recurrencia_id: reglaId ?? null,
      })

      if (reglaId) {
        const finMes = new Date(currentMonth.year, currentMonth.monthIndex + 1, 0)
        const diasHastaFin = Math.ceil((finMes.getTime() - hoy.getTime()) / 86400000)
        await generarInstanciasRecurrentes(Math.max(14, diasHastaFin + 7))
      }

      setAddOpen(false)
      cargarDatos()
    } catch (error) {
      console.error('Error al crear actividad:', error)
    }
  }

  // Creación de nuevo tipo / área
  const handleCrearTipo = async (data: { nombre: string; color: string; emoji?: string }) => {
    try {
      const id = await crearTipoActividad(data)
      setNuevoTipoOpen(false)
      setActiveTipoId(id)
      cargarDatos()
    } catch (error) {
      console.error('Error al crear tipo de actividad:', error)
    }
  }

  // Página completa del día (header + selector + calendario + vista de áreas), usada por la
  // pantalla estática y por el overlay de transición vertical entre áreas
  const renderPageArea = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera con fecha y saludo dinámico */}
      <GreetingHeader
        dateLabel={formatoFechaHeader(selectedDayId)}
        greeting={saludoPorHora()}
        pendingCount={pendientesCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        accentColor={accentColor}
        areasCount={areasCount}
        areaNombre={tipoSeleccionado?.nombre}
      />

      {/* Selector compacto de área (Todas por defecto) */}
      <AreaSelector
        tipoSeleccionado={tipoSeleccionado}
        pendingCount={pendientesCount}
        onPress={() => setSelectorOpen(true)}
      />

      {/* Calendario mensual tradicional en cuadrícula (L-D) */}
      <MonthlyCalendar
        year={currentMonth.year}
        monthIndex={currentMonth.monthIndex}
        dias={diasMes}
        indicadoresPorFecha={indicadoresMes}
        accentColor={accentColor}
        esMesHoy={esMesHoy}
        modoTodas={activeTipoId === undefined}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onSelectDay={handleSelectDay}
        onGoToToday={handleGoToToday}
      />

      {/* Agregar actividad: barra tonal entre calendario y agenda (reemplaza al FAB) */}
      <Pressable
        onPress={() => setAddOpen(true)}
        style={({ pressed }) => [
          styles.addBar,
          { backgroundColor: tint(accentColor, 0.12) },
          pressed && pressedFeedback,
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Agregar actividad"
      >
        <MaterialIcons name="add" size={18} color={accentColor} />
        <Text style={[styles.addBarText, { color: accentColor }]}>Agregar actividad</Text>
      </Pressable>

      {/* Agenda horaria del día (matriz temporal 30min) */}
      <DaySchedule
        programadas={programadas}
        sinHora={sinHora}
        atrasadas={atrasadas}
        tipos={tipos}
        esHoy={selectedDayId === hoyISO}
        fechaISO={selectedDayId}
        ahoraRef={ahoraRef}
        cargando={loading}
        accentColor={accentColor}
        subtareasCounts={subtareasCounts}
        onToggle={handleToggle}
        onToggleEnProgreso={handleToggleEnProgreso}
        onPostpone={(act) => setPostponeActividad(act)}
        onDelete={(act) => setDeleteTarget(act)}
        onPressSubtareas={handleOpenSubtasks}
        onOpenActions={(act) => setActionsTarget(act)}
        onReprogramarLoteAtrasadas={handleReprogramarLoteAtrasadas}
      />
    </ScrollView>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      {/* Página del día con transición vertical entre áreas (pantalla completa, estilo Linux) */}
      <AreaVerticalTransition
        areaKey={activeTipoId ?? 'todas'}
        areaIndex={activeTipoId === undefined ? -1 : (tipoSeleccionado?.orden ?? 0)}
      >
        {renderPageArea()}
      </AreaVerticalTransition>

      {/* Barra de navegación inferior persistente (tab Actividades activa) */}
      <BottomNavigationBar
        activeTab="actividades"
        onSelectTab={(tab) => navigateToTab(navigation, 'actividades', tab)}
      />

      {/* Modal de selección de área */}
      <ContextSelectorSheet
        visible={isSelectorOpen}
        tipos={tipos}
        activeTipoId={activeTipoId}
        pendientesPorTipo={pendientesPorTipo}
        totalPendientes={pendientesCount}
        onSelect={(tipo) => {
          setActiveTipoId(tipo?.id)
          setSelectorOpen(false)
        }}
        onCreateTipo={() => setNuevoTipoOpen(true)}
        onClose={() => setSelectorOpen(false)}
      />

      {/* Modal de creación ultra rápida */}
      <AddActividadModal
        visible={isAddOpen}
        tipos={tipos}
        tipoPorDefectoId={activeTipoId}
        fechaPorDefecto={selectedDayId}
        accentColor={accentColor}
        onClose={() => setAddOpen(false)}
        onSave={handleAddActividad}
      />

      {/* Bottom-sheet de acciones de una actividad (cierre → delay → otro modal) */}
      <ActivityActionsSheet
        visible={!!actionsTarget}
        actividad={actionsTarget}
        tipo={
          actionsTarget
            ? tipos.find((t) => t.id === actionsTarget.tipo_actividad_id)
            : undefined
        }
        subtareaProgreso={
          actionsTarget?.id !== undefined ? subtareasCounts[actionsTarget.id] : null
        }
        onClose={() => setActionsTarget(null)}
        onToggle={handleToggle}
        onToggleEnProgreso={handleToggleEnProgreso}
        onPostpone={(act) => setPostponeActividad(act)}
        onSubtareas={handleOpenSubtasks}
        onDelete={(act) => setDeleteTarget(act)}
      />

      {/* Modal de posponer contextual */}
      <PostponeModal
        visible={!!postponeActividad}
        actividad={postponeActividad}
        onClose={() => setPostponeActividad(null)}
        onPostpone={handleConfirmPostpone}
      />

      {/* Modal de eliminación (día / todas las repeticiones / terminar repetición) */}
      <DeleteActividadModal
        visible={!!deleteTarget}
        actividad={deleteTarget}
        accentColor={accentColor}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal de subtareas */}
      {subtasksTarget && (
        <SubtaskListModal
          visible={!!subtasksTarget}
          actividadTitulo={subtasksTarget.titulo}
          accentColor={accentColor}
          subtareas={subtareasList}
          onToggle={handleToggleSubtarea}
          onAdd={handleAddSubtarea}
          onDelete={handleDeleteSubtarea}
          onClose={() => setSubtasksTarget(null)}
        />
      )}

      {/* Modal de creación de nuevo tipo / área */}
      <NuevoTipoActividadModal
        visible={isNuevoTipoOpen}
        onClose={() => setNuevoTipoOpen(false)}
        onSave={handleCrearTipo}
      />

      {/* Toast temporal de Deshacer (Undo) */}
      {undoState && (
        <UndoToast
          visible={undoState.visible}
          mensaje={undoState.mensaje}
          onUndo={undoState.onUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 14,
  },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.buttons,
  },
  addBarText: {
    fontSize: 14,
    fontWeight: '700',
  },
})