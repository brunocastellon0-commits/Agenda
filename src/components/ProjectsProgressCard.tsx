import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, tint } from '../theme/theme';
import { ProyectoConProgreso } from '../repositories/proyectoRepo';

interface ProjectsProgressCardProps {
  proyectos: ProyectoConProgreso[];
}

export function ProjectsProgressCard({ proyectos }: ProjectsProgressCardProps) {
  if (proyectos.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <MaterialIcons name="flag" size={20} color={PALETTE.categorias.objetivos} />
        </View>
        <Text style={styles.title}>Proyectos & Objetivos</Text>
      </View>

      <View style={styles.list}>
        {proyectos.slice(0, 3).map((proj) => {
          const total = proj.total_actividades;
          const comp = proj.actividades_completadas;
          const pct = total > 0 ? Math.round((comp / total) * 100) : proj.completado ? 100 : 0;

          return (
            <View key={proj.id} style={styles.projectRow}>
              <View style={styles.titleRow}>
                <Text style={styles.projectTitle} numberOfLines={1}>
                  {proj.titulo}
                </Text>
                <Text style={styles.pctText}>{pct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: tint(PALETTE.categorias.objetivos),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  list: {
    gap: 12,
  },
  projectRow: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
    flex: 1,
    marginRight: 8,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.categorias.objetivos,
  },
  track: {
    height: 6,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: PALETTE.categorias.objetivos,
    borderRadius: 3,
  },
});
