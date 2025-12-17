import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos de sesión al iniciar
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const usuarioString = await AsyncStorage.getItem('usuario');
      if (usuarioString) {
        const stored = JSON.parse(usuarioString);

        // Normalizar posibles formas: { usuario: {...}, token }, { user: {...}, token }, o {...user..., token}
        const userObj = stored.usuario || stored.user || stored;
        const tokenVal = stored.token || userObj?.token || null;

        setUser(userObj);
        setToken(tokenVal);
      }
    } catch (error) {
      console.error('Error cargando datos de usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  // En AuthContext.js, modifica la función login:
const login = async (userData) => {
  try {
    console.log('📥 AuthContext - Datos recibidos del login:', userData);
    
    // ✅ Transformar _id de ObjectId a string si es necesario
    let userId = userData._id;
    
    if (userId && typeof userId === 'object') {
      // Si _id es un ObjectId de MongoDB
      if (userId.toString) {
        userId = userId.toString();
        console.log('🔄 _id convertido de ObjectId a string:', userId);
      }
    }
    
    const userToStore = {
      _id: userId || userData._id,
      id: userId || userData._id, // Para compatibilidad
      nombre: userData.nombre,
      usuario: userData.usuario,
      email: userData.email,
      token: userData.token,
      telefono: userData.telefono || '',
      membresia: userData.membresia || 'Usuario',
      creadoEn: userData.creadoEn,
      ultimoLogin: userData.ultimoLogin,
      activo: userData.activo !== undefined ? userData.activo : true
    };
    
    console.log('💾 Guardando usuario en AsyncStorage:', userToStore);
    await AsyncStorage.setItem('usuario', JSON.stringify(userToStore));
    setUser(userToStore);
    setToken(userData.token);
    
  } catch (error) {
    console.error('Error guardando datos de usuario:', error);
  }
};
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('usuario');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const updateToken = (newToken) => {
    setToken(newToken);

    // Actualizar token en AsyncStorage manteniendo la estructura original
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('usuario');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.token = newToken;
          if (parsed.usuario) parsed.usuario.token = newToken;
          if (parsed.user) parsed.user.token = newToken;
          await AsyncStorage.setItem('usuario', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Error al actualizar token en AsyncStorage:', e);
      }
    })();

    if (user) {
      const updatedUser = { ...user, token: newToken };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};