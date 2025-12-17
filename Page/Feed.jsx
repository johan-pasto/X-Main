import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TweetCard from './TweetCard';
import CreateTweet from './CreateTweet';
import { getFeed as fetchTweetsAPI } from '../services/tweetService';

const Feed = () => {
  const [tweets, setTweets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = useCallback(async () => {
    try {
      const usuarioString = await AsyncStorage.getItem('usuario');
      if (!usuarioString) {
        console.log('❌ [Feed] No se encontró usuario en AsyncStorage');
        return null;
      }
      
      const usuario = JSON.parse(usuarioString);
      const token = usuario.token;
      
      console.log('🔐 [Feed] Token obtenido:', token ? `✅ (${token.length} chars)` : '❌ NO');
      
      return token;
    } catch (error) {
      console.error('❌ [Feed] Error obteniendo token:', error);
      return null;
    }
  }, []);

  const fetchTweets = useCallback(async () => {
    try {
      console.log('🔍 [Feed] Obteniendo token...');
      const token = await getToken();
      
      if (!token) {
        console.error('❌ [Feed] No hay token disponible');
        setError('No estás autenticado. Por favor, inicia sesión.');
        setTweets([]);
        return;
      }

      console.log('📡 [Feed] Solicitando tweets...');
      const response = await fetchTweetsAPI(token);
      
      console.log('📨 [Feed] Respuesta:', response.ok ? 'OK' : 'ERROR');
      
      if (response.ok) {
        console.log(`✅ [Feed] ${response.tweets.length} tweets recibidos`);
        
        // Obtener usuario actual para marcar tweets propios
        const usuarioString = await AsyncStorage.getItem('usuario');
        const usuario = usuarioString ? JSON.parse(usuarioString) : null;
        
        // Procesar tweets
        const processedTweets = response.tweets.map(tweet => ({
          ...tweet,
          isOwnTweet: usuario ? tweet.user?.id === usuario.id : false
        }));
        
        setTweets(processedTweets);
        setError(null);
      } else {
        console.error('❌ [Feed] Error:', response.message);
        setError(response.message || 'Error al obtener tweets');
        
        if (response.status === 401) {
          setError('Sesión expirada. Vuelve a iniciar sesión.');
        }
      }
    } catch (error) {
      console.error('❌ [Feed] Error en fetchTweets:', error.message);
      setError('Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTweets();
  }, [fetchTweets]);

  const handleDeleteTweet = useCallback((deletedTweetId) => {
    setTweets(prev => prev.filter(tweet => tweet.id !== deletedTweetId));
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>Cargando tweets...</Text>
      </View>
    );
  }

  if (error && tweets.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity onPress={fetchTweets} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CreateTweet onTweetCreated={fetchTweets} />
      
      <FlatList
        data={tweets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TweetCard
            tweet={item}
            onDelete={handleDeleteTweet}
            onRefresh={fetchTweets}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DA1F2']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay tweets todavía</Text>
            <Text style={styles.emptySubtext}>Sé el primero en twittear</Text>
          </View>
        }
        ListFooterComponent={
          tweets.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {tweets.length} {tweets.length === 1 ? 'tweet' : 'tweets'}
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#657786',
    fontSize: 16,
  },
  errorText: {
    color: '#E0245E',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#14171A',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#657786',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  footerText: {
    color: '#657786',
    fontSize: 14,
  },
});

export default Feed;