import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home';
import BilleteraScreen from '../screens/Billetera';
import ActividadesScreen from '../screens/Actividades';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}