import axios from 'axios';

const API_BASE_URL = 'https://apix-two.vercel.app/api';

// ==============================================
// SERVICIO PARA COMENTARIOS
// ==============================================

/**
 * Obtiene comentarios de un tweet
 */
export const getComments = async (tweetId) => {
  try {
    console.log('💬 [getComments] Obteniendo comentarios para tweet:', tweetId);
    
    const response = await axios.get(`${API_BASE_URL}/tweets/${tweetId}/comentarios`, {
      timeout: 10000
    });
    
    console.log('✅ [getComments] Respuesta recibida:', {
      status: response.status,
      tieneComentarios: !!response.data.comentarios,
      cantidad: response.data.comentarios?.length || 0
    });
    
    // Transformar datos para consistencia con el frontend
    const comments = (response.data.comentarios || []).map(comment => ({
      id: comment._id?.toString() || comment.id?.toString(),
      _id: comment._id || comment.id,
      content: comment.contenido || comment.content,
      contenido: comment.contenido || comment.content,
      user_id: comment.usuario?._id || comment.usuario?.id || comment.user_id,
      user: comment.usuario || comment.user,
      username: comment.usuario?.username || comment.username || comment.user?.username,
      avatar_url: comment.usuario?.avatar || comment.avatar_url || comment.avatar,
      created_at: comment.fecha || comment.created_at || comment.createdAt,
      updated_at: comment.updatedAt || comment.updated_at,
      editado: comment.editado || false,
      likes: comment.likes || [],
      likesCount: comment.likes?.length || 0
    }));
    
    console.log(`📊 [getComments] ${comments.length} comentarios transformados`);
    return comments;
    
  } catch (error) {
    console.error('❌ [getComments] Error completo:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 404) {
      console.log('📭 [getComments] No hay comentarios para este tweet o tweet no encontrado');
      return [];
    }
    
    // Si hay error de conexión o servidor, retornar array vacío
    return [];
  }
};

/**
 * Crea un nuevo comentario
 */
