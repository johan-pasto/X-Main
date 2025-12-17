// Selección centralizada de la URL base de la API
// Usa 10.0.2.2 para Android emulator en desarrollo, y la URL remota en producción
export const API_BASE_URL = (typeof __DEV__ !== 'undefined' && __DEV__)
  ? 'http://10.0.2.2:3000/api'
  : 'https://apix-two.vercel.app/api';

export default API_BASE_URL;
