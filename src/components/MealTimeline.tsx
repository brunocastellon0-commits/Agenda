import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, pressedFeedback } from '../theme/theme';
import { Eyebrow } from './editorial';
import { RegistroComida, TipoComida } from '../repositories/comidaRepo';
import { formatCantidadUnidad, formatEstimado } from '../utils/nutricion';

interface Props {
  registros: RegistroComida[];
  onDelete?: (id: number) => void;
}

const ORDEN_TIPOS: { id: TipoComida; label: string }[] = [
  { id: 'desayuno', label: 'Desayuno' },
  { id: 'almuerzo', label: 'Almuerzo' },
  { id: 'merienda', label: 'Merienda' },
  { id: 'cena', label: 'Cena' },
  { id: 'otro', label: 'Snack' },
];

export default function MealTimeline({ registros, onDelete }: Props) {
  const colorForTipo = (tipo: string) => {
    switch (tipo) {
      case 'desayuno': return PALETTE.categorias.importante;
      case 'almuerzo': return PALETTE.categorias.finanzas;
      case 'merienda': return PALETTE.categorias.ocio;
      case 'cena': return PALETTE.categorias.objetivos;
      default: return PALETTE.outline;
    }
  };

  return (
    <View style={styles.container}>
      <Eyebrow text="Comidas del día" color={PALETTE.categorias.comida} style={styles.headerTitle} />

      {ORDEN_TIPOS.map(({ id, label }) => {
        const color = colorForTipo(id);
        const delTipo = registros.filter(r => r.tipo === id);

        return (
          <View key={id} style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionDot, { backgroundColor: color }]} />
              <Text style={styles.seccionTitulo}>{label}</Text>
              <View style={styles.seccionLinea} />
            </View>

            {delTipo.length === 0 ? (
              <Text style={styles.seccionVacia}>—</Text>
            ) : (
              delTipo.map(reg => (
                <View key={reg.id} style={styles.registro}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.tipoLabel, { color }]}>{reg.hora}</Text>
                    {onDelete && (
                      <Pressable
                        onPress={() => onDelete(reg.id!)}
                        style={({ pressed }) => [styles.deleteBtn, pressed && pressedFeedback]}
                        hitSlop={8}
                      >
                        <Text style={styles.deleteText}>✕</Text>
                      </Pressable>
                    )}
                  </View>

                  {reg.items.map((item, idx) => {
                    const nombre = item.alimento?.nombre || 'Alimento';
                    const cantidad = formatCantidadUnidad(item.cantidad, item.unidad);
                    const kcal = formatEstimado(item.kcal_est, ' kcal');
                    const meta = cantidad
                      ? `${cantidad} · ${kcal}`
                      : (item.kcal_est == null ? 'sin cantidad' : kcal);
                    return (
                      <View key={item.id ?? idx} style={styles.itemRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemNombre}>{nombre}</Text>
                        <Text style={styles.itemMeta}>{meta}</Text>
                      </View>
                    );
                  })}

                  {reg.nota && reg.nota.trim().length > 0 && (
                    <Text style={styles.notaText}>{reg.nota}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerTitle: {
    marginBottom: 16,
  },
  seccion: {
    marginBottom: 20,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  seccionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: 0,
  },
  seccionLinea: {
    flex: 1,
    height: 1,
    backgroundColor: PALETTE.hairline,
  },
  seccionVacia: {
    fontSize: 15,
    color: PALETTE.outline,
    marginLeft: 4,
    marginBottom: 4,
  },
  // Registro abierto sobre el lienzo: separador editorial, sin card propia
  registro: {
    paddingVertical: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 8,
  },
  deleteText: {
    color: PALETTE.outline,
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 3,
  },
  bullet: {
    fontSize: 15,
    color: PALETTE.outline,
  },
  itemNombre: {
    flexShrink: 1,
    fontSize: 15,
    color: PALETTE.ink,
  },
  itemMeta: {
    marginLeft: 'auto',
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
  },
  notaText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
