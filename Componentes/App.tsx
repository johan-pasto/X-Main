import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import { AuthProvider } from '../context/AuthContext';
import Inicio from './Inicio';
import Registro from './Registro';
import Tablero from '../Page/Tablero';
import Profile from '../Page/Profile';

import { GestureHandlerRootView } from 'react-native-gesture-handler';



enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Inicio" component={Inicio} />
          <Stack.Screen name="Registro" component={Registro} />
          <Stack.Screen name="Tablero" component={Tablero} />
          <Stack.Screen name="Profile" component={Profile} />
          <GestureHandlerRootView style={{ flex: 1 }}>
      {/* tu navegación o componentes */}
    </GestureHandlerRootView>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
