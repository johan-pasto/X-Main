import React, { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert  } from 'react-native';
import { useEffect, useState, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather'; 
import { AuthContext } from '../context/AuthContext';
import Feed from './Feed';

// ✅ FUNCIÓN AUXILIAR PARA OBTENER STRINGS SEGUROS
const getSafeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') {
    // Si es objeto, buscar propiedades comunes
    if (value.value !== undefined) return String(value.value);
    if (value.username !== undefined) return String(value.username);
    if (value.usuario !== undefined) return String(value.usuario);
    if (value.name !== undefined) return String(value.name);
    if (value.nombre !== undefined) return String(value.nombre);
    // Si no, usar valor por defecto
    return defaultValue;
  }
  return String(value);
};

export default function Tablero() {
  const navigation = useNavigation<any>();
  
  // ✅ Obtener contexto
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>Cargando contexto de autenticación...</Text>
      </View>
    );
  }
  
  const { user, token, logout: authLogout, loading: authLoading } = authContext;
  
  // ✅ ESTADOS
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

  // ✅ DERIVAR DATOS
  const isAuthenticated = !!token;

  // ✅ OBTENER VALORES SEGUROS DEL USER
  const safeUsername = user ? getSafeString(user.usuario) : '';
  const safeNombre = user ? getSafeString(user.nombre) : '';
  const safeEmail = user ? getSafeString(user.email) : '';

  // ✅ BUSCAR ID EN USER
  const findUserId = () => {
    if (!user) return '';
    
    // Buscar en propiedades directas
    const directId = user._id || user.id || user.userId || user.uid;
    if (directId) return String(directId);
    
    // Buscar recursivamente en el objeto
    const findIdRecursive = (obj) => {
      for (const key in obj) {
        const value = obj[key];
        
        // Si la key contiene "id" (case insensitive) y tiene valor
        if (key.toLowerCase().includes('id') && value) {
          return String(value);
        }
        
        // Si el valor es un objeto, buscar dentro
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const found = findIdRecursive(value);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findIdRecursive(user) || '';
  };

  const safeId = findUserId();

  useEffect(() => {
    console.log('🔄 Tablero - Estado actualizado');
    console.log('👤 User:', user);
    console.log('🔐 Token:', token ? '✅' : '❌');
    console.log('🎯 Autenticado:', isAuthenticated);
    
    // ✅ DEBUG INFO SEGURA
    const info = `
=== AUTH CONTEXT INFO ===
Usuario: ${safeUsername || 'N/A'}
Nombre: ${safeNombre || 'N/A'}
ID: ${safeId || 'N/A'}
Email: ${safeEmail || 'N/A'}
Token: ${token ? '✅ PRESENTE' : '❌ AUSENTE'}
Autenticado: ${isAuthenticated ? '✅ SÍ' : '❌ NO'}
    `.trim();
    
    setDebugInfo(info);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
    
  }, [user, token, isAuthenticated, safeUsername, safeNombre, safeId, safeEmail]);

  // ✅ FUNCIÓN navigateToProfile CORREGIDA Y COMPLETA
  const navigateToProfile = () => {
    console.log('🎯 Navegando a perfil...');
    
    if (!isAuthenticated) {
      Alert.alert('No autenticado', 'Debes iniciar sesión para ver tu perfil');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'No hay datos de usuario');
      return;
    }
    
    // ✅ OBTENER ID
    let userId = safeId;
    
    if (!userId) {
      console.error('❌ No se encontró ID en user');
      console.log('🔍 Propiedades de user:', Object.keys(user));
      console.log('🔍 User completo:', JSON.stringify(user, null, 2));
      
      // Crear ID temporal
      if (safeEmail) {
        userId = `temp_${safeEmail.split('@')[0]}_${Date.now()}`;
      } else if (safeUsername) {
        userId = `temp_${safeUsername}_${Date.now()}`;
      } else {
        userId = `temp_user_${Date.now()}`;
      }
      
      console.log('⚠️ Usando ID temporal:', userId);
      
      Alert.alert(
        'ID Temporal',
        'No se encontró un ID único. Usando ID temporal para navegar.',
        [{ text: 'Continuar' }]
      );
    }
    
    console.log('🚀 Navegando con:');
    console.log('• userId:', userId);
    console.log('• username:', safeUsername);
    console.log('• nombre:', safeNombre);
    console.log('• email:', safeEmail);
    
    // ✅ NAVEGACIÓN SEGURA
    navigation.navigate('Profile', {
      userId: userId,
      userData: {
        // Propiedades principales (convertidas a strings seguros)
        id: userId,
        _id: userId,
        username: safeUsername,
        name: safeNombre,
        email: safeEmail,
        // Mantener propiedades originales (convertidas a strings si es necesario)
        ...Object.keys(user).reduce((acc, key) => {
          acc[key] = getSafeString(user[key]);
          return acc;
        }, {})
      }
    });
  };

  // ✅ FUNCIÓN LOGOUT
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await authLogout();
              console.log('🚪 Sesión cerrada');
              navigation.navigate('Inicio');
            } catch (error) {
              console.error('❌ Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // ✅ FUNCIÓN DEBUG MEJORADA
  const debugAuthContext = () => {
    console.log('🔍 DEBUG AUTH CONTEXT DETALLADO');
    console.log('user:', user);
    console.log('tipo de user:', typeof user);
    
    if (user) {
      console.log('=== PROPIEDADES ===');
      for (const key in user) {
        console.log(`  "${key}":`, user[key], `(tipo: ${typeof user[key]})`);
      }
      
      console.log('=== BUSCANDO ID ===');
      const idKeys = ['_id', 'id', 'userId', 'UserId', 'uid', 'userID'];
      idKeys.forEach(key => {
        console.log(`  ${key}:`, user[key] || 'no existe');
      });
    }
    
    console.log('token:', token);
    console.log('isAuthenticated:', isAuthenticated);
    
    Alert.alert(
      'Debug',
      `Usuario: ${safeUsername}\n` +
      `Nombre: ${safeNombre}\n` +
      `ID: ${safeId || 'No encontrado'}\n` +
      `Email: ${safeEmail}\n` +
      `Autenticado: ${isAuthenticated ? '✅' : '❌'}`
    );
  };

  // ✅ LOADING
  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>
          {authLoading ? 'Cargando autenticación...' : 'Cargando Tablero...'}
        </Text>
      </View>
    );
  }

  // ✅ RENDER PRINCIPAL
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          style={[styles.headerButton, !navigation.canGoBack() && styles.headerButtonDisabled]}
          disabled={!navigation.canGoBack()}
        >
          <Icon name="arrow-left" size={20} color={navigation.canGoBack() ? "#fff" : "#555"} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Home</Text>
          {isAuthenticated && user && safeUsername && (
            <Text style={styles.userGreeting}>
              Hola, @{safeUsername}
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={debugAuthContext}
            style={styles.debugHeaderButton}
          >
            <Icon name="info" size={16} color="#4CAF50" />
          </TouchableOpacity>
          
          {isAuthenticated && (
            <TouchableOpacity 
              onPress={navigateToProfile}
              style={styles.profileButton}
            >
              <Icon name="user" size={20} color="#1d9bf0" />
            </TouchableOpacity>
          )}
          
          {isAuthenticated ? (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="log-out" size={18} color="#ff4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Inicio')}
              style={styles.loginButton}
            >
              <Icon name="log-in" size={18} color="#1d9bf0" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DEBUG INFO */}
      {__DEV__ && debugInfo ? (
        <View style={styles.debugContainer}>
          <ScrollView style={styles.debugScroll}>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </ScrollView>
        </View>
      ) : null}

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.contentContainer}>
        {isAuthenticated ? (
          <View style={styles.feedContainer}>
            <Feed />
          </View>
        ) : (
          <View style={styles.loginContainer}>
            <Icon name="home" size={60} color="#444" style={styles.loginIcon} />
            <Text style={styles.loginTitle}>🔐 Sesión no iniciada</Text>
            <Text style={styles.loginText}>
              Para ver y publicar tweets, necesitas iniciar sesión.
            </Text>
            
            <TouchableOpacity 
              style={styles.mainButton}
              onPress={() => navigation.navigate('Inicio')}
            >
              <Icon name="log-in" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.mainButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {isAuthenticated ? (
          <View style={styles.footerButtons}>
            <TouchableOpacity 
              style={styles.footerButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="home" size={20} color="#1d9bf0" />
              <Text style={styles.footerButtonText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.footerButton}
              onPress={navigateToProfile}
            >
              <Icon name="user" size={20} color="#666" />
              <Text style={styles.footerButtonText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.footerText}>
            Estado: {isAuthenticated ? '✅ Autenticado' : '❌ No autenticado'}
          </Text>
        )}
      </View>
    </View>
  );
}

// ✅ ESTILOS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000', 
    padding: 20 
  },
  loadingText: { 
    color: '#fff', 
    fontSize: 16, 
    marginTop: 10, 
    marginBottom: 20 
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonDisabled: {
    backgroundColor: '#111',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  debugHeaderButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: '#222',
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userGreeting: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugContainer: {
    backgroundColor: '#111',
    margin: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 100,
  },
  debugScroll: {
    maxHeight: 80,
  },
  debugText: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  contentContainer: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loginIcon: {
    marginBottom: 20,
  },
  loginTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  mainButton: {
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 5,
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerButton: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  footerButtonText: {
    color: '#666',
    fontSize: 11,
    marginTop: 3,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});