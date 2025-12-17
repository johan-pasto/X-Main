import React, { useState } from "react";
import { 
  TextInput, 
  Text, 
  View, 
  ImageBackground, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  ScrollView
} from "react-native";
import estilos from "../Estilos/Style";
import {Picker} from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
type InicioScreenNavigationProp = StackNavigationProp<any, 'Inicio'>;
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: InicioScreenNavigationProp;
};

export default function Inicio({navigation}: Props){
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [miembro, setMiembro] = useState('Usuario');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

const handleIniciar = async () => {
  if (!usuario.trim() || !password.trim()) {
    Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
    return;
  }

  setIsLoading(true);

  try {
    const res = await fetch('https://apix-two.vercel.app/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await res.json();

    // Debug
    console.log('=== DEBUG LOGIN ===');
    console.log('📨 Status:', res.status, 'OK:', res.ok);
    console.log('📦 Data completa:', JSON.stringify(data, null, 2));
    console.log('🔐 Tiene token?:', !!data?.token);
    console.log('👤 Tiene usuario?:', !!data?.usuario);
    console.log('=== FIN DEBUG ===');

    if (res.ok && data && (data.ok || data.token || data.usuario)) {
      await AsyncStorage.setItem('usuario', JSON.stringify(data));

      // Esperar un poco para asegurar persistencia en dispositivos lentos
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

      const saved = await AsyncStorage.getItem('usuario');
      console.log('✅ Verificación final en Inicio:', saved ? 'GUARDADO' : 'NO');

      navigation.replace('Tablero');
    } else {
      // MANEJO SEGURO del mensaje de error
      const errorMsg = data?.message;
      let displayMessage = 'Credenciales incorrectas';
      
      if (errorMsg) {
        if (typeof errorMsg === 'string') {
          displayMessage = errorMsg;
        } else if (typeof errorMsg === 'object') {
          displayMessage = JSON.stringify(errorMsg);
        }
      }
      
      console.log('🔴 Error mostrado:', displayMessage);
      Alert.alert('Error', displayMessage);
    }
  } catch (e: any) {
    console.error('Error de conexión:', e);
    
    // MANEJO SEGURO del error
    let errorMessage = 'No se pudo conectar al servidor';
    
    if (e && typeof e === 'object') {
      if (e.message && typeof e.message === 'string') {
        errorMessage = e.message;
      } else {
        errorMessage = JSON.stringify(e);
      }
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  return(
    <KeyboardAvoidingView
      style={estilos.Fondo}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground
          source={{uri:'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=2069&auto=format&fit=crop'}}
          resizeMode="cover"
          style={estilos.Fondo}
          blurRadius={3}
        >
          {/* Overlay oscuro */}
          <View style={[estilos.Fondo, {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: 24,
            justifyContent: 'center',
            paddingVertical: 40
          }]}>
            
            {/* Logo/Header */}
            <View style={{alignItems: 'center', marginBottom: 40}}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#1D9BF0',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 28,
                  fontWeight: 'bold'
                }}>X</Text>
              </View>
              <Text style={[estilos.title, {marginBottom: 8}]}>
                Iniciar sesión
              </Text>
              <Text style={[estilos.text, {marginTop: 8, textAlign: 'center'}]}>
                Ingresa tus credenciales para continuar
              </Text>
            </View>

            {/* Contenedor del formulario */}
            <View style={[{
              backgroundColor: '#16181C',
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: '#2F3336',
              marginBottom: 24
            }]}>
              
              {/* Campo Usuario */}
              <View style={{marginBottom: 20}}>
                <Text style={[estilos.text, {marginBottom: 8, fontWeight: '600'}]}>
                  Usuario
                </Text>
                <TextInput 
                  style={estilos.textinput}
                  value={usuario}
                  onChangeText={setUsuario}
                  placeholder="Nombre de usuario"
                  placeholderTextColor="#71767B"
                  autoCapitalize="none"
                />
              </View>

              {/* Campo Contraseña */}
              <View style={{marginBottom: 20}}>
                <Text style={[estilos.text, {marginBottom: 8, fontWeight: '600'}]}>
                  Contraseña
                </Text>
                <TextInput 
                  style={estilos.textinput}
                  value={password}
                  secureTextEntry
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#71767B"
                />
              </View>

              {/* Campo Membresía */}
              <View style={{marginBottom: 24}}>
                <Text style={[estilos.text, {marginBottom: 8, fontWeight: '600'}]}>
                  Tipo de cuenta
                </Text>
                <View style={[estilos.textinput, {
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                  height: 50,
                  justifyContent: 'center'
                }]}>
                  <Picker
                    selectedValue={miembro}
                    onValueChange={(itemValue) => setMiembro(itemValue)}
                    style={{
                      color: '#E7E9EA',
                      backgroundColor: 'transparent'
                    }}
                    dropdownIconColor="#71767B"
                  >
                    <Picker.Item label="Usuario" value="Usuario" />
                    <Picker.Item label="Miembro" value="Miembro" />
                  </Picker>
                </View>
              </View>

              {/* Botón de inicio */}
              <TouchableOpacity
                style={[
                  estilos.botonBase, 
                  estilos.botonNormal,
                  {
                    height: 52,
                    width: '100%',
                    backgroundColor: isHovered ? '#1A8CD8' : '#1D9BF0',
                    opacity: isLoading ? 0.7 : 1
                  }
                ]}
                onPress={handleIniciar}
                onPressIn={() => setIsHovered(true)}
                onPressOut={() => setIsHovered(false)}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={estilos.botonText}>
                    Iniciar sesión
                  </Text>
                )}
              </TouchableOpacity>

              {/* Separador estilo X */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 24
              }}>
                <View style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: '#2F3336'
                }} />
                <Text style={{
                  color: '#71767B',
                  paddingHorizontal: 16,
                  fontSize: 14
                }}>O</Text>
                <View style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: '#2F3336'
                }} />
              </View>

              {/* Botón para ir al Registro */}
              <TouchableOpacity
                style={[
                  estilos.botonBase,
                  {
                    height: 52,
                    width: '100%',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: '#2F3336'
                  }
                ]}
                onPress={() => navigation.navigate('Registro')}
                activeOpacity={0.7}
              >
                <Text style={[estilos.botonText, {color: '#E7E9EA'}]}>
                  Crear cuenta nueva
                </Text>
              </TouchableOpacity>
            </View>

            {/* Enlaces adicionales */}
            <View style={{alignItems: 'center'}}>
              <TouchableOpacity
                style={{marginBottom: 16}}
                onPress={() => Alert.alert('Recuperar', 'Funcionalidad en desarrollo. Próximamente disponible.')}
              >
                <Text style={[estilos.text, {color: '#1D9BF0', fontWeight: '500'}]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Registro')}
              >
                <Text style={[estilos.text, {
                  color: '#71767B',
                  textAlign: 'center',
                  fontSize: 14
                }]}>
                  ¿No tienes cuenta?{' '}
                  <Text style={{color: '#1D9BF0', fontWeight: '500'}}>
                    Regístrate
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{marginTop: 32, alignItems: 'center'}}>
              <Text style={[estilos.text, {
                color: '#71767B',
                fontSize: 12,
                textAlign: 'center'
              }]}>
                Al iniciar sesión, aceptas nuestros términos de servicio
              </Text>
            </View>
          </View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}