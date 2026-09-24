import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { navigateToTab } from '../navigation/tabs';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from '../components/TintPill';
import { Billetera, getBilleteras, createBilletera } from '../repositories/billetera';
import { Movimiento, getMovimientosByBilletera, registrarMovimiento, transferir, signoMovimiento, eliminarMovimiento } from '../repositories/movimientos';
import { Pago, getPagosByBilletera, createPago, deletePago, pagarPago } from '../repositories/pagos';
import { getUsuarios } from '../repositories/usuario';
import { WalletCarousel } from '../components/WalletCarrousel';
import { CuentaCardData } from '../components/CuentaCard';
import { AccountSummary } from '../components/AccountSummary';
import { MovementsTimeline } from '../components/MovementsTimeline';
import { PagosCard } from '../components/PagosCard';
import { AddBilleteraModal } from '../components/AddBilleteraModal';
import { AddMovimientoModal } from '../components/AddMovimientoModal';
import { TransferModal } from '../components/TransferModal';
import { AddPagoModal } from '../components/AddPagoModal';
import { PayPagoModal } from '../components/PayPagoModal';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';

type Props = StackScreenProps<RootStackParamList, 'Billetera'>;

const cacheMovimientos = new Map<number, Movimiento[]>();
const cachePagos = new Map<number, Pago[]>();
const enVuelo = new Set<number>();

const CARD_GRADIENTS: { colorInicio: string; colorFin: string }[] = [
  { colorInicio: '#16876A', colorFin: '#0D5C49' },   // Finanzas: emerald
  { colorInicio: '#176B87', colorFin: '#0E4759' },   // Trabajo: petróleo
  { colorInicio: '#4F46A5', colorFin: '#352E74' },   // Objetivos: índigo
  { colorInicio: '#E76F51', colorFin: '#C24E33' },   // Ocio: coral
  { colorInicio: '#64748B', colorFin: '#46536B' },   // Eventos: gris azulado
];

function mesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface PropsResumen {
  cuenta: Billetera;
  movimientos: Movimiento[];
}

function calcularResumenMes({ cuenta, movimientos }: PropsResumen) {
  const claveMes = mesActual();
  let ingresos = 0;
  let egresos = 0;
  for (const m of movimientos) {
    if (!m.fecha_hora.startsWith(claveMes)) continue;
    const signo = signoMovimiento(m, cuenta.id!);
    if (signo > 0) ingresos += m.monto;
    else egresos += m.monto;
  }
  return { ingresos, egresos };
}

