import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { toggleLike, deleteTweet } from '../services/tweetService';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import CommentSection from './CommentSection';
import Icon from 'react-native-vector-icons/Feather';

export default function TweetCard({ tweet, onDelete, onRefresh }) {
  const navigation = useNavigation();
  const { user, token, logout } = useContext(AuthContext);
  const [liked, setLiked] = useState(tweet.liked_by_me || false);
  const [likeCount, setLikeCount] = useState(tweet.likesCount || tweet.like_count || 0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // DEPURACIÓN - Agrega esto para verificar
  React.useEffect(() => {
    console.log('🔍 [TweetCard] Tweet recibido:', {
      id: tweet?.id,
      _id: tweet?._id,
      tieneId: !!tweet?.id || !!tweet?._id,
      todasLasKeys: tweet ? Object.keys(tweet) : 'NO HAY TWEET',
      contenidoPreview: tweet?.content?.substring(0, 30) || tweet?.contenido?.substring(0, 30)
    });
  }, [tweet]);

  const handleLike = async () => {
    console.log('❤️ [TweetCard] handleLike llamado');
    console.log('🔐 [TweetCard] Token disponible:', !!token);
    console.log('🆔 [TweetCard] Tweet ID para like:', tweet?.id || tweet?._id);
    
    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }
    
    if (loading) return;
    
    const tweetId = tweet.id || tweet._id;
    if (!tweetId) {
      Alert.alert('Error', 'Tweet ID no válido');
      return;
    }
    
    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic update
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setLoading(true);

    try {
      const result = await toggleLike(tweetId, token);
      
      if (result.ok) {
        console.log('✅ [TweetCard] Like exitoso');
        // Sincronizar con datos reales del servidor
        if (result.liked !== undefined) {
          setLiked(result.liked);
        }
        if (result.likesCount !== undefined) {
          setLikeCount(result.likesCount);
        }
      } else {
        // Revertir si falló
        setLiked(prevLiked);
        setLikeCount(prevCount);
        
        Alert.alert('Error', result.message || 'No se pudo dar like');
      }
    } catch (error) {
      console.error('❌ [TweetCard] Error completo:', error);
      
      // Revertir UI
      setLiked(prevLiked);
      setLikeCount(prevCount);
      
      if (error.requiresReauth || error.status === 401) {
        Alert.alert(
          'Sesión expirada',
          error.message || 'Tu sesión ha expirado',
          [
            { 
              text: 'OK', 
              onPress: () => {
                if (logout) logout();
                navigation.navigate('Inicio');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'No se pudo dar like');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const tweetId = tweet.id || tweet._id;
    if (!tweetId) {
      Alert.alert('Error', 'Tweet ID no válido');
      return;
    }
    
    Alert.alert(
      'Eliminar tweet',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteTweet(tweetId, token);
              
              if (onDelete) {
                onDelete(tweetId);
              }
              
              if (onRefresh) {
                onRefresh();
              }
              
              Alert.alert('Éxito', 'Tweet eliminado');
            } catch (error) {
              console.error('❌ [TweetCard] Error eliminando:', error);
              
              if (error.requiresReauth || error.status === 401) {
                Alert.alert(
                  'Sesión expirada',
                  error.message || 'Tu sesión ha expirado',
                  [
                    { 
                      text: 'OK', 
                      onPress: () => {
                        if (logout) logout();
                        navigation.navigate('Inicio');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', error.message || 'No se pudo eliminar el tweet');
              }
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
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

  if (deleting) {
    return (
      <View style={[styles.card, styles.deletingCard]}>
        <ActivityIndicator size="small" color="#1DA1F2" />
        <Text style={styles.deletingText}>Eliminando tweet...</Text>
      </View>
    );
  }

  // Obtener el ID del tweet (priorizar id, luego _id)
  const tweetId = tweet.id || tweet._id;

  return (
    <View style={styles.card}>
      {/* Header con avatar e información del usuario */}
      <View style={styles.header}>
        <Image
          source={{
            uri: tweet.user?.avatar || tweet.avatar_url || 'https://via.placeholder.com/40',
          }}
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{tweet.user?.username || tweet.username || 'usuario'}</Text>
          <Text style={styles.timestamp}>{formatDate(tweet.createdAt || tweet.created_at)}</Text>
        </View>
        
        {/* Botón de eliminar (solo para tweets propios) */}
        {user && user.id === tweet.user?.id && (
          <TouchableOpacity 
            onPress={handleDelete}
            style={styles.deleteButton}
            disabled={deleting}
          >
            <Icon name="trash-2" size={16} color="#E0245E" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Contenido del tweet */}
      <Text style={styles.content}>{tweet.content || tweet.contenido || tweet.text}</Text>
      
      {/* Estadísticas del tweet */}
      <View style={styles.stats}>
        {likeCount > 0 && (
          <View style={styles.statItem}>
            <Icon name="heart" size={14} color="#E0245E" />
            <Text style={styles.statText}>{likeCount}</Text>
          </View>
        )}
        
        {tweet.commentsCount > 0 && (
          <View style={styles.statItem}>
            <Icon name="message-circle" size={14} color="#1DA1F2" />
            <Text style={styles.statText}>{tweet.commentsCount}</Text>
          </View>
        )}
      </View>
      
      {/* Botones de acción */}
      <View style={styles.actions}>
        {/* Botón de comentarios */}
        <TouchableOpacity 
          onPress={() => {
            console.log('💬 Mostrando/ocultando comentarios para tweetId:', tweetId);
            setShowComments(!showComments);
          }}
          style={[styles.actionButton, showComments && styles.activeActionButton]}
        >
          <Icon 
            name="message-circle" 
            size={20} 
            color={showComments ? '#1DA1F2' : '#657786'} 
          />
          <Text style={[
            styles.actionText,
            showComments && styles.activeActionText
          ]}>
            Comentar
          </Text>
        </TouchableOpacity>
        
        {/* Botón de like */}
        <TouchableOpacity 
          onPress={handleLike}
          style={[styles.actionButton, liked && styles.activeActionButton]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={liked ? '#E0245E' : '#657786'} />
          ) : (
            <>
              <Icon 
                name="heart" 
                size={20} 
                color={liked ? '#E0245E' : '#657786'} 
              />
              <Text style={[
                styles.actionText,
                liked && styles.likedText
              ]}>
                {liked ? 'Te gusta' : 'Me gusta'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Sección de comentarios (condicional) */}
      {showComments && tweetId && (
        <CommentSection 
          tweetId={tweetId}
          onCommentAdded={() => {
            console.log('🔄 Comentario añadido, refrescando...');
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E1E8ED',
  },
  deletingCard: {
    opacity: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  deletingText: {
    marginLeft: 10,
    color: '#657786',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#14171A',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#657786',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FCE8E8',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#14171A',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F8FA',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#657786',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F8FA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeActionButton: {
    backgroundColor: '#F5F8FA',
  },
  actionText: {
    fontSize: 14,
    color: '#657786',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeActionText: {
    color: '#1DA1F2',
  },
  likedText: {
    color: '#E0245E',
  },
});