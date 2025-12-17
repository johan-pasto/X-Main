import axios from 'axios';

const API_BASE_URL = 'https://apix-two.vercel.app/api'; // Ajusta esta URL según tu backend

/**
 * Obtiene el perfil de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Datos del perfil del usuario
 */
export const getUserProfile = async (userId) => {
  try {
    console.log('👤 [getUserProfile] Obteniendo perfil para usuario:', userId);
    
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      timeout: 10000
    });
    
    console.log('✅ [getUserProfile] Respuesta RAW:', response.data);
    
    // Transformar datos del backend al frontend
    const userData = response.data.usuario || response.data;
    return {
      id: userData._id?.toString() || userData.id?.toString(),
      _id: userData._id || userData.id,
      // IMPORTANTE: Mapear campos correctamente
      username: userData.usuario || userData.username, // 'usuario' en backend
      name: userData.nombre || userData.name, // 'nombre' en backend
      email: userData.email,
      bio: userData.bio || userData.descripcion,
      avatar_url: userData.avatar_url || userData.avatar, // 'avatar_url' en backend
      location: userData.ubicacion || userData.location, // 'ubicacion' en backend
      website: userData.sitio_web || userData.website, // 'sitio_web' en backend
      created_at: userData.creadoEn || userData.created_at || userData.fecha_creacion,
      
      nombre: userData.nombre || userData.name
    };
    
  } catch (error) {
    // ... (mantener manejo de errores)
  }
};

/**
 * Obtiene los tweets de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} - Lista de tweets del usuario
 */
export const getUserTweets = async (userId) => {
  try {
    console.log('🐦 [getUserTweets] Obteniendo tweets para usuario:', userId);
    
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/tweets`, {
      timeout: 10000
    });
    
    console.log('✅ [getUserTweets] Tweets obtenidos:', {
      status: response.status,
      cantidad: response.data.tweets?.length || 0
    });
    
    // Transformar tweets para consistencia
    const tweets = (response.data.tweets || response.data || []).map(tweet => ({
      id: tweet._id?.toString() || tweet.id?.toString(),
      _id: tweet._id || tweet.id,
      content: tweet.contenido || tweet.content,
      contenido: tweet.contenido || tweet.content,
      user_id: tweet.usuario?._id || tweet.usuario?.id || tweet.user_id,
      user: tweet.usuario || tweet.user,
      username: tweet.usuario?.username || tweet.username,
      name: tweet.usuario?.name || tweet.usuario?.nombre || tweet.usuario?.username,
      avatar_url: tweet.usuario?.avatar || tweet.usuario?.avatar_url || tweet.avatar_url,
      created_at: tweet.fecha || tweet.created_at || tweet.createdAt,
      updated_at: tweet.updatedAt || tweet.updated_at,
      likes: tweet.likes || [],
      likesCount: tweet.likes?.length || tweet.likesCount || 0,
      comments: tweet.comments || tweet.comentarios || [],
      commentsCount: tweet.comments?.length || tweet.comentarios?.length || tweet.commentsCount || 0,
      retweets: tweet.retweets || [],
      retweetsCount: tweet.retweets?.length || tweet.retweetsCount || 0,
      image_url: tweet.imagen || tweet.image_url,
      editado: tweet.editado || false
    }));
    
    return tweets;
    
  } catch (error) {
    console.error('❌ [getUserTweets] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Si hay error, retornar array vacío
    return [];
  }
};

/**
 * Actualiza el perfil de un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} profileData - Datos a actualizar
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Perfil actualizado
 */
export const updateProfile = async (userId, profileData, token) => {
  try {
    console.log('✏️ [updateProfile] Actualizando perfil:', userId);
    console.log('📝 [updateProfile] Datos originales:', profileData);
    
    if (!token) {
      throw {
        ok: false,
        status: 401,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    // CORREGIR: Mapear campos del frontend al backend
    const updateData = {};
    
    if (profileData.name !== undefined) {
      updateData.nombre = profileData.name; // 'name' -> 'nombre'
    }
    
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio; // OK
    }
    
    if (profileData.avatar_url !== undefined) {
      // Enviar ambos nombres comunes por compatibilidad con distintos backends
      updateData.avatar_url = profileData.avatar_url;
      updateData.avatar = profileData.avatar_url;
    }
    
    if (profileData.location !== undefined) {
      updateData.ubicacion = profileData.location; // 'location' -> 'ubicacion'
    }
    
    if (profileData.website !== undefined) {
      updateData.sitio_web = profileData.website; // 'website' -> 'sitio_web'
    }
    
    console.log('📤 [updateProfile] Datos CORREGIDOS para backend:', updateData);
    
    const response = await axios.put(
      `${API_BASE_URL}/users/${userId}`,
      updateData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ [updateProfile] Respuesta del backend:', response.data);
    
    // Transformar respuesta del backend al frontend
    const updatedUser = response.data.usuario || response.data.user || response.data;
    
    return {
      id: updatedUser._id?.toString() || updatedUser.id?.toString(),
      _id: updatedUser._id || updatedUser.id,
      username: updatedUser.usuario || updatedUser.username, // 'usuario' en backend
      name: updatedUser.nombre || updatedUser.name, // 'nombre' en backend
      bio: updatedUser.bio || updatedUser.descripcion,
      avatar_url: updatedUser.avatar_url || updatedUser.avatar, // 'avatar_url' en backend
      location: updatedUser.ubicacion || updatedUser.location, // 'ubicacion' en backend
      website: updatedUser.sitio_web || updatedUser.website, // 'sitio_web' en backend
      message: response.data.message || 'Perfil actualizado exitosamente'
    };
    
  } catch (error) {
    console.error('❌ [updateProfile] Error actualizando perfil:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Propagar error con mensaje claro para la UI
    if (error.response && error.response.data) {
      const errMsg = error.response.data.message || JSON.stringify(error.response.data);
      throw { ok: false, status: error.response.status, message: errMsg };
    }

    throw { ok: false, status: 0, message: error.message || 'Error al actualizar perfil' };
  }
};

/**
 * Sube una imagen de avatar
 * @param {string} userId - ID del usuario
 * @param {FormData} formData - Datos del formulario con la imagen
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - URL de la imagen subida
 */
export const uploadAvatar = async (userId, formData, token) => {
  try {
    console.log('🖼️ [uploadAvatar] Subiendo avatar para usuario:', userId);
    
    if (!token) {
      throw {
        ok: false,
        status: 401,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/users/${userId}/upload-avatar`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ [uploadAvatar] Avatar subido:', response.data);
    
    return {
      ok: true,
      avatar_url: response.data.avatar_url || response.data.url,
      message: response.data.message || 'Avatar actualizado exitosamente'
    };
    
  } catch (error) {
    console.error('❌ [uploadAvatar] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      throw {
        ok: false,
        status: 401,
        message: 'No autorizado para subir avatar',
        requiresReauth: true
      };
    }
    
    throw error;
  }
};

