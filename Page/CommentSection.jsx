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
      tokenLength: token?.length,
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

      // Normalizar: si la respuesta no trae el nombre del usuario pero
      // el comentario pertenece al usuario autenticado, usar sus datos.
      const normalized = (data || []).map(c => {
        const matchesCurrentUser = user && (
          c.user_id === user.id || c.user_id === user._id || c.user === user.id || c.user === user._id
        );

        if (matchesCurrentUser) {
          return {
            ...c,
            username: user.username || user.nombre || user.name || c.username || 'usuario',
            avatar_url: c.avatar_url || user.avatar || user.avatar_url || c.avatar || 'https://via.placeholder.com/40'
          };
        }

        return c;
      });

      setComments(normalized);
      
    } catch (error) {
      console.error("❌ [CommentSection] Error cargando comentarios:", error);
      
      // Mostrar alerta solo si no es un error de red o 404 esperado
      if (error.message && !error.message.includes('Network Error') && error.status !== 404) {
        Alert.alert('Error', 'No se pudieron cargar los comentarios');
      }
    } finally {
      setLoading(false);
      setLoadingComments(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    // Validación de token
    if (!token) {
      Alert.alert('Error', 'No estás autenticado. Inicia sesión para comentar.');
      return;
    }

    if (!tweetId) {
      Alert.alert('Error', 'No se puede comentar sin un tweet válido.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📝 [CommentSection] Creando comentario con:', {
        tweetId,
        tokenLength: token?.length,
        tieneToken: !!token,
        contenido: newComment.substring(0, 50)
      });
      
      const result = await createComment(tweetId, newComment, token);
      
      console.log('✅ [CommentSection] Resultado creación:', result);
      
      if (result.ok) {
        // Refrescar comentarios
        await fetchComments();
        setNewComment('');
        Alert.alert('Éxito', result.message || 'Comentario publicado');
        
        // Notificar al componente padre si es necesario
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        Alert.alert('Error', result.message || 'No se pudo publicar el comentario');
      }
      
    } catch (error) {
      console.error("❌ [CommentSection] Error publicando comentario:", error);
      
      // Mensajes de error específicos
      let errorMessage = 'No se pudo publicar el comentario';
      
      if (error.status === 401) {
        errorMessage = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
      } else if (error.status === 404) {
        errorMessage = 'El tweet no existe o fue eliminado';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Error de validación';
        if (error.errors && error.errors.length > 0) {
          errorMessage = error.errors[0];
        }
      } else if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
        errorMessage = 'Error de autenticación. Vuelve a iniciar sesión.';
      } else if (error.message?.includes('conexión') || error.message?.includes('internet')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
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
    if (!editContent.trim()) return;
    
    // Validación de token
    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }
    
    try {
      const result = await updateComment(tweetId, commentId, editContent, token);
      
      console.log('✅ [CommentSection] Resultado actualización:', result);
      
      if (result.ok) {
        // Actualizar estado local
        setComments(comments.map(c => 
          c.id === commentId ? result.comment : c
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
              await deleteComment(tweetId, commentId, token);
              
              // Eliminar del estado local
              setComments(comments.filter(c => c.id !== commentId));
              Alert.alert('Éxito', 'Comentario eliminado');
              
              // Notificar al componente padre si es necesario
              if (onCommentAdded) {
                onCommentAdded();
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
      
      if (result.ok) {
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
      {/* DEPURACIÓN - Solo en desarrollo */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Tweet ID: {tweetId || 'No disponible'}</Text>
          <Text style={styles.debugText}>Token: {token ? '✅ Disponible' : '❌ No disponible'}</Text>
          <Text style={styles.debugText}>Comentarios: {comments.length}</Text>
        </View>
      )}

      {/* Comment Form */}
      <View style={styles.formContainer}>
        <Image 
          source={{ uri: user?.avatar || user?.avatar_url || 'https://via.placeholder.com/40' }} 
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
                  uri: comment.avatar_url || comment.user?.avatar || 'https://via.placeholder.com/40' 
                }} 
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUserInfo}>
                    <Text style={styles.commentUsername}>
                      @{comment.username || comment.user?.username || 'usuario'}
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
                    {user && user.id === comment.user_id && editingCommentId !== comment.id && (
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

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  debugInfo: {
    backgroundColor: '#F5F8FA',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  debugText: {
    fontSize: 11,
    color: '#657786',
    fontFamily: 'monospace',
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