import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { navigateToTab } from '../navigation/tabs';
import { PALETTE } from '../theme/theme';
import { Usuario, getUsuarios, saveOrUpdateUsuario } from '../repositories/usuario';
import { ProfileBanner } from '../components/profileBanner';
import { GoalProgressCard } from '../components/goalProgressCard';
import { EditProfileModal } from '../components/EditProfile';
import { ComparisonCard } from '../components/ComparasionCard';
import { DistributionCard } from '../components/DistributionCard';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';

const DEFAULT_USUARIO: Usuario = {
  ci: '1',
  nombre: 'Valeria',
  apellido: 'Morales',
  peso: 0,
  altura: 0,
  cintura: 0,
  cuello: 0,
  edad: 0,
  avatarUrl: '',
};

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const cargarUsuario = async () => {
      try {
        const usuarios = await getUsuarios();
        if (!mounted) return;

        if (usuarios.length === 0) {
          await saveOrUpdateUsuario(DEFAULT_USUARIO);
          setUsuario(DEFAULT_USUARIO);
        } else {
          setUsuario(usuarios[0]);
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarUsuario();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveProfile = (updated: Usuario) => {
    setUsuario(updated);
    setIsModalOpen(false);
    saveOrUpdateUsuario(updated).catch((error) => {
      console.error('Error al guardar el usuario:', error);
    });
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.ink} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {usuario && (
          <ProfileBanner
            usuario={usuario}
            onEditPress={() => setIsModalOpen(true)}
          />
        )}

        <ComparisonCard />
        <DistributionCard />
        <GoalProgressCard />
      </ScrollView>

      <BottomNavigationBar
        activeTab="inicio"
        onSelectTab={(tab) => navigateToTab(navigation, 'inicio', tab)}
      />

      {usuario && (
        <EditProfileModal
          visible={isModalOpen}
          currentProfile={usuario}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </View>
  );
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
    paddingBottom: 24,
    paddingTop: 16,
    gap: 16,
  },
});