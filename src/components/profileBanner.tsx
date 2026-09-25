import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE } from '../theme/theme';
import { Usuario } from '../repositories/usuario';

interface Props {
  usuario: Usuario;
}

function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Buenos días';
  if (hora >= 12 && hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function obtenerFechaFormateada(): string {
  const d = new Date();
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
}

import { Pressable } from 'react-native';

export function ProfileBanner({ usuario, onPress }: Props & { onPress?: () => void }) {
  const saludo = obtenerSaludo();
  const fecha = obtenerFechaFormateada();

  return (
    <Pressable onPress={onPress} style={styles.bannerContainer}>
      <Text style={styles.saludo}>
        {saludo}, {usuario.nombre || 'viajero'}
      </Text>
      <Text style={styles.fecha}>{fecha}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 4,
  },
  saludo: {
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.5,
  },
  fecha: {
    fontSize: 15,
    color: PALETTE.onSurfaceVariant,
    fontWeight: '500',
  },
});