import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { getComments, createComment, updateComment, deleteComment, toggleCommentLike } from '../services/interactionService';
import { AuthContext } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

function CommentSection({ tweetId, onCommentAdded }) {
  const { user, token } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Edit State
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [likingCommentId, setLikingCommentId] = useState(null);

  useEffect(() => {
    console.log('💬 [CommentSection] Inicializado con:', {
      tweetId,
      tieneToken: !!token,
      usuario: user?.username
    });

    if (!tweetId || tweetId === 'undefined') {
      console.error('🚨 [CommentSection] ERROR: tweetId inválido:', tweetId);
      setLoading(false);
      return;
    }

    fetchComments();
  }, [tweetId]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      console.log('📡 [CommentSection] Solicitando comentarios para tweet:', tweetId);
      
      const data = await getComments(tweetId);
      console.log('✅ [CommentSection] Comentarios recibidos:', data.length);

      // Normalizar comentarios
      const normalized = (data || []).map(c => {
        // Verificar si el comentario es del usuario actual
        const userMatches = user && (
          c.user_id === user.id || 
          c.user_id === user._id || 
          c.user === user.id || 
          c.user === user._id ||
          (c.user && (c.user.id === user.id || c.user._id === user._id))
        );

        return {
          id: c.id || c._id,
          _id: c._id || c.id,
          content: c.content || c.contenido || '',
          user_id: c.user_id || c.usuario?._id || c.usuario?.id || c.user?.id || c.user?._id,
          username: c.username || c.usuario?.username || c.usuario?.usuario || c.user?.username || 'usuario',
          avatar_url: c.avatar_url || c.usuario?.avatar || c.usuario?.avatar_url || c.user?.avatar_url || c.user?.avatar || 'https://via.placeholder.com/40',
          created_at: c.created_at || c.createdAt,
          editado: c.editado || c.edited || false,
          liked: c.liked || false,
          likesCount: c.likesCount || c.likes?.length || 0,
          user: c.usuario || c.user || {}
        };
      });

      setComments(normalized);
      
    } catch (error) {
      console.error("❌ [CommentSection] Error cargando comentarios:", error);
      
      if (error.message && !error.message.includes('Network Error') && error.status !== 404) {
        Alert.alert('Error', 'No se pudieron cargar los comentarios');
      }
    } finally {
      setLoading(false);
      setLoadingComments(false);
    }
  };

  // ✅ CORREGIDO: Función para crear comentario
  const handleSubmit = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión para comentar');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Usuario no identificado');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📤 [CommentSection] Creando comentario...');
      
      const result = await createComment(tweetId, newComment.trim(), token);
      
      console.log('✅ [CommentSection] Resultado:', result);
      
      if (result.ok || result.success) {
        // Crear objeto de comentario para agregar a la lista
        const newCommentObj = {
          id: result.comment?.id || result.comment?._id,
          _id: result.comment?._id || result.comment?.id,
          content: newComment.trim(),
          contenido: newComment.trim(),
          user_id: user.id || user._id,
          username: user.username || user.usuario || 'usuario',
          avatar_url: user.avatar_url || user.avatar || 'https://via.placeholder.com/40',
          created_at: new Date().toISOString(),
          editado: false,
          liked: false,
          likesCount: 0,
          user: user
        };
        
        // Agregar al principio de la lista
        setComments(prev => [newCommentObj, ...prev]);
        setNewComment('');
        
        // Notificar al componente padre
        if (onCommentAdded) {
          onCommentAdded();
        }
        
        Alert.alert('Éxito', 'Comentario publicado');
      } else {
        Alert.alert('Error', result.message || 'No se pudo publicar el comentario');
      }
    } catch (error) {
      console.error("❌ [CommentSection] Error creando comentario:", error);
      
      let errorMessage = 'No se pudo publicar el comentario';
      if (error.status === 401) {
        errorMessage = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
      } else if (error.status === 404) {
        errorMessage = 'Tweet no encontrado';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdate = async (commentId) => {
    if (!editContent.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }
    
    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }
    
    try {
      console.log('✏️ [CommentSection] Actualizando comentario:', commentId);
      
      const result = await updateComment(tweetId, commentId, editContent, token);
      
      console.log('✅ [CommentSection] Resultado actualización:', result);
      
      if (result.ok || result.success) {
        // Actualizar estado local
        setComments(comments.map(c => 
          c.id === commentId ? {
            ...c,
            content: editContent,
            contenido: editContent,
            editado: true
          } : c
        ));
        setEditingCommentId(null);
        Alert.alert('Éxito', result.message || 'Comentario actualizado');
      } else {
        Alert.alert('Error', result.message || 'No se pudo actualizar el comentario');
      }
    } catch (error) {
      console.error("❌ [CommentSection] Error actualizando comentario:", error);
      
      let errorMessage = 'No se pudo actualizar el comentario';
      if (error.status === 401) {
        errorMessage = 'Tu sesión ha expirado';
      } else if (error.status === 403) {
        errorMessage = 'No autorizado para editar este comentario';
      } else if (error.status === 404) {
        errorMessage = 'Comentario no encontrado';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Eliminar comentario',
      '¿Estás seguro de eliminar este comentario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingCommentId(commentId);
            try {
              const result = await deleteComment(tweetId, commentId, token);
              
              console.log('✅ [CommentSection] Resultado eliminación:', result);
              
              if (result.ok || result.success) {
                // Eliminar del estado local
                setComments(comments.filter(c => c.id !== commentId));
                Alert.alert('Éxito', result.message || 'Comentario eliminado');
                
                // Notificar al componente padre si es necesario
                if (onCommentAdded) {
                  onCommentAdded();
                }
              } else {
                Alert.alert('Error', result.message || 'No se pudo eliminar el comentario');
              }
            } catch (error) {
              console.error("❌ [CommentSection] Error eliminando comentario:", error);
              
              let errorMessage = 'No se pudo eliminar el comentario';
              if (error.status === 401) {
                errorMessage = 'Tu sesión ha expirado';
              } else if (error.status === 403) {
                errorMessage = 'No autorizado para eliminar este comentario';
              } else if (error.status === 404) {
                errorMessage = 'Comentario no encontrado';
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Error', errorMessage);
            } finally {
              setDeletingCommentId(null);
            }
          }
        }
      ]
    );
  };

  const handleLikeComment = async (commentId) => {
    if (!token) {
      Alert.alert('Error', 'Inicia sesión para dar like');
      return;
    }
    
    setLikingCommentId(commentId);
    try {
      const result = await toggleCommentLike(tweetId, commentId, token);
      
      console.log('✅ [CommentSection] Resultado like:', result);
      
      if (result.ok || result.success) {
        // Actualizar estado local
        setComments(comments.map(c => {
          if (c.id === commentId) {
            const newLikesCount = result.liked ? (c.likesCount || 0) + 1 : Math.max((c.likesCount || 0) - 1, 0);
            return {
              ...c,
              liked: result.liked,
              likesCount: newLikesCount
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error("❌ [CommentSection] Error dando like:", error);
      
      let errorMessage = 'No se pudo dar like al comentario';
      if (error.status === 401) {
        errorMessage = 'Tu sesión ha expirado';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLikingCommentId(null);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Ahora';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays < 7) return `Hace ${diffDays} d`;
      
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const refreshComments = async () => {
    await fetchComments();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#657786" />
        <Text style={styles.loadingText}>Cargando comentarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Comment Form */}
      <View style={styles.formContainer}>
        <Image 
          source={{ uri: user?.avatar_url || user?.avatar || 'https://via.placeholder.com/40' }} 
          style={styles.avatar}
        />
        <View style={styles.inputContainer}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Escribe una respuesta..."
            placeholderTextColor="#657786"
            style={styles.input}
            multiline
            maxLength={280}
            editable={!submitting && !!token}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            blurOnSubmit={true}
          />
          <Text style={styles.charCount}>{newComment.length}/280</Text>
        </View>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!newComment.trim() || submitting || !token}
          style={[
            styles.submitButton, 
            (!newComment.trim() || submitting || !token) && styles.submitButtonDisabled
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {token ? 'Responder' : 'Inicia sesión'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        onPress={refreshComments} 
        style={styles.refreshButton}
        disabled={loadingComments}
      >
        <Icon name="refresh-cw" size={14} color="#1DA1F2" />
        <Text style={styles.refreshText}>
          {loadingComments ? 'Actualizando...' : 'Actualizar comentarios'}
        </Text>
      </TouchableOpacity>

      {/* Comments List */}
      {loadingComments ? (
        <View style={styles.loadingComments}>
          <ActivityIndicator size="small" color="#657786" />
          <Text style={styles.loadingText}>Actualizando comentarios...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="message-circle" size={32} color="#CCD6DD" />
          <Text style={styles.emptyText}>No hay comentarios todavía</Text>
          <Text style={styles.emptySubtext}>Sé el primero en comentar</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        >
          {comments.map(comment => (
            <View key={comment.id} style={styles.commentContainer}>
              <Image 
                source={{ 
                  uri: comment.avatar_url || 'https://via.placeholder.com/40' 
                }} 
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUserInfo}>
                    <Text style={styles.commentUsername}>
                      @{comment.username}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatTime(comment.created_at)}
                      {comment.editado && <Text style={styles.editedText}> · editado</Text>}
                    </Text>
                  </View>
                  
                  {/* Comment Actions */}
                  <View style={styles.commentActions}>
                    {/* Like Button */}
                    <TouchableOpacity 
                      onPress={() => handleLikeComment(comment.id)}
                      disabled={likingCommentId === comment.id}
                      style={styles.likeButton}
                    >
                      {likingCommentId === comment.id ? (
                        <ActivityIndicator size="small" color="#E0245E" />
                      ) : (
                        <Icon 
                          name="heart" 
                          size={14} 
                          color={comment.liked ? '#E0245E' : '#657786'} 
                        />
                      )}
                      {comment.likesCount > 0 && (
                        <Text style={[
                          styles.likeCount,
                          comment.liked && styles.likedCount
                        ]}>
                          {comment.likesCount}
                        </Text>
                      )}
                    </TouchableOpacity>
                    
                    {/* Edit/Delete (solo para dueño) */}
                    {user && (user.id === comment.user_id || user._id === comment.user_id) && editingCommentId !== comment.id && (
                      <>
                        <TouchableOpacity 
                          onPress={() => startEditing(comment)}
                          style={styles.commentActionButton}
                        >
                          <Icon name="edit-2" size={14} color="#657786" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDeleteComment(comment.id)}
                          style={styles.commentActionButton}
                          disabled={deletingCommentId === comment.id}
                        >
                          {deletingCommentId === comment.id ? (
                            <ActivityIndicator size="small" color="#E0245E" />
                          ) : (
                            <Icon name="trash-2" size={14} color="#E0245E" />
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                
                {/* Edit Form or Comment Content */}
                {editingCommentId === comment.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      value={editContent}
                      onChangeText={setEditContent}
                      style={styles.editInput}
                      multiline
                      autoFocus
                      maxLength={280}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        onPress={cancelEditing}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleUpdate(comment.id)}
                        disabled={!editContent.trim()}
                        style={[styles.saveButton, !editContent.trim() && styles.saveButtonDisabled]}
                      >
                        <Text style={styles.saveButtonText}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.commentText}>{comment.content}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ✅ ESTILOS (mantén los mismos que ya tienes)
const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingComments: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    color: '#657786',
    fontSize: 14,
  },
  formContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
    marginRight: 12,
    position: 'relative',
  },
  input: {
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 30,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontSize: 12,
    color: '#657786',
  },
  submitButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCD6DD',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#1DA1F2',
    fontWeight: '500',
  },
  commentsList: {
    maxHeight: 400,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#14171A',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#657786',
  },
  commentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#14171A',
  },
  commentTime: {
    fontSize: 12,
    color: '#657786',
    marginTop: 2,
  },
  editedText: {
    fontSize: 11,
    color: '#AAB8C2',
    fontStyle: 'italic',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 4,
  },
  likeCount: {
    fontSize: 12,
    color: '#657786',
    marginLeft: 2,
  },
  likedCount: {
    color: '#E0245E',
    fontWeight: '600',
  },
  commentActionButton: {
    padding: 4,
    marginLeft: 4,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: '#1DA1F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#657786',
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#8ED0F9',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    color: '#14171A',
    lineHeight: 18,
  },
});

export default CommentSection;