/**
 * Busca usuarios por username o nombre
 * @param {string} query - Término de búsqueda
 * @param {string} token - Token de autenticación (opcional)
 * @returns {Promise<Array>} - Lista de usuarios encontrados
 */
export const searchUsers = async (query, token = null) => {
  try {
    console.log('🔍 [searchUsers] Buscando usuarios:', query);
    
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.get(
      `${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
      {
        headers,
        timeout: 10000
      }
    );
    
    console.log('✅ [searchUsers] Resultados:', response.data.users?.length || 0);
    
    // Transformar resultados
    const users = (response.data.users || response.data || []).map(user => ({
      id: user._id?.toString() || user.id?.toString(),
      _id: user._id || user.id,
      username: user.username || user.userName,
      name: user.name || user.nombre || user.username,
      avatar_url: user.avatar || user.avatar_url || user.profileImage,
      bio: user.bio || user.descripcion,
      followers_count: user.followersCount || user.seguidores || 0,
      following_count: user.followingCount || user.siguiendo || 0
    }));
    
    return users;
    
  } catch (error) {
    console.error('❌ [searchUsers] Error:', error.message);
    return [];
  }
};

/**
 * Obtiene usuarios sugeridos (para seguir)
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} - Lista de usuarios sugeridos
 */
export const getSuggestedUsers = async (token) => {
  try {
    console.log('👥 [getSuggestedUsers] Obteniendo usuarios sugeridos');
    
    if (!token) {
      console.warn('⚠️ [getSuggestedUsers] Sin token, retornando array vacío');
      return [];
    }
    
    const response = await axios.get(
      `${API_BASE_URL}/users/suggested`,
      {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      }
    );
    
    console.log('✅ [getSuggestedUsers] Sugerencias obtenidas:', response.data.users?.length || 0);
    
    // Transformar resultados
    const users = (response.data.users || response.data || []).map(user => ({
      id: user._id?.toString() || user.id?.toString(),
      _id: user._id || user.id,
      username: user.username || user.userName,
      name: user.name || user.nombre || user.username,
      avatar_url: user.avatar || user.avatar_url || user.profileImage,
      bio: user.bio || user.descripcion,
      followers_count: user.followersCount || user.seguidores || 0
    }));
    
    return users;
    
  } catch (error) {
    console.error('❌ [getSuggestedUsers] Error:', error.message);
    return [];
  }
};

export default {
  getUserProfile,
  getUserTweets,
  updateProfile,
  uploadAvatar,
  searchUsers,
  getSuggestedUsers
};