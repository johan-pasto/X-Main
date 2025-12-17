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
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from "@react-native-async-storage/async-storage";

type InicioScreenNavigationProp = StackNavigationProp<any, 'Inicio'>;

type Props = {
  navigation: InicioScreenNavigationProp;
};

export default function Inicio({ navigation }: Props) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
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

      if (res.ok && data && (data.ok || data.token || data.usuario)) {
        const userData = data.usuario || data.user || {};

        const transformedUser = {
          id: userData.id?.toString() || userData._id?.toString() || '',
          _id: userData._id || userData.id || '',
          username: userData.usuario || userData.username || '',
          name: userData.nombre || userData.name || '',
          email: userData.email || '',
          bio: userData.bio || '',
          avatar_url: userData.avatar_url || userData.avatar || '',
          location: userData.ubicacion || userData.location || '',
          website: userData.sitio_web || userData.website || '',
          created_at: userData.creadoEn || userData.created_at || new Date().toISOString()
        };

        const transformedData = {
          ok: true,
          token: data.token || '',
          message: data.message || 'Login exitoso',
          user: transformedUser,
          usuario: transformedUser
        };

        await AsyncStorage.setItem('usuario', JSON.stringify(transformedData));
        navigation.replace('Tablero');
      } else {
        Alert.alert(
          'Error',
          data?.message || 'Credenciales incorrectas'
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.Fondo}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=2069&auto=format&fit=crop'
          }}
          resizeMode="cover"
          style={estilos.Fondo}
          blurRadius={3}
        >
          <View style={[
            estilos.Fondo,
            {
              backgroundColor: 'rgba(0,0,0,0.7)',
              paddingHorizontal: 24,
              justifyContent: 'center',
              paddingVertical: 40
            }
          ]}>

            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#1D9BF0',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
                  X
                </Text>
              </View>

              <Text style={[estilos.title, { marginBottom: 8 }]}>
                Iniciar sesión
              </Text>

              <Text style={[estilos.text, { textAlign: 'center' }]}>
                Ingresa tus credenciales para continuar
              </Text>
            </View>

            {/* Formulario */}
            <View style={{
              backgroundColor: '#16181C',
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: '#2F3336'
            }}>

              <View style={{ marginBottom: 20 }}>
                <Text style={[estilos.text, { marginBottom: 8, fontWeight: '600' }]}>
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

              <View style={{ marginBottom: 24 }}>
                <Text style={[estilos.text, { marginBottom: 8, fontWeight: '600' }]}>
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

              <TouchableOpacity
                style={[
                  estilos.botonBase,
                  estilos.botonNormal,
                  {
                    height: 52,
                    backgroundColor: isHovered ? '#1A8CD8' : '#1D9BF0',
                    opacity: isLoading ? 0.7 : 1
                  }
                ]}
                onPress={handleIniciar}
                onPressIn={() => setIsHovered(true)}
                onPressOut={() => setIsHovered(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={estilos.botonText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  estilos.botonBase,
                  {
                    height: 52,
                    marginTop: 20,
                    borderWidth: 1,
                    borderColor: '#2F3336'
                  }
                ]}
                onPress={() => navigation.navigate('Registro')}
              >
                <Text style={[estilos.botonText, { color: '#E7E9EA' }]}>
                  Crear cuenta nueva
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <Text style={[estilos.text, { fontSize: 12, color: '#71767B' }]}>
                Al iniciar sesión, aceptas nuestros términos de servicio
              </Text>
            </View>

          </View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
