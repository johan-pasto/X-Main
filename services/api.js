// services/api.js
import axios from 'axios';

// Configurar axios con tu URL base
const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api', // Para Android Emulator
  // baseURL: 'http://localhost:3000/api', // Para iOS Simulator
  // baseURL: 'http://192.168.x.x:3000/api', // Para dispositivo físico
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  async (config) => {
    // Si necesitas agregar token automáticamente
    // const token = await AsyncStorage.getItem('userToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;