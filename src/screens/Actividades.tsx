import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, StatusBar, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/types'
import { navigateToTab } from '../navigation/tabs'
import { PALETTE } from '../theme/theme'
import {
  Actividad,
  TipoActividad,
  asegurarTiposIniciales,
  crearActividad,
  crearTipoActividad,
  getActividades,
  getTiposActividad,
  toggleActividad,
  contarSubtareas,
} from '../repositories/actividadRepo'
import { etiquetaFecha, fechaSemana, saludoPorHora, toISODate } from '../utils/semana'
import { GreetingHeader } from '../components/GreetingHeader'
import { ContextButton } from '../components/ContextButton'
import { ContextSelectorSheet } from '../components/ContextSelectorSheet'
import { NotebookCalendar } from '../components/NotebookCalendar'
import { TaskList } from '../components/TaskList'
import { AddActividadModal, NuevaActividadData } from '../components/AddActividadModal'
import { NuevoTipoActividadModal } from '../components/NuevoTipoActividadModal'
import { BottomNavigationBar } from '../components/ButtonNavigationBar'

type Props = StackScreenProps<RootStackParamList, 'Actividades'>

export default function ActividadesScreen({ navigation }: Props) {
  const [tipos, setTipos] = useState<TipoActividad[]>([])
  const [activeTipoId, setActiveTipoId] = useState<number | undefined>(undefined)
  const [selectedDayId, setSelectedDayId] = useState<string>(() => toISODate(new Date()))
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [subtareasCounts, setSubtareasCounts] = useState<Record<number, {total: number, completadas: number}>>({})
  const [loading, setLoading] = useState(true)
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const [isAddOpen, setAddOpen] = useState(false)
  const [isNuevoTipoOpen, setNuevoTipoOpen] = useState(false)

  const days = useMemo(() => fechaSemana(new Date(selectedDayId)), [selectedDayId])

  const cargarDatos = useCallback(async () => {
    try {
      await asegurarTiposIniciales()
      const tiposCargados = await getTiposActividad()
      setTipos(tiposCargados)
      setActiveTipoId((prev) => prev ?? tiposCargados[0]?.id)
      const actividadesDia = await getActividades(selectedDayId)
      setActividades(actividadesDia)
      
      const counts: Record<number, {total: number, completadas: number}> = {}
      for (const act of actividadesDia) {
        if (act.id) {
          counts[act.id] = await contarSubtareas(act.id)
        }
      }
      setSubtareasCounts(counts)
    } catch (error) {
      console.error('Error al cargar las actividades:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDayId])

  useFocusEffect(
    useCallback(() => {
      cargarDatos()
    }, [cargarDatos])
  )

  const selectedTipo = tipos.find((t) => t.id === activeTipoId) ?? tipos[0]
  const accentColor = selectedTipo?.color ?? PALETTE.primary

  const pendientesPorTipo = useMemo(() => {
    const map: Record<number, number> = {}
    for (const actividad of actividades) {
      if (actividad.completado === 0) {
        map[actividad.tipo_actividad_id] = (map[actividad.tipo_actividad_id] ?? 0) + 1
      }
    }
    return map
  }, [actividades])

  const actividadesTipo = actividades.filter((a) => a.tipo_actividad_id === selectedTipo?.id)
  const pendientesHoy = actividades.filter((a) => a.completado === 0).length
  const pendientesTipo = actividadesTipo.filter((a) => a.completado === 0).length

  const handleSelectTipo = (tipo: TipoActividad) => {
    setActiveTipoId(tipo.id)
    setSelectorOpen(false)
  }

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId)
  }

  const handlePrevWeek = () => {
    const d = new Date(selectedDayId)
    d.setDate(d.getDate() - 7)
    setSelectedDayId(toISODate(d))
  }

  const handleNextWeek = () => {
    const d = new Date(selectedDayId)
    d.setDate(d.getDate() + 7)
    setSelectedDayId(toISODate(d))
  }

  const handleToggle = (actividadId: number) => {
    setActividades((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, completado: a.completado === 1 ? 0 : 1 } : a))
    )
    toggleActividad(actividadId).catch((error) => {
      console.error('Error al actualizar la actividad:', error)
      cargarDatos()
    })
  }

  const handleAddActividad = async (data: NuevaActividadData) => {
    if (!selectedTipo?.id) return
    try {
      await crearActividad({
        fecha: selectedDayId,
        tipo_actividad_id: selectedTipo.id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        hora: data.hora,
        duracion_estimada_min: data.duracion_estimada_min,
        prioridad: data.prioridad as any,
        contexto: data.contexto,
      })
      setAddOpen(false)
      cargarDatos()
    } catch (error) {
      console.error('Error al guardar la actividad:', error)
    }
  }

  const handleCrearTipo = async (data: { nombre: string; color: string; emoji?: string }) => {
    try {
      const id = await crearTipoActividad(data)
      setNuevoTipoOpen(false)
      setActiveTipoId(id)
      cargarDatos()
    } catch (error) {
      console.error('Error al crear el tipo de actividad:', error)
    }
  }

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      </View>
    )
  }

  const [y, m] = selectedDayId.split('-')
  const dateObj = new Date(Number(y), Number(m) - 1, 1)
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <GreetingHeader
          dateLabel={etiquetaFecha(selectedDayId)}
          greeting={saludoPorHora()}
          pendingCount={pendientesHoy}
          accentColor={accentColor}
        />

        {selectedTipo && (
          <ContextButton
            tipo={selectedTipo}
            pendingCount={pendientesTipo}
            onPress={() => setSelectorOpen(true)}
          />
        )}

        <NotebookCalendar
          days={days}
          selectedDayId={selectedDayId}
          onSelectDay={handleSelectDay}
          accentColor={accentColor}
          monthLabel={monthName}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />

        <TaskList
          title="Actividades"
          actividades={actividadesTipo}
          pendingCount={pendientesTipo}
          accentColor={accentColor}
          subtareasCounts={subtareasCounts}
          onToggle={handleToggle}
          onAddPress={() => setAddOpen(true)}
        />
      </ScrollView>

      <BottomNavigationBar
        activeTab="actividades"
        onSelectTab={(tab) => navigateToTab(navigation, 'actividades', tab)}
      />

      <ContextSelectorSheet
        visible={isSelectorOpen}
        tipos={tipos}
        activeTipoId={activeTipoId}
        pendientesPorTipo={pendientesPorTipo}
        onSelect={handleSelectTipo}
        onCreateTipo={() => setNuevoTipoOpen(true)}
        onClose={() => setSelectorOpen(false)}
      />

      {selectedTipo && (
        <AddActividadModal
          visible={isAddOpen}
          tipoNombre={selectedTipo.nombre}
          accentColor={accentColor}
          onClose={() => setAddOpen(false)}
          onSave={handleAddActividad}
        />
      )}

      <NuevoTipoActividadModal
        visible={isNuevoTipoOpen}
        onClose={() => setNuevoTipoOpen(false)}
        onSave={handleCrearTipo}
      />
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
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
})