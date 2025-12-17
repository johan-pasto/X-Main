import React from 'react';
import { Text, Platform } from 'react-native';

const Emoji = ({ symbol, size = 20, style }) => {
  const emojiMap = {
    lock: '🔐',
    house: '🏠',
    key: '🔑',
    refresh: '🔄',
    user: '👤',
    door: '🚪',
    error: '❌',
    success: '✅',
    rocket: '🚀',
    target: '🎯',
    search: '🔍',
  };

  const emoji = emojiMap[symbol] || symbol;

  return (
    <Text 
      style={[
        { 
          fontSize: size,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        style
      ]}
    >
      {emoji}
    </Text>
  );
};

export default Emoji;