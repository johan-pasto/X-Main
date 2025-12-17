import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { AuthContext } from '../context/AuthContext';
import Feed from './Feed';

export default function Tablero() {
  const navigation = useNavigation();
  const { user, token, logout, loading: authLoading } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, token]);

  const navigateToProfile = () => {
    if (!token || !user) {
      Alert.alert('No autenticado', 'Debes iniciar sesión para ver tu perfil');
      return;
    }

    const userId = user.id || user._id;

    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    navigation.navigate('Profile', {
      userId,
      userData: user
    });
  };

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
              await logout();
              navigation.navigate('Inicio');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>
          {authLoading ? 'Cargando autenticación...' : 'Cargando...'}
        </Text>
      </View>
    );
  }

  const isAuthenticated = !!token && !!user;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Home</Text>
          {isAuthenticated && (
            <Text style={styles.userGreeting}>
              Hola, @{user.username || 'Usuario'}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
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

      {/* CONTENIDO */}
      <View style={styles.contentContainer}>
        {isAuthenticated ? (
          <Feed />
        ) : (
          <View style={styles.loginContainer}>
            <Icon name="home" size={60} color="#444" />
            <Text style={styles.loginTitle}>Sesión no iniciada</Text>
            <Text style={styles.loginText}>
              Para ver y publicar tweets, necesitas iniciar sesión.
            </Text>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => navigation.navigate('Inicio')}
            >
              <Icon name="log-in" size={18} color="#fff" />
              <Text style={styles.mainButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {isAuthenticated && (
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
        )}
      </View>
    </View>
  );
}

/* ================== ESTILOS ================== */

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
    marginTop: 10
  },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111'
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center'
  },

  headerRight: {
    flexDirection: 'row',
    gap: 10
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },

  userGreeting: {
    color: '#666',
    fontSize: 12,
    marginTop: 2
  },

  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },

  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loginButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },

  contentContainer: {
    flex: 1
  },

  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },

  loginTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center'
  },

  loginText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30
  },

  mainButton: {
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 10
  },

  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },

  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#111'
  },

  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },

  footerButton: {
    alignItems: 'center'
  },

  footerButtonText: {
    color: '#666',
    fontSize: 11,
    marginTop: 3
  }
});
