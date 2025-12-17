import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getUserProfile, getUserTweets, updateProfile } from '../services/userService';
import TweetCard from './TweetCard';
import Icon from 'react-native-vector-icons/Feather';

function Profile({ route, navigation }) {
  // Obtener userId de los parámetros de navegación
  const { userId, userData: initialUserData } = route.params || {};
  const { user: currentUser, token } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    bio: '', 
    avatar_url: '', 
    name: '' 
  });

  useEffect(() => {
    console.log('🎯 Profile montado con:');
    console.log('• userId:', userId);
    console.log('• initialUserData:', initialUserData);
    console.log('• currentUser:', currentUser);

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Si ya tenemos datos iniciales del usuario, usarlos
        if (initialUserData && initialUserData.id === userId) {
          console.log('✅ Usando datos iniciales del usuario');
          setProfile(initialUserData);
          
          // Solo buscar tweets si no los tenemos
          if (!tweets.length) {
            const tweetsRes = await getUserTweets(userId);
            console.log('✅ Tweets cargados:', tweetsRes.length);
            setTweets(tweetsRes);
          }
          
          setEditForm({ 
            bio: initialUserData.bio || '', 
            avatar_url: initialUserData.avatar_url || '',
            name: initialUserData.name || initialUserData.username || ''
          });
        } else if (userId) {
          // Si solo tenemos el ID, buscar todo
          console.log('🔍 Buscando perfil desde API...');
          const [userRes, tweetsRes] = await Promise.all([
            getUserProfile(userId),
            getUserTweets(userId)
          ]);
          
          console.log('✅ Perfil cargado:', userRes);
          console.log('✅ Tweets cargados:', tweetsRes.length);
          
          setProfile(userRes);
          setTweets(tweetsRes);
          
          setEditForm({ 
            bio: userRes.bio || '', 
            avatar_url: userRes.avatar_url || '',
            name: userRes.name || userRes.username || ''
          });
        } else {
          console.error('❌ No se proporcionó userId');
          Alert.alert('Error', 'No se proporcionó ID de usuario');
          navigation.goBack();
          return;
        }
      } catch (error) {
        console.error("❌ Error cargando perfil:", error);
        Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
        
        // Si hay error pero tenemos datos iniciales, usarlos
        if (initialUserData) {
          console.log('⚠️ Usando datos iniciales debido a error');
          setProfile(initialUserData);
          setEditForm({ 
            bio: initialUserData.bio || '', 
            avatar_url: initialUserData.avatar_url || '',
            name: initialUserData.name || initialUserData.username || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleEditSubmit = async () => {
    try {
      // Validaciones básicas
      if (!token) {
        Alert.alert('Error', 'Debes iniciar sesión para editar tu perfil');
        return;
      }

      if (!currentUser || !profile || currentUser.id !== profile.id) {
        Alert.alert('Error', 'Solo puedes editar tu propio perfil');
        return;
      }

      console.log('✏️ Actualizando perfil con:', editForm);
      
      // Llamar al servicio con token
      const updatedProfile = await updateProfile(userId, editForm, token);
      setProfile({ ...profile, ...updatedProfile });
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error("❌ Error actualizando perfil:", error);
      Alert.alert('Error', error.message || "No se pudo actualizar el perfil");
    }
  };

  const handleTweetDelete = (deletedTweetId) => {
    setTweets(tweets.filter(t => t.id !== deletedTweetId));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }
  
  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Usuario no encontrado</Text>
        <Text style={styles.errorText}>
          El usuario que buscas no existe o ha sido eliminado.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButtonHeader}
        >
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{profile.name || profile.username}</Text>
          <Text style={styles.headerSubtitle}>{tweets.length} tweets</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: profile.avatar_url || "https://via.placeholder.com/100"
                }} 
                style={styles.avatar}
                onError={(e) => {
                  console.log('Error cargando avatar');
                }}
              />
            </View>
            
            {/* Botón de Editar (solo para el propio usuario) */}
            {currentUser && currentUser.id === profile.id && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Nombre y username */}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {profile.name || profile.username}
            </Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>
          
          {/* Bio */}
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
          
          {/* Info adicional */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <Icon name="calendar" size={16} color="#657786" />
              <Text style={styles.infoText}>
                Se unió en {formatDate(profile.created_at)}
              </Text>
            </View>
            
            {profile.location && (
              <View style={styles.infoItem}>
                <Icon name="map-pin" size={16} color="#657786" />
                <Text style={styles.infoText}>{profile.location}</Text>
              </View>
            )}
            
            {profile.website && (
              <TouchableOpacity 
                style={styles.infoItem}
                onPress={() => {
                  const url = profile.website.startsWith('http') 
                    ? profile.website 
                    : `https://${profile.website}`;
                  // Aquí puedes usar Linking.openURL si quieres abrir el enlace
                }}
              >
                <Icon name="link" size={16} color="#1d9bf0" />
                <Text style={[styles.infoText, styles.websiteText]}>
                  {profile.website.replace('https://', '').replace('http://', '')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tweets.length}</Text>
              <Text style={styles.statLabel}>Tweets</Text>
            </View>
          </View>
        </View>

        {/* Tweets Section */}
        <View style={styles.tweetsSection}>
          {tweets.length === 0 ? (
            <View style={styles.emptyTweets}>
              <Icon name="message-circle" size={50} color="#ccd6dd" />
              <Text style={styles.emptyTitle}>No hay tweets todavía</Text>
              <Text style={styles.emptyText}>
                {currentUser && currentUser.id === profile.id 
                  ? "Aún no has publicado ningún tweet." 
                  : `@${profile.username} aún no ha publicado tweets.`}
              </Text>
            </View>
          ) : (
            tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} onDelete={handleTweetDelete} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity 
                onPress={() => setIsEditing(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Nombre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.name || ''}
                  onChangeText={(text) => setEditForm({...editForm, name: text})}
                  placeholder="Tu nombre para mostrar"
                  placeholderTextColor="#657786"
                />
              </View>
              
              {/* Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Biografía</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm({...editForm, bio: text})}
                  placeholder="Cuéntanos sobre ti..."
                  placeholderTextColor="#657786"
                  multiline
                  numberOfLines={3}
                  maxLength={160}
                />
                <Text style={styles.charCount}>
                  {editForm.bio.length}/160
                </Text>
              </View>
              
              {/* Avatar URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL del Avatar</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.avatar_url}
                  onChangeText={(text) => setEditForm({...editForm, avatar_url: text})}
                  placeholder="https://ejemplo.com/tu-avatar.jpg"
                  placeholderTextColor="#657786"
                />
                {editForm.avatar_url ? (
                  <View style={styles.avatarPreview}>
                    <Text style={styles.previewText}>Vista previa:</Text>
                    <Image
                      source={{ uri: editForm.avatar_url }}
                      style={styles.previewAvatar}
                      onError={(e) => {
                        console.log('Error cargando avatar preview');
                      }}
                    />
                  </View>
                ) : null}
              </View>
              
              {/* Botones */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleEditSubmit}
                >
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#657786',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1d9bf0',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    backgroundColor: '#fff',
  },
  backButtonHeader: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14171A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#657786',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    marginTop: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1d9bf0',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#1d9bf0',
    fontSize: 14,
    fontWeight: '600',
  },
  nameContainer: {
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14171A',
  },
  username: {
    fontSize: 15,
    color: '#657786',
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    color: '#14171A',
    lineHeight: 20,
    marginBottom: 12,
  },
  additionalInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#657786',
    marginLeft: 8,
  },
  websiteText: {
    color: '#1d9bf0',
  },
  stats: {
    flexDirection: 'row',
  },
  statItem: {
    marginRight: 20,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14171A',
  },
  statLabel: {
    fontSize: 14,
    color: '#657786',
  },
  tweetsSection: {
    paddingBottom: 20,
  },
  emptyTweets: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14171A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#657786',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14171A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#14171A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#657786',
    marginTop: 4,
  },
  avatarPreview: {
    marginTop: 12,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#657786',
    marginBottom: 8,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  cancelButtonText: {
    color: '#14171A',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1d9bf0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Profile;