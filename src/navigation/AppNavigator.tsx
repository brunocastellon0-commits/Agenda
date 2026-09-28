import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home';
import BilleteraScreen from '../screens/Billetera';
import ActividadesScreen from '../screens/Actividades';
import MetricasScreen from '../screens/Metricas';
import ComidaScreen from '../screens/Comida';
import EstadoScreen from '../screens/Estado';
import ControlScreen from '../screens/Control';
import { RootStackParamList } from './types';
import { PALETTE } from '../theme/theme';
import { SER_ESPEC_TRANSICION, interpoladorTab } from './transition';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          // Sin gestos horizontales de pila: el único camino entre módulos es el
          // Bottom Nav. El swipe-back capturaba el gesto horizontal de toda la
          // pantalla y le robaba el drag al carrusel de cuentas de Billetera.
          gestureEnabled: false,
          transitionSpec: SER_ESPEC_TRANSICION,
          cardStyle: { backgroundColor: PALETTE.surface },
          headerStyle: { backgroundColor: PALETTE.surface },
          headerTintColor: PALETTE.ink,
          headerTitleStyle: { fontWeight: '700', color: PALETTE.ink },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ route }) => ({
            title: 'Mi Agenda Personal',
            cardStyleInterpolator: interpoladorTab(route.params),
          })}
        />
        <Stack.Screen
          name="Billetera"
          component={BilleteraScreen}
          options={({ route }) => ({
            title: 'Billetera',
            cardStyleInterpolator: interpoladorTab(route.params),
          })}
        />
        <Stack.Screen
          name="Actividades"
          component={ActividadesScreen}
          options={({ route }) => ({
            title: 'Actividades',
            cardStyleInterpolator: interpoladorTab(route.params),
          })}
        />
        <Stack.Screen
          name="Metricas"
          component={MetricasScreen}
          options={({ route }) => ({
            title: 'Métricas',
            cardStyleInterpolator: interpoladorTab(route.params),
          })}
        />
        <Stack.Screen
          name="Comida"
          component={ComidaScreen}
          options={({ route }) => ({
            title: 'Comida',
            cardStyleInterpolator: interpoladorTab(route.params),
          })}
        />
        <Stack.Screen
          name="Estado"
          component={EstadoScreen}
          options={{
            title: 'Mi Estado',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Control"
          component={ControlScreen}
          options={{
            title: 'Tu Esquina',
            // La pantalla dibuja su propio header (SafeAreaView oscuro + X/goBack)
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}