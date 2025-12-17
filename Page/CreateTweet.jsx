import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTweet } from '../services/tweetService';

export default function CreateTweet({ onTweetCreated, disabled = false }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    if (content.length > 280) {
      Alert.alert('Error', 'El tweet no puede tener más de 280 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('=== CREANDO TWEET ===');
      
      // 1. OBTENER TOKEN DE ASYNCSTORAGE
      const usuarioData = await AsyncStorage.getItem('usuario');
      console.log('🔍 Datos en AsyncStorage:', usuarioData ? 'ENCONTRADO' : 'NO ENCONTRADO');
      
      if (!usuarioData) {
        Alert.alert('Error', 'Debes iniciar sesión para publicar tweets');
        setLoading(false);
        return;
      }

      const usuarioObj = JSON.parse(usuarioData);
      const token = usuarioObj.token;
      
      if (!token) {
        Alert.alert('Error', 'Token inválido. Vuelve a iniciar sesión');
        setLoading(false);
        return;
      }

      console.log('✅ Token obtenido:', token.substring(0, 20) + '...');
      console.log('📝 Contenido:', content);

      // 2. CREAR TWEET
      const result = await createTweet(content, token);
      console.log('📦 Resultado de API:', result);
      
      if (result && result.ok) {
        console.log('✅ Tweet creado exitosamente');
        
        // Limpiar y notificar
        setContent('');
        
        if (onTweetCreated) {
          console.log('🔄 Refrescando feed...');
          onTweetCreated();
        }
        
        // Mensaje de éxito
        Alert.alert(
          '¡Éxito!', 
          'Tweet publicado correctamente',
          [{ text: 'OK' }]
        );
        
      } else {
        throw new Error(result?.message || 'Error desconocido al crear tweet');
      }
      
    } catch (e) {
      console.error('❌ Error completo:', e);
      setError('Error: ' + e.message);
      Alert.alert('Error', e.message || 'No se pudo publicar el tweet');
    } finally {
      setLoading(false);
    }
  };

  // Botón para debug
  const handleDebug = async () => {
    try {
      const usuarioData = await AsyncStorage.getItem('usuario');
      Alert.alert(
        'Debug Info',
        usuarioData ? 
          `✅ Token encontrado\nLongitud: ${JSON.parse(usuarioData).token?.length || 0} chars` : 
          '❌ No hay token'
      );
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Si está deshabilitado (no autenticado)
  if (disabled) {
    return (
      <View style={[styles.container, styles.disabledContainer]}>
        <Text style={styles.disabledText}>
          🔐 Inicia sesión para publicar tweets
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        <View style={styles.content}>
          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="What's happening?"
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={280}
            editable={!loading}
          />

          {/* Error message */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Footer */}
          <View style={styles.footer}>
            {/* Character counter */}
            <Text
              style={[
                styles.counter,
                content.length > 260 && styles.counterWarning,
                content.length >= 280 && styles.counterError
              ]}
            >
              {content.length}/280
            </Text>

            {/* Tweet button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!content.trim() || loading || content.length > 280}
              style={[
                styles.button,
                (!content.trim() || loading || content.length > 280) && styles.buttonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Tweet</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Debug button (solo en desarrollo) */}
          {__DEV__ && (
            <TouchableOpacity 
              onPress={handleDebug}
              style={styles.debugButton}
            >
              <Text style={styles.debugButtonText}>🔍 Debug Token</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    padding: 16,
    backgroundColor: '#000',
  },
  disabledContainer: {
    backgroundColor: '#111',
    alignItems: 'center',
    padding: 20,
  },
  disabledText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#fff',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  error: {
    color: '#ff4444',
    marginTop: 8,
    fontSize: 12,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    fontSize: 14,
    color: '#666',
  },
  counterWarning: {
    color: '#ffaa00',
  },
  counterError: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1D9BF0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#0c4a6e',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    marginTop: 8,
    padding: 4,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#666',
    fontSize: 10,
  },
});