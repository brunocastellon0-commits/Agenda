import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import UserTestScreen from '../screens/Home';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="UserTestScreen">
        <Stack.Screen
          name="UserTestScreen"
          component={UserTestScreen}
          options={{ title: 'Mi Agenda Personal' }}
        />
        <Stack.Screen
          name="Billetera" 
          component={require('../screens/Billetera').default} 
          options={{ title: 'Billetera' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}