export const createComment = async (tweetId, content, token) => {
  try {
    console.log('📝 [createComment] Creando comentario para tweet:', tweetId);
    console.log('🔐 [createComment] Token disponible:', token ? `✅ (${token.length} chars)` : '❌ NO');
    
    if (!token) {
      throw {
        ok: false,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    if (!content || content.trim().length === 0) {
      throw {
        ok: false,
        message: 'El contenido del comentario es requerido'
      };
    }
    
    console.log('🔗 [createComment] URL:', `${API_BASE_URL}/tweets/${tweetId}/comentarios`);
    
    const response = await axios.post(
      `${API_BASE_URL}/tweets/${tweetId}/comentarios`,
      { contenido: content.trim(),
        tweetId: tweetId

      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ [createComment] Comentario creado:', {
      status: response.status,
      data: response.data
    });
    
    // Transformar la respuesta para consistencia
    if (response.data.comentario) {
      const comment = response.data.comentario;
      return {
        ok: true,
        message: response.data.message || 'Comentario creado exitosamente',
        comment: {
          id: comment._id?.toString() || comment.id?.toString(),
          _id: comment._id || comment.id,
          content: comment.contenido || comment.content,
          contenido: comment.contenido || comment.content,
          user_id: comment.usuario?._id || comment.usuario?.id,
          user: comment.usuario || comment.user,
          username: comment.usuario?.username || comment.username,
          avatar_url: comment.usuario?.avatar || comment.avatar,
          created_at: comment.fecha || comment.created_at,
          updated_at: comment.updatedAt || comment.updated_at
        }
      };
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [createComment] Error completo:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.config?.headers ? '...' : 'No headers'
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
      
      if (status === 404) {
        throw {
          ok: false,
          status: 404,
          message: 'Tweet no encontrado'
        };
      }
      
      if (status === 400) {
        throw {
          ok: false,
          status: 400,
          message: errorData.message || 'Error de validación',
          errors: errorData.errores || []
        };
      }
      
      throw {
        ok: false,
        status: status,
        message: errorData?.message || `Error ${status} al crear comentario`
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
 * Actualiza un comentario existente
 */
export const updateComment = async (tweetId, commentId, content, token) => {
  try {
    console.log('✏️ [updateComment] Actualizando comentario:', { tweetId, commentId });
    
    if (!token) {
      throw {
        ok: false,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    if (!content || content.trim().length === 0) {
      throw {
        ok: false,
        message: 'El contenido del comentario es requerido'
      };
    }
    
    console.log('🔗 [updateComment] URL:', `${API_BASE_URL}/tweets/${tweetId}/comentarios/${commentId}`);
    
    const response = await axios.put(
      `${API_BASE_URL}/tweets/${tweetId}/comentarios/${commentId}`,
      { contenido: content.trim() },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ [updateComment] Comentario actualizado:', response.status);
    
    // Transformar la respuesta para consistencia
    if (response.data.comentario) {
      const comment = response.data.comentario;
      return {
        ok: true,
        message: response.data.message || 'Comentario actualizado',
        comment: {
          id: comment._id?.toString() || comment.id?.toString(),
          _id: comment._id || comment.id,
          content: comment.contenido || comment.content,
          contenido: comment.contenido || comment.content,
          user_id: comment.usuario?._id || comment.usuario?.id,
          user: comment.usuario || comment.user,
          username: comment.usuario?.username || comment.username,
          avatar_url: comment.usuario?.avatar || comment.avatar,
          created_at: comment.fecha || comment.created_at,
          updated_at: comment.updatedAt || comment.updated_at,
          editado: comment.editado || true
        }
      };
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [updateComment] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        throw {
          ok: false,
          status: 401,
          message: 'No autorizado para editar este comentario',
          requiresReauth: true
        };
      }
      
      if (status === 403) {
        throw {
          ok: false,
          status: 403,
          message: 'No tienes permiso para editar este comentario'
        };
      }
      
      if (status === 404) {
        throw {
          ok: false,
          status: 404,
          message: 'Comentario no encontrado'
        };
      }
    }
    
    throw error;
  }
};

/**
 * Elimina un comentario
 */
export const deleteComment = async (tweetId, commentId, token) => {
  try {
    console.log('🗑️ [deleteComment] Eliminando comentario:', { tweetId, commentId });
    
    if (!token) {
      throw {
        ok: false,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    console.log('🔗 [deleteComment] URL:', `${API_BASE_URL}/tweets/${tweetId}/comentarios/${commentId}`);
    
    const response = await axios.delete(
      `${API_BASE_URL}/tweets/${tweetId}/comentarios/${commentId}`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ [deleteComment] Comentario eliminado:', response.status);
    return response.data;
    
  } catch (error) {
    console.error('❌ [deleteComment] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        throw {
          ok: false,
          status: 401,
          message: 'No autorizado para eliminar este comentario',
          requiresReauth: true
        };
      }
      
      if (status === 403) {
        throw {
          ok: false,
          status: 403,
          message: 'No tienes permiso para eliminar este comentario'
        };
      }
      
      if (status === 404) {
        throw {
          ok: false,
          status: 404,
          message: 'Comentario no encontrado'
        };
      }
    }
    
    throw error;
  }
};

/**
 * Da o quita like a un comentario
 */
export const toggleCommentLike = async (tweetId, commentId, token) => {
  try {
    console.log('❤️ [toggleCommentLike] Like/Unlike comentario:', { tweetId, commentId });
    
    if (!token) {
      throw {
        ok: false,
        message: 'Token no proporcionado',
        requiresReauth: true
      };
    }
    
    console.log('🔗 [toggleCommentLike] URL:', `${API_BASE_URL}/tweets/${tweetId}/comentarios/${commentId}/like`);
    
    const response = await axios.post(
      `${API_BASE_URL}/tweets/${tweetId}/comentarios/${commentId}/like`,
      {},
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ [toggleCommentLike] Respuesta:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ [toggleCommentLike] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      throw {
        ok: false,
        status: 401,
        message: 'No autorizado para dar like',
        requiresReauth: true
      };
    }
    
    throw error;
  }
};

// ==============================================
// SERVICIO PARA LIKES DE TWEETS
// ==============================================

export const toggleLike = async (tweetId, token) => {
  try {
    console.log('❤️ [toggleLike] Tweet ID:', tweetId);
    console.log('🔐 [toggleLike] Token:', token ? `✅ (${token.length} chars)` : '❌ NO');
    
    if (!token) {
      throw new Error('Token no proporcionado');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/tweets/${tweetId}/like`,
      {},
      {
        headers: { 
          Authorization: `Bearer ${token}`,
        }
      }
    );
    
    console.log('✅ [toggleLike] Status:', response.status);
    
    if (response.status === 200) {
      return {
        ok: true,
        liked: response.data.liked,
        likesCount: response.data.likes,
        message: 'Like actualizado'
      };
    } else {
      return {
        ok: false,
        message: 'Error al actualizar like',
        status: response.status
      };
    }
  } catch (error) {
    console.error('❌ [toggleLike] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        throw {
          ok: false,
          status: 401,
          message: 'Tu sesión ha expirado',
          requiresReauth: true
        };
      }
      
      throw {
        ok: false,
        status: status,
        message: error.response.data?.message || `Error ${status} al dar like`
      };
    }
    
    throw error;
  }
};

export default {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  toggleLike
};