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
      console.log('📥 AuthContext - Datos cargados de AsyncStorage:', usuarioString);
      
      if (usuarioString) {
        const stored = JSON.parse(usuarioString);
        console.log('📦 Datos parseados:', stored);
        
        // NORMALIZACIÓN MEJORADA
        let userObj = null;
        let tokenVal = null;
        
        // Caso 1: Datos del nuevo backend (con transformación de Inicio.jsx)
        if (stored.user) {
          userObj = stored.user;
          tokenVal = stored.token || userObj.token;
        }
        // Caso 2: Datos directos del backend antiguo
        else if (stored.usuario) {
          // Transformar datos del backend al formato del frontend
          userObj = transformBackendToFrontend(stored.usuario);
          tokenVal = stored.token;
        }
        // Caso 3: Datos ya en formato user
        else if (stored._id || stored.id || stored.username) {
          userObj = stored;
          tokenVal = stored.token;
        }
        
        console.log('🔄 Usuario normalizado:', userObj);
        console.log('🔐 Token normalizado:', tokenVal);
        
        setUser(userObj);
        setToken(tokenVal);
      }
    } catch (error) {
      console.error('❌ Error cargando datos de usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para transformar datos del backend al frontend
  const transformBackendToFrontend = (backendUser) => {
    console.log('🔄 Transformando backend -> frontend:', backendUser);
    
    return {
      // IDs
      id: backendUser.id?.toString() || backendUser._id?.toString() || '',
      _id: backendUser._id?.toString() || backendUser.id?.toString() || '',
      
      // Información principal (mapeo backend → frontend)
      username: backendUser.usuario || backendUser.username || '',
      name: backendUser.nombre || backendUser.name || '',
      
      // Información personal
      email: backendUser.email || '',
      telefono: backendUser.telefono || '',
      membresia: backendUser.membresia || 'Usuario',
      
      // Perfil
      bio: backendUser.bio || '',
      avatar_url: backendUser.avatar_url || backendUser.avatar || '',
      location: backendUser.ubicacion || backendUser.location || '',
      website: backendUser.sitio_web || backendUser.website || '',
      
      // Fechas
      creadoEn: backendUser.creadoEn || backendUser.created_at,
      ultimoLogin: backendUser.ultimoLogin || new Date().toISOString(),
      activo: backendUser.activo !== undefined ? backendUser.activo : true,
      
      // Mantener compatibilidad con backend
      usuario: backendUser.usuario || '', // Mantener campo original
      nombre: backendUser.nombre || ''    // Mantener campo original
    };
  };

  const login = async (userData) => {
    try {
      console.log('📥 AuthContext.login - Datos recibidos:', userData);
      
      // Determinar qué estructura tiene userData
      let userToTransform = null;
      let tokenToStore = null;
      
      if (userData.user) {
        // Datos ya transformados por Inicio.jsx
        userToTransform = userData.user;
        tokenToStore = userData.token || userData.user.token;
      } else if (userData.usuario) {
        // Datos directos del backend
        userToTransform = userData.usuario;
        tokenToStore = userData.token;
      } else {
        // Datos mixtos
        userToTransform = userData;
        tokenToStore = userData.token;
      }
      
      // Transformar siempre para consistencia
      const transformedUser = transformBackendToFrontend(userToTransform);
      transformedUser.token = tokenToStore;
      
      console.log('💾 AuthContext - Guardando usuario transformado:', {
        username: transformedUser.username,
        name: transformedUser.name,
        id: transformedUser.id,
        token: !!tokenToStore
      });
      
      // Guardar en AsyncStorage
      const dataToStore = {
        user: transformedUser,
        token: tokenToStore
      };
      
      await AsyncStorage.setItem('usuario', JSON.stringify(dataToStore));
      
      // Actualizar estado
      setUser(transformedUser);
      setToken(tokenToStore);
      
      console.log('✅ AuthContext - Login completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en AuthContext.login:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext - Cerrando sesión');
      await AsyncStorage.removeItem('usuario');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const updateToken = (newToken) => {
    console.log('🔄 AuthContext - Actualizando token');
    setToken(newToken);

    // Actualizar token en AsyncStorage manteniendo la estructura original
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('usuario');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.token = newToken;
          if (parsed.user) {
            parsed.user.token = newToken;
          }
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

  // Función para debug
  const debugAuthState = () => {
    console.log('🔍 AuthContext State Debug:');
    console.log('User:', user);
    console.log('Token:', token);
    console.log('Loading:', loading);
    
    return {
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateToken,
        debugAuthState // Para debugging
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};