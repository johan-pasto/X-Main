// componentes/TweetCard.jsx - Versión React Native
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleLike, deleteTweet } from '../services/tweetService';
import { AuthContext } from '../context/AuthContext';

const TweetCard = ({ tweet, onDelete }) => {
  const { user } = useContext(AuthContext);
  const [liked, setLiked] = useState(tweet.isLiked || false);
  const [likeCount, setLikeCount] = useState(tweet.likesCount || 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLike = async () => {
    if (isLikeLoading) return;
    
    const previousLiked = liked;
    const previousCount = likeCount;
    
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setIsLikeLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      await toggleLike(tweet.id, token);
    } catch (error) {
      // Revert on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      Alert.alert('Error', 'No se pudo dar like');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar Tweet',
      '¿Estás seguro de que quieres eliminar este tweet?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await deleteTweet(tweet.id, token);
              
              if (response.ok && onDelete) {
                onDelete(tweet.id);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el tweet');
              setIsDeleting(false);
            }
          }
        }
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

  if (isDeleting) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: tweet.user?.avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{tweet.user?.username || 'usuario'}</Text>
          <Text style={styles.time}>{formatDate(tweet.createdAt)}</Text>
        </View>
        
        {user && user.id === tweet.user?.id && !isEditing && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
              <Icon name="edit" size={16} color="#657786" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Icon name="trash" size={16} color="#657786" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            value={editContent}
            onChangeText={setEditContent}
            style={styles.editInput}
            multiline
            numberOfLines={3}
          />
          <View style={styles.editButtons}>
            <TouchableOpacity 
              onPress={() => {
                setIsEditing(false);
                setEditContent(tweet.content);
              }}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                // Implementar updateTweet si lo tienes
                setIsEditing(false);
              }}
              style={[styles.button, styles.saveButton]}
              disabled={isSaving || !editContent.trim()}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.content}>{tweet.content}</Text>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => setShowComments(!showComments)}
        >
          <Icon name="comment" size={18} color="#657786" />
          <Text style={styles.footerText}>Comentar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={handleLike}
          disabled={isLikeLoading}
        >
          <Icon 
            name="heart" 
            size={18} 
            color={liked ? '#E0245E' : '#657786'} 
          />
          <Text style={[styles.footerText, liked && styles.likedText]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Aquí podrías agregar CommentSection si lo tienes */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    color: '#14171A',
    fontSize: 15,
  },
  time: {
    color: '#657786',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
    padding: 5,
  },
  content: {
    fontSize: 16,
    color: '#14171A',
    lineHeight: 22,
    marginBottom: 10,
  },
  editContainer: {
    marginBottom: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#F5F8FA',
  },
  cancelButtonText: {
    color: '#657786',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1DA1F2',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F8FA',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  footerText: {
    marginLeft: 5,
    color: '#657786',
    fontSize: 14,
  },
  likedText: {
    color: '#E0245E',
  },
});

export default TweetCard;