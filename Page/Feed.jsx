import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
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
      if (!usuarioString) return null;

      const usuario = JSON.parse(usuarioString);
      return usuario.token || null;
    } catch {
      return null;
    }
  }, []);

  const fetchTweets = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        setError('Debes iniciar sesión para ver los tweets.');
        setTweets([]);
        return;
      }

      const response = await fetchTweetsAPI(token);

      if (response.ok) {
        const usuarioString = await AsyncStorage.getItem('usuario');
        const usuario = usuarioString ? JSON.parse(usuarioString) : null;

        const processedTweets = response.tweets.map(tweet => ({
          ...tweet,
          isOwnTweet: usuario ? tweet.user?.id === usuario.id : false
        }));

        setTweets(processedTweets);
        setError(null);
      } else {
        if (response.status === 401) {
          setError('Tu sesión ha expirado. Inicia sesión nuevamente.');
        } else {
          setError(response.message || 'No se pudieron cargar los tweets.');
        }
      }
    } catch {
      setError('Error de conexión. Inténtalo más tarde.');
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
        <Text style={styles.errorText}>{error}</Text>
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
            <Text style={styles.emptySubtext}>
              Sé el primero en publicar
            </Text>
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
        showsVerticalScrollIndicator
      />
    </View>
  );
};

export default Feed;

/* ================== ESTILOS ================== */

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
    paddingHorizontal: 20,
    paddingVertical: 10,
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
