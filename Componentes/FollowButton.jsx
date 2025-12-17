import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const FollowButton = ({ userId }) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Aquí podrías llamar a una API para follow/unfollow
      // await followService.toggleFollow(userId);
      setFollowing(prev => !prev);
    } catch (e) {
      // Silenciar errores por ahora
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, following ? styles.following : styles.notFollowing]}
      onPress={toggleFollow}
      disabled={loading}
    >
      <Text style={styles.text}>{following ? 'Following' : 'Follow'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  following: {
    backgroundColor: '#fff',
    borderColor: '#1DA1F2'
  },
  notFollowing: {
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2'
  },
  text: {
    color: '#fff'
  }
});

export default FollowButton;