export default function BilleteraScreen({ navigation }: Props) {
  const [billeteras, setBilleteras] = useState<Billetera[]>([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState<number | null>(null);
  const [ciUsuario, setCiUsuario] = useState<string | undefined>(undefined);
  const [loadingInicial, setLoadingInicial] = useState<boolean>(true);

  const [movimientosPorId, setMovimientosPorId] = useState<Record<number, Movimiento[]>>(
    () => Object.fromEntries(cacheMovimientos)
  );
  const [pagosPorId, setPagosPorId] = useState<Record<number, Pago[]>>(
    () => Object.fromEntries(cachePagos)
  );
  const [cargandoDetalleId, setCargandoDetalleId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMovimientoTipo, setModalMovimientoTipo] = useState<'ingreso' | 'egreso' | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddPagoOpen, setIsAddPagoOpen] = useState(false);
  const [pagoPagar, setPagoPagar] = useState<Pago | null>(null);

  const cargarBilleteras = useCallback(async (): Promise<Billetera[]> => {
    const [usuarios, data] = await Promise.all([getUsuarios(), getBilleteras()]);
    setCiUsuario(usuarios[0]?.ci);
    setBilleteras(data);
    setSelectedCuentaId((prev) => {
      if (prev !== null && data.some((b) => b.id === prev)) return prev;
      return data[0]?.id ?? null;
    });
    return data;
  }, []);

  const cargarDetalle = useCallback(async (cuentaId: number): Promise<void> => {
    if (cacheMovimientos.has(cuentaId) && cachePagos.has(cuentaId)) return;
    if (enVuelo.has(cuentaId)) return;
    enVuelo.add(cuentaId);
    try {
      const [movimientos, pagos] = await Promise.all([
        getMovimientosByBilletera(cuentaId),
        getPagosByBilletera(cuentaId),
      ]);
      cacheMovimientos.set(cuentaId, movimientos);
      cachePagos.set(cuentaId, pagos);
      setMovimientosPorId((prev) => ({ ...prev, [cuentaId]: movimientos }));
      setPagosPorId((prev) => ({ ...prev, [cuentaId]: pagos }));
    } finally {
      enVuelo.delete(cuentaId);
    }
  }, []);

  const refrescarDetalle = useCallback(
    async (cuentaId: number): Promise<void> => {
      cacheMovimientos.delete(cuentaId);
      cachePagos.delete(cuentaId);
      await cargarDetalle(cuentaId);
    },
    [cargarDetalle]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await cargarBilleteras();
        if (!mounted) return;
        setLoadingInicial(false);
        Promise.all(
          data
            .map((b) => b.id)
            .filter((id): id is number => id !== undefined)
            .map((id) => cargarDetalle(id))
        ).catch((error) => {
          console.error('Error al precargar movimientos y pagos:', error);
        });
      } catch (error) {
        console.error('Error al cargar la billetera:', error);
        if (mounted) setLoadingInicial(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cargarBilleteras, cargarDetalle]);

  const cuentaActiva = useMemo(
    () => billeteras.find((b) => b.id === selectedCuentaId) ?? billeteras[0] ?? null,
    [billeteras, selectedCuentaId]
  );

  useEffect(() => {
    const id = cuentaActiva?.id;
    if (id === undefined) return;
    if (cacheMovimientos.has(id) && cachePagos.has(id)) {
      setMovimientosPorId((prev) =>
        prev[id] !== undefined ? prev : { ...prev, [id]: cacheMovimientos.get(id)! }
      );
      setPagosPorId((prev) =>
        prev[id] !== undefined ? prev : { ...prev, [id]: cachePagos.get(id)! }
      );
      setCargandoDetalleId((actual) => (actual === id ? null : actual));
      return;
    }
    let mounted = true;
    setCargandoDetalleId(id);
    cargarDetalle(id)
      .catch((error) => {
        console.error('Error al cargar el detalle de la cuenta:', error);
      })
      .finally(() => {
        if (mounted) setCargandoDetalleId((actual) => (actual === id ? null : actual));
      });
    return () => {
      mounted = false;
    };
  }, [cuentaActiva?.id, cargarDetalle]);

  const cuentas: CuentaCardData[] = useMemo(
    () =>
      billeteras.map((b, i) => {
        const gradiente = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
        return {
          id: String(b.id),
          nombre: b.nombre,
          entidad: b.entidad,
          divisa: b.divisa,
          monto: b.monto,
          colorInicio: gradiente.colorInicio,
          colorFin: gradiente.colorFin,
        };
      }),
    [billeteras]
  );

  const selectedIndex = Math.max(
    0,
    billeteras.findIndex((b) => b.id === cuentaActiva?.id)
  );

  const movimientosCuenta = useMemo(
    () => (cuentaActiva?.id !== undefined ? (movimientosPorId[cuentaActiva.id] ?? []) : []),
    [cuentaActiva?.id, movimientosPorId]
  );

  const pagosCuenta = useMemo(
    () => (cuentaActiva?.id !== undefined ? (pagosPorId[cuentaActiva.id] ?? []) : []),
    [cuentaActiva?.id, pagosPorId]
  );

  const nombresBilletera = useMemo(() => {
    const mapa: Record<number, string> = {};
    for (const b of billeteras) {
      if (b.id !== undefined) mapa[b.id] = b.nombre;
    }
    return mapa;
  }, [billeteras]);

  const resumenMes = useMemo(
    () => (cuentaActiva ? calcularResumenMes({ cuenta: cuentaActiva, movimientos: movimientosCuenta }) : { ingresos: 0, egresos: 0 }),
    [cuentaActiva, movimientosCuenta]
  );

  const destinos = useMemo(
    () => billeteras.filter((b) => b.id !== cuentaActiva?.id),
    [billeteras, cuentaActiva?.id]
  );

  const handleOnSelectCuenta = useCallback(
    (index: number) => {
      const b = billeteras[index];
      if (b?.id !== undefined) setSelectedCuentaId(b.id);
    },
    [billeteras]
  );

  const handleAgregarCuenta = async (billetera: Billetera) => {
    try {
      const nuevoId = await createBilletera(billetera);
      setIsModalOpen(false);
      await cargarBilleteras();
      setSelectedCuentaId(nuevoId);
      await refrescarDetalle(nuevoId);
    } catch (error) {
      console.error('Error al guardar la billetera:', error);
      Alert.alert('Error', 'No se pudo guardar la billetera. Intentalo de nuevo.');
    }
  };

  const handleRegistrarMovimiento = async (m: { titulo: string; descripcion?: string; monto: number }) => {
    if (!cuentaActiva?.id) return;
    try {
      await registrarMovimiento({
        billetera_id: cuentaActiva.id,
        tipo: modalMovimientoTipo!,
        titulo: m.titulo,
        descripcion: m.descripcion,
        monto: m.monto,
      });
      setModalMovimientoTipo(null);
      await cargarBilleteras();
      await refrescarDetalle(cuentaActiva.id);
    } catch (error) {
      console.error('Error al registrar el movimiento:', error);
      Alert.alert('Error', 'No se pudo registrar el movimiento. Intentalo de nuevo.');
    }
  };

  const handleTransferir = async (t: { billetera_destino_id: number; titulo: string; monto: number }) => {
    const cuentaId = cuentaActiva?.id;
    if (cuentaId === undefined) return;
    try {
      await transferir({
        billetera_origen_id: cuentaId,
        billetera_destino_id: t.billetera_destino_id,
        titulo: t.titulo,
        monto: t.monto,
      });
      setIsTransferOpen(false);
      await cargarBilleteras();
      await Promise.allSettled([cuentaId, t.billetera_destino_id].map((id) => refrescarDetalle(id)));
    } catch (error) {
      console.error('Error al transferir:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo transferir. Intentalo de nuevo.'
      );
    }
  };

  const handleAgregarPago = async (p: { nombre: string; monto: number; tipo: 'individual' | 'mensual' }) => {
    if (!cuentaActiva?.id) return;
    try {
      await createPago({ billetera_id: cuentaActiva.id, ...p });
      setIsAddPagoOpen(false);
      await refrescarDetalle(cuentaActiva.id);
    } catch (error) {
      console.error('Error al crear el pago:', error);
      Alert.alert('Error', 'No se pudo crear el pago. Intentalo de nuevo.');
    }
  };

  const handleEliminarPago = async (pago: Pago) => {
    const cuentaId = cuentaActiva?.id;
    if (cuentaId === undefined || pago.id === undefined) return;
    Alert.alert('Eliminar pago', `Se eliminará "${pago.nombre}". ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePago(pago.id!);
            await refrescarDetalle(cuentaId);
          } catch (error) {
            console.error('Error al eliminar el pago:', error);
          }
        },
      },
    ]);
  };

  const handlePagarPago = async (monto: number) => {
    if (!pagoPagar || pagoPagar.id === undefined || !cuentaActiva?.id) return;
    try {
      await pagarPago(pagoPagar.id, monto);
      setPagoPagar(null);
      await cargarBilleteras();
      await refrescarDetalle(cuentaActiva.id);
    } catch (error) {
      console.error('Error al pagar:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo completar el pago.'
      );
    }
  };

  const handleEliminarMovimiento = async (id: number) => {
    if (!cuentaActiva?.id) return;
    Alert.alert('Eliminar movimiento', '¿Seguro que quieres eliminar este movimiento? El saldo se revertirá.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarMovimiento(id);
            await cargarBilleteras();
            await refrescarDetalle(cuentaActiva.id!);
          } catch (error) {
            console.error('Error al eliminar el movimiento:', error);
            Alert.alert('Error', 'No se pudo eliminar el movimiento.');
          }
        },
      },
    ]);
  };

  if (loadingInicial) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.ink} />
        </View>
      </SafeAreaView>
    );
  }

  const cargandoDetalle = cargandoDetalleId === cuentaActiva?.id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mis cuentas</Text>
          <TintPill color={PALETTE.categorias.finanzas} radius={16}>
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && pressedFeedback]}
              onPress={() => setIsModalOpen(true)}
            >
              <MaterialIcons name="add" size={18} color={PALETTE.onAccent} />
              <Text style={styles.addButtonText}>Agregar cuenta</Text>
            </Pressable>
          </TintPill>
        </View>

        {cuentas.length > 0 ? (
          <>
            <WalletCarousel
              cuentas={cuentas}
              selectedIndex={selectedIndex}
              onSelectCuenta={handleOnSelectCuenta}
            />

            {cuentaActiva && (
              <>
                <AccountSummary
                  cuenta={cuentaActiva}
                  ingresosMes={resumenMes.ingresos}
                  egresosMes={resumenMes.egresos}
                  onIngreso={() => setModalMovimientoTipo('ingreso')}
                  onEgreso={() => setModalMovimientoTipo('egreso')}
                  onTransferir={() => setIsTransferOpen(true)}
                />

                <PagosCard
                  pagos={pagosCuenta}
                  divisa={cuentaActiva.divisa}
                  saldo={cuentaActiva.monto}
                  cargando={cargandoDetalle}
                  onAddPago={() => setIsAddPagoOpen(true)}
                  onPagar={setPagoPagar}
                  onDelete={handleEliminarPago}
                />

                <MovementsTimeline
                  movimientos={movimientosCuenta}
                  cuentaId={cuentaActiva.id!}
                  divisa={cuentaActiva.divisa}
                  nombresBilletera={nombresBilletera}
                  cargando={cargandoDetalle}
                  onDelete={handleEliminarMovimiento}
                />
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons name="account-balance-wallet" size={32} color={PALETTE.outline} />
            <Text style={styles.emptyTitle}>Todavía no tenés cuentas</Text>
            <Text style={styles.emptyText}>
              Tocá "Agregar cuenta" para crear la primera y empezar a registrar tus movimientos.
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNavigationBar
        activeTab="billetera"
        onSelectTab={(tab) => navigateToTab(navigation, 'billetera', tab)}
      />

      <AddBilleteraModal
        visible={isModalOpen}
        ciUsuario={ciUsuario}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAgregarCuenta}
      />

      <AddMovimientoModal
        visible={modalMovimientoTipo !== null}
        tipo={modalMovimientoTipo ?? 'ingreso'}
        cuentaNombre={cuentaActiva?.nombre ?? ''}
        onClose={() => setModalMovimientoTipo(null)}
        onSave={handleRegistrarMovimiento}
      />

      {cuentaActiva ? (
        <>
          <TransferModal
            visible={isTransferOpen}
            origen={cuentaActiva}
            destinos={destinos}
            onClose={() => setIsTransferOpen(false)}
            onSave={handleTransferir}
          />
          <AddPagoModal
            visible={isAddPagoOpen}
            cuentaNombre={cuentaActiva.nombre}
            onClose={() => setIsAddPagoOpen(false)}
            onSave={handleAgregarPago}
          />
          <PayPagoModal
            visible={pagoPagar !== null}
            pago={pagoPagar}
            saldo={cuentaActiva.monto}
            divisa={cuentaActiva.divisa}
            onClose={() => setPagoPagar(null)}
            onSave={handlePagarPago}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    paddingBottom: 100,
    paddingTop: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.categorias.finanzas,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
  estadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 16,
    padding: 16,
  },
  estadoText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...SHADOW.card,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  emptyText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
  },
});