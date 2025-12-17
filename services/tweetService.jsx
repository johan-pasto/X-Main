import axios from 'axios'; 

const API_CONFIG = {
  baseURL: 'https://apix-two.vercel.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const api = axios.create(API_CONFIG);

// ============================
// INTERCEPTOR PARA LOGS
// ============================
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 [axios] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.headers.Authorization) {
      console.log(`🔐 [axios] Token incluido: ${config.headers.Authorization.substring(0, 30)}...`);
    }
    return config;
  },
  (error) => {
    console.error('❌ [axios] Error en request:', error);
    return Promise.reject(error);
  }
);

// ============================
// FUNCIONES AUXILIARES
// ============================

const extractTweetId = (tweet) => {
  console.log('🔍 [extractTweetId] Buscando ID en tweet:', {
    id: tweet.id,
    _id: tweet._id,
    tweetId: tweet.tweetId,
    keys: Object.keys(tweet)
  });
  
  // Prioridad de búsqueda del ID
  if (tweet.id && tweet.id !== 'undefined') {
    return tweet.id.toString();
  }
  if (tweet._id && tweet._id !== 'undefined') {
    return tweet._id.toString();
  }
  if (tweet.tweetId && tweet.tweetId !== 'undefined') {
    return tweet.tweetId.toString();
  }
  if (tweet.user?._id && tweet.user._id !== 'undefined') {
    return tweet.user._id.toString();
  }
  
  console.error('🚨 [extractTweetId] NO se encontró ID válido');
  return null;
};

const extractUserId = (usuario) => {
  if (!usuario) return 'unknown';
  
  if (typeof usuario === 'object') {
    return usuario._id || usuario.id || 'unknown';
  }
  
  return 'unknown';
};

// ============================
// SERVICIO PARA TWEETS
// ============================

export const getFeed = async (token) => {
  try {
    console.log('📤 [getFeed] Obteniendo feed...');
    
    const response = await api.get('/tweets', {
      headers: { 
        Authorization: `Bearer ${token}`,
      }
    });
    
    console.log('✅ [getFeed] Status:', response.status);
    console.log('📊 [getFeed] Cantidad de tweets:', response.data.tweets?.length || 0);
    
    if (response.status === 200) {
      // LOG CRÍTICO: Ver estructura de la API
      if (response.data.tweets && response.data.tweets.length > 0) {
        console.log('🔍 [getFeed] Primer tweet crudo:', {
          ...response.data.tweets[0],
          // Omitir datos largos para mejor legibilidad
          contenido: response.data.tweets[0].contenido?.substring(0, 50),
          content: response.data.tweets[0].content?.substring(0, 50),
          text: response.data.tweets[0].text?.substring(0, 50)
        });
        console.log('🔑 [getFeed] Keys del primer tweet:', Object.keys(response.data.tweets[0]));
      }
      
      const processedTweets = (response.data.tweets || []).map((tweet, index) => {
        // Extraer ID primero
        const tweetId = extractTweetId(tweet);
        
        if (!tweetId) {
          console.error(`🚨 [getFeed] Tweet ${index} sin ID válido, usando temporal`);
        }
        
        const contenido = tweet.contenido || tweet.content || tweet.text || '';
        const usuario = tweet.usuario || tweet.user || tweet.author;
        
        let username = 'usuario';
        let name = 'Usuario';
        
        if (usuario) {
          if (typeof usuario === 'object') {
            username = usuario.usuario || usuario.username || 'usuario';
            name = usuario.nombre || usuario.name || 'Usuario';
          } else if (typeof usuario === 'string') {
            username = usuario;
          }
        }
        
        const likes = tweet.likes || [];
        const likesCount = tweet.likesCount || likes.length || 0;
        
        const processedTweet = {
          id: tweetId || `temp_${Date.now()}_${index}`, // ID es CRÍTICO
          _id: tweet._id || tweetId || `temp_${Date.now()}_${index}`,
          
          content: contenido,
          text: contenido,
          contenido: contenido, // Mantener también en español
          
          user: {
            id: extractUserId(usuario),
            username: username,
            name: name,
            avatar: usuario?.avatar || null
          },
          
          createdAt: tweet.fecha || tweet.createdAt || tweet.created_at || new Date().toISOString(),
          
          likes: likes,
          likesCount: likesCount,
          liked_by_me: tweet.liked_by_me || tweet.likedByMe || false,
          
          comments: tweet.comentarios || tweet.comments || [],
          commentsCount: tweet.commentsCount || tweet.comment_count || 0,
          
          isOwnTweet: tweet.isOwnTweet || false
        };
        
        console.log(`✅ [getFeed] Tweet ${index} procesado:`, {
          id: processedTweet.id,
          contenido: contenido.substring(0, 30),
          username: processedTweet.user.username
        });
        
        return processedTweet;
      });
      
      // Verificar que todos los tweets tengan ID
      const tweetsSinId = processedTweets.filter(t => t.id.startsWith('temp_'));
      if (tweetsSinId.length > 0) {
        console.warn(`⚠️ [getFeed] ${tweetsSinId.length} tweets sin ID válido`);
      }
      
      return {
        ok: true,
        tweets: processedTweets,
        count: processedTweets.length,
        message: 'Feed obtenido exitosamente'
      };
    } else {
      return {
        ok: false,
        message: `Error ${response.status} al obtener el feed`,
        status: response.status
      };
    }
  } catch (error) {
    console.error('❌ [getFeed] Error:', error.message);
    
    if (error.response) {
      console.error('❌ [getFeed] Error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      return {
        ok: false,
        message: error.response.data?.message || `Error del servidor: ${error.response.status}`,
        status: error.response.status,
        error: error.response.data
      };
    } else if (error.request) {
      return {
        ok: false,
        message: 'Error de conexión. Verifica que el servidor esté corriendo.',
        status: 0
      };
    } else {
      return {
        ok: false,
        message: 'Error en la configuración de la solicitud',
        status: -1
      };
    }
  }
};

export const createTweet = async (content, token) => {
  try {
    console.log('📤 [createTweet] Creando tweet...');
    
    const response = await api.post('/tweets', 
      { contenido: content },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
        }
      }
    );
    
    console.log('✅ [createTweet] Status:', response.status);
    console.log('🔍 [createTweet] Respuesta:', response.data);
    
    if (response.status === 201) {
      const tweetData = response.data.tweet || response.data;
      
      // Extraer ID del tweet creado
      const tweetId = extractTweetId(tweetData);
      
      if (!tweetId) {
        console.error('🚨 [createTweet] Tweet creado sin ID válido');
      }
      
      const processedTweet = {
        id: tweetId || `new_${Date.now()}`,
        _id: tweetData._id || tweetId || `new_${Date.now()}`,
        
        content: tweetData.contenido || tweetData.content || content,
        text: tweetData.contenido || tweetData.content || content,
        contenido: tweetData.contenido || tweetData.content || content,
        
        user: tweetData.usuario || tweetData.user || {
          id: 'current-user',
          username: 'Yo',
          name: 'Usuario Actual'
        },
        
        createdAt: tweetData.fecha || tweetData.createdAt || new Date().toISOString(),
        
        likes: [],
        likesCount: 0,
        liked_by_me: false,
        
        comments: [],
        commentsCount: 0,
        
        isOwnTweet: true
      };
      
      return {
        ok: true,
        tweet: processedTweet,
        message: 'Tweet creado exitosamente'
      };
    } else {
      return {
        ok: false,
        message: `Error ${response.status} al crear tweet`,
        status: response.status
      };
    }
  } catch (error) {
    console.error('❌ [createTweet] Error:', error.message);
    
    if (error.response) {
      const errorData = error.response.data;
      let userMessage = 'Error al crear tweet';
      
      if (errorData?.message?.includes('280 caracteres')) {
        userMessage = 'El tweet no puede tener más de 280 caracteres';
      } else if (errorData?.message?.includes('contenido') || errorData?.message?.includes('requerido')) {
        userMessage = 'El contenido del tweet es requerido';
      } else if (error.response.status === 401) {
        userMessage = 'No autorizado. Tu sesión pudo haber expirado.';
      }
      
      return {
        ok: false,
        message: userMessage,
        status: error.response.status,
        requiresReauth: error.response.status === 401
      };
    }
    
    return {
      ok: false,
      message: 'Error de conexión al crear tweet',
      status: 0
    };
  }
};

export const toggleLike = async (tweetId, token) => {
  try {
    console.log('❤️ [toggleLike] Tweet ID:', tweetId);
    console.log('🔐 [toggleLike] Token:', token ? `✅ (${token.length} chars)` : '❌ NO');
    
    if (!token) {
      throw new Error('Token no proporcionado');
    }
    
    if (!tweetId || tweetId.startsWith('temp_') || tweetId.startsWith('new_')) {
      console.warn('⚠️ [toggleLike] Tweet ID temporal, omitiendo petición');
      throw {
        ok: false,
        message: 'Tweet temporal, no se puede dar like',
        status: 400
      };
    }
    
    const response = await api.post(`/tweets/${tweetId}/like`, 
      {},
      {
        headers: { 
          Authorization: `Bearer ${token}`,
        }
      }
    );
    
    console.log('✅ [toggleLike] Status:', response.status);
    console.log('🎯 [toggleLike] Respuesta:', response.data);
    
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
      const errorData = error.response.data;
      
      if (status === 401) {
        console.error('🔐 [toggleLike] ERROR 401: Token inválido o expirado');
        
        throw {
          ok: false,
          status: 401,
          message: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
          requiresReauth: true
        };
      }
      
      if (status === 404) {
        throw {
          ok: false,
          status: 404,
          message: 'El tweet no existe o fue eliminado'
        };
      }
      
      throw {
        ok: false,
        status: status,
        message: errorData?.message || `Error ${status} al dar like`
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
        message: 'Error en la solicitud'
      };
    }
  }
};

export const deleteTweet = async (tweetId, token) => {
  try {
    console.log('🗑️ [deleteTweet] Eliminando tweet:', tweetId);
    
    if (!tweetId || tweetId.startsWith('temp_') || tweetId.startsWith('new_')) {
      console.warn('⚠️ [deleteTweet] Tweet ID temporal, omitiendo petición');
      throw {
        ok: false,
        message: 'Tweet temporal, no se puede eliminar',
        status: 400
      };
    }
    
    const response = await api.delete(`/tweets/${tweetId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      }
    });
    
    if (response.status === 200) {
      console.log('✅ [deleteTweet] Tweet eliminado');
      return {
        ok: true,
        message: 'Tweet eliminado exitosamente'
      };
    } else {
      return {
        ok: false,
        message: 'Error al eliminar tweet',
        status: response.status
      };
    }
  } catch (error) {
    console.error('❌ [deleteTweet] Error:', error.message);
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        throw {
          ok: false,
          status: 401,
          message: 'No autorizado para eliminar este tweet',
          requiresReauth: true
        };
      }
      
      throw {
        ok: false,
        status: status,
        message: `Error ${status} al eliminar tweet`
      };
    }
    
    throw {
      ok: false,
      message: 'Error de conexión al eliminar tweet',
      status: 0
    };
  }
};

export default {
  getFeed,
  createTweet,
  toggleLike,
  deleteTweet
};