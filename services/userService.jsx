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
    
    console.log('✅ [getUserProfile] Perfil obtenido:', {
      status: response.status,
      username: response.data.username,
      tieneBio: !!response.data.bio
    });
    
    // Transformar datos para consistencia
    const userData = response.data;
    return {
      id: userData._id?.toString() || userData.id?.toString(),
      _id: userData._id || userData.id,
      username: userData.username || userData.userName,
      name: userData.name || userData.nombre || userData.username,
      email: userData.email,
      bio: userData.bio || userData.descripcion,
      avatar_url: userData.avatar || userData.avatar_url || userData.profileImage,
      location: userData.location || userData.ubicacion,
      website: userData.website || userData.sitioWeb,
      created_at: userData.createdAt || userData.created_at || userData.fecha_creacion,
      followers_count: userData.followersCount || userData.seguidores || 0,
      following_count: userData.followingCount || userData.siguiendo || 0,
      tweet_count: userData.tweetCount || userData.tweets_count || 0
    };
    
  } catch (error) {
    console.error('❌ [getUserProfile] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 404) {
      throw new Error('Usuario no encontrado');
    }
    
    if (error.response?.status === 401) {
      throw new Error('No autorizado para ver este perfil');
    }
    
    throw new Error('Error al cargar el perfil');
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
    console.log('📝 [updateProfile] Datos a actualizar:', profileData);
    console.log('🔐 [updateProfile] Token:', token ? `✅ (${token.length} chars)` : '❌ NO');
    
    if (!token) {
      throw {
        ok: false,
        status: 401,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    // Preparar datos para el backend
    const updateData = {};
    
    if (profileData.name !== undefined) {
      updateData.name = profileData.name;
    }
    
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio;
    }
    
    if (profileData.avatar_url !== undefined) {
      updateData.avatar = profileData.avatar_url;
    }
    
    if (profileData.location !== undefined) {
      updateData.location = profileData.location;
    }
    
    if (profileData.website !== undefined) {
      updateData.website = profileData.website;
    }
    
    console.log('📤 [updateProfile] Datos enviados al backend:', updateData);
    
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
    
    console.log('✅ [updateProfile] Perfil actualizado:', {
      status: response.status,
      data: response.data
    });
    
    // Transformar respuesta para consistencia
    const updatedUser = response.data.usuario || response.data.user || response.data;
    
    return {
      id: updatedUser._id?.toString() || updatedUser.id?.toString(),
      _id: updatedUser._id || updatedUser.id,
      username: updatedUser.username || updatedUser.userName,
      name: updatedUser.name || updatedUser.nombre || updatedUser.username,
      bio: updatedUser.bio || updatedUser.descripcion,
      avatar_url: updatedUser.avatar || updatedUser.avatar_url || updatedUser.profileImage,
      location: updatedUser.location || updatedUser.ubicacion,
      website: updatedUser.website || updatedUser.sitioWeb,
      message: response.data.message || 'Perfil actualizado exitosamente'
    };
    
  } catch (error) {
    console.error('❌ [updateProfile] Error completo:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        throw {
          ok: false,
          status: 401,
          message: 'Tu sesión ha expirado. Vuelve a iniciar sesión.',
          requiresReauth: true
        };
      }
      
      if (status === 403) {
        throw {
          ok: false,
          status: 403,
          message: 'No tienes permiso para actualizar este perfil',
          requiresReauth: false
        };
      }
      
      if (status === 400) {
        throw {
          ok: false,
          status: 400,
          message: errorData.message || 'Error de validación',
          errors: errorData.errores || errorData.errors || []
        };
      }
      
      if (status === 404) {
        throw {
          ok: false,
          status: 404,
          message: 'Usuario no encontrado'
        };
      }
      
      throw {
        ok: false,
        status: status,
        message: errorData?.message || `Error ${status} al actualizar perfil`
      };
    } else if (error.request) {
      throw {
        ok: false,
        status: 0,
        message: 'Error de conexión. Verifica tu internet.'
      };
    } else {
      throw {
        ok: false,
        status: -1,
        message: 'Error en la configuración de la solicitud'
      };
    }
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