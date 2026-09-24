import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW, tint, pressedFeedback } from '../theme/theme';
import { Movimiento, TipoMovimiento, signoMovimiento } from '../repositories/movimientos';
import { signoDivisa, formatMonto } from '../utils/divisas';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_COMPLETO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  movimientos: Movimiento[];
  cuentaId: number;
  divisa: string;
  nombresBilletera: Record<number, string>;
  cargando?: boolean;
  onDelete?: (id: number) => void;
}

function fechaParts(fechaHora: string): { anio: number; mes: number; dia: number; mesIndex: number } {
  const date = new Date(fechaHora);
  return {
    anio: date.getFullYear(),
    mes: date.getMonth() + 1,
    dia: date.getDate(),
    mesIndex: date.getMonth(),
  };
}

function iconoTipo(tipo: TipoMovimiento): keyof typeof MaterialIcons.glyphMap {
  switch (tipo) {
    case 'ingreso':
      return 'trending-up';
    case 'egreso':
      return 'trending-down';
    default:
      return 'swap-horiz';
  }
}

function nombreTipo(tipo: TipoMovimiento): string {
  switch (tipo) {
    case 'ingreso':
      return 'Ingreso';
    case 'egreso':
      return 'Egreso';
    default:
      return 'Transferencia';
  }
}

function formatoFecha(fechaHora: string): string {
  const { dia, mes, anio } = fechaParts(fechaHora);
  const hoy = new Date();
  if (dia === hoy.getDate() && mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()) {
    return 'Hoy';
  }
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

function formatoFechaHora(fechaHora: string): string {
  const date = new Date(fechaHora);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()} · ${hh}:${min}`;
}

interface GrupoDia {
  clave: string;
  fechaHora: string;
  items: Movimiento[];
}

interface GrupoMes {
  clave: string;
  dias: GrupoDia[];
  totalIngresos: number;
  totalEgresos: number;
}

export function MovementsTimeline({ movimientos, cuentaId, divisa, nombresBilletera, cargando, onDelete }: Props) {
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  const { meses, total } = useMemo(() => {
    const ingresos = movimientos.reduce(
      (acc, m) => acc + (m.tipo === 'ingreso' ? m.monto : 0),
      0
    );
    const egresos = movimientos.reduce(
      (acc, m) => acc + ((m.tipo === 'egreso' || (m.tipo === 'transferencia' && m.billetera_destino_id !== cuentaId)) ? m.monto : 0),
      0
    );

    const mesesMap = new Map<string, GrupoMes>();
    for (const m of movimientos) {
      const { anio, mes } = fechaParts(m.fecha_hora);
      const claveMes = `${anio}-${String(mes).padStart(2, '0')}`;
      let grupoMes = mesesMap.get(claveMes);
      if (!grupoMes) {
        grupoMes = {
          clave: claveMes,
          dias: [],
          totalIngresos: 0,
          totalEgresos: 0,
        };
        mesesMap.set(claveMes, grupoMes);
      }

      const claveDia = m.fecha_hora.slice(0, 10);
      let grupoDia = grupoMes.dias.find((d) => d.clave === claveDia);
      if (!grupoDia) {
        grupoDia = { clave: claveDia, fechaHora: m.fecha_hora, items: [] };
        grupoMes.dias.push(grupoDia);
      }
      grupoDia.items.push(m);

      const signo = signoMovimiento(m, cuentaId);
      if (signo > 0) grupoMes.totalIngresos += m.monto;
      else grupoMes.totalEgresos += m.monto;
    }

    const meses = Array.from(mesesMap.values());
    meses.forEach((grupoMes) => {
      grupoMes.dias.sort((a, b) => (a.clave < b.clave ? 1 : -1));
    });

    return {
      meses,
      total: { ingresos, egresos },
    };
  }, [movimientos, cuentaId]);

  const toggleExpandido = (id: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (cargando) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyRow}>
          <ActivityIndicator size="small" color={PALETTE.ink} />
          <Text style={styles.emptyText}>Cargando movimientos…</Text>
        </View>
      </View>
    );
  }

  if (movimientos.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyRow}>
          <MaterialIcons name="event-note" size={20} color={PALETTE.ink} />
          <Text style={styles.emptyText}>Sin movimientos en esta cuenta todavía.</Text>
        </View>
      </View>
    );
  }

  const signo = signoDivisa(divisa);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Movimientos</Text>
        <Text style={styles.totalText}>
          {signo}{formatMonto(total.ingresos)} / {signo}{formatMonto(total.egresos)}
        </Text>
      </View>

      {meses.map((grupoMes) => {
        const { anio, mesIndex } = fechaParts(`${grupoMes.clave}-01T00:00:00`);
        return (
          <View key={grupoMes.clave} style={styles.monthBlock}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthLabel}>
                {MESES_COMPLETO[mesIndex]} {anio}
              </Text>
              <Text style={styles.monthBalance}>
                +{formatMonto(grupoMes.totalIngresos)} / -{formatMonto(grupoMes.totalEgresos)}
              </Text>
            </View>

            {grupoMes.dias.map((grupoDia) => (
              <View key={grupoDia.clave}>
                <Text style={styles.dayLabel}>{formatoFecha(grupoDia.fechaHora)}</Text>
                {grupoDia.items.map((m) => {
                  const id = m.id!;
                  const signoMov = signoMovimiento(m, cuentaId);
                  const color = signoMov > 0 ? PALETTE.categorias.finanzas : PALETTE.categorias.critico;
                  const expandido = expandidos.has(id);
                  const esTransferencia = m.tipo === 'transferencia';
                  const nombreOrigen = nombresBilletera[m.billetera_id] ?? '';
                  const nombreDestino = m.billetera_destino_id !== null && m.billetera_destino_id !== undefined
                    ? nombresBilletera[m.billetera_destino_id]
                    : '';

                  return (
                    <Pressable
                      key={id}
                      style={({ pressed }) => [styles.row, expandido && styles.rowExpandido, pressed && pressedFeedback]}
                      onPress={() => toggleExpandido(id)}
                    >
                      <View style={styles.rowHeader}>
                        <View style={[styles.iconChip, { backgroundColor: tint(color) }]}>
                          <MaterialIcons name={iconoTipo(m.tipo)} size={16} color={color} />
                        </View>
                        <View style={styles.rowInfo}>
                          <View style={styles.rowTituloLine}>
                            <Text style={styles.rowTitulo} numberOfLines={1}>{m.titulo}</Text>
                            {m.pago_id !== null && m.pago_id !== undefined && (
                              <View style={styles.pagoBadge}>
                                <MaterialIcons name="receipt" size={10} color={PALETTE.categorias.trabajo} />
                                <Text style={styles.pagoBadgeText}>Pago</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.rowSubtitulo} numberOfLines={1}>
                            {nombreTipo(m.tipo)}
                            {m.descripcion ? ` · ${m.descripcion}` : ''}
                          </Text>
                        </View>
                        <Text style={[styles.rowMonto, { color: PALETTE.ink }]}>
                          {signoMov > 0 ? '+' : '-'}
                          {formatMonto(m.monto)}
                        </Text>
                        <MaterialIcons
                          name={expandido ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={PALETTE.ink}
                        />
                      </View>

                      {expandido && (
                        <View style={styles.detalle}>
                          <View style={styles.detalleRow}>
                            <Text style={styles.detalleLabel}>Tipo</Text>
                            <Text style={styles.detalleValor}>{nombreTipo(m.tipo)}</Text>
                          </View>
                          <View style={styles.detalleRow}>
                            <Text style={styles.detalleLabel}>Fecha</Text>
                            <Text style={styles.detalleValor}>{formatoFechaHora(m.fecha_hora)}</Text>
                          </View>
                          {esTransferencia && (
                            <View style={styles.detalleRow}>
                              <Text style={styles.detalleLabel}>Entre cuentas</Text>
                              <Text style={styles.detalleValor} numberOfLines={1}>
                                {nombreOrigen} → {nombreDestino || 'cuenta eliminada'}
                              </Text>
                            </View>
                          )}
                          {m.descripcion ? (
                            <View style={styles.detalleRow}>
                              <Text style={styles.detalleLabel}>Descripción</Text>
                              <Text style={styles.detalleValor}>{m.descripcion}</Text>
                            </View>
                          ) : null}
                          {m.pago_id !== null && m.pago_id !== undefined && (
                            <View style={styles.detalleRow}>
                              <Text style={styles.detalleLabel}>Origen</Text>
                              <Text style={styles.detalleValor}>Movimiento de pago vinculado</Text>
                            </View>
                          )}
                          <View style={styles.detalleRow}>
                            <Text style={styles.detalleLabel}>Monto</Text>
                            <Text style={styles.detalleValor}>
                              {signoMov > 0 ? '+' : '-'}
                              {signo}{formatMonto(m.monto)}
                            </Text>
                          </View>
                          {onDelete && (
                            <Pressable
                              style={({ pressed }) => [styles.deleteButton, pressed && pressedFeedback]}
                              onPress={() => onDelete(id)}
                            >
                              <MaterialIcons name="delete-outline" size={16} color={PALETTE.categorias.critico} />
                              <Text style={styles.deleteButtonText}>Eliminar movimiento</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...SHADOW.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  totalText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  monthBlock: {
    gap: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  monthBalance: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    marginTop: 6,
    marginBottom: 2,
  },
  row: {
    gap: 0,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rowExpandido: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 1,
  },
  rowTituloLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
    flexShrink: 1,
  },
  rowSubtitulo: {
    fontSize: 11,
    color: PALETTE.onSurfaceVariant,
  },
  pagoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: tint(PALETTE.categorias.trabajo),
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pagoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.categorias.trabajo,
  },
  rowMonto: {
    fontSize: 13,
    fontWeight: '800',
  },
  detalle: {
    marginTop: 8,
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detalleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  detalleValor: {
    fontSize: 11,
    color: PALETTE.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: tint(PALETTE.categorias.critico, 0.1),
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.categorias.critico,
  },
});