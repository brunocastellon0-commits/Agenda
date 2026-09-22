import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW, pressedFeedback } from '../theme/theme';
import { TintPill } from './TintPill';
import { Usuario } from '../repositories/usuario';

interface Props {
  usuario: Usuario;
  onEditPress: () => void;
}

export function ProfileBanner({ usuario, onEditPress }: Props) {
  const iniciales = `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerContent}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{iniciales}</Text>
          </View>
          <View style={styles.ecoBadge}>
            <MaterialIcons name="eco" size={12} color={PALETTE.onAccent} />
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {usuario.nombre} {usuario.apellido}
          </Text>
          <View style={styles.purposeTag}>
            <View style={styles.dot} />
            <Text style={styles.purposeText}>Edad: {usuario.edad}</Text>
          </View>
        </View>
      </View>

      <TintPill color={PALETTE.categorias.trabajo} radius={16} style={styles.glowEdit}>
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && pressedFeedback]}
          onPress={onEditPress}
        >
          <MaterialIcons name="edit" size={16} color={PALETTE.onDark} />
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
      </TintPill>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...SHADOW.card,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PALETTE.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  ecoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: PALETTE.categorias.trabajo,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  purposeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.categorias.trabajo,
  },
  purposeText: {
    fontSize: 11,
    color: PALETTE.ink,
  },
  glowEdit: {
    alignSelf: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.categorias.trabajo,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  editButtonText: {
    color: PALETTE.onDark,
    fontSize: 12,
    fontWeight: '700',
  },
});