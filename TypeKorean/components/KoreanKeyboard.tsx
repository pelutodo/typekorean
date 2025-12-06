/**
 * Korean Keyboard Component
 * Displays a virtual Korean keyboard with Hangul characters
 *
 * @format
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { initializeTypingSound, playTypingSound, releaseTypingSound } from '../utils/sound';

interface KoreanKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace?: () => void;
  onSpace?: () => void;
  onEnter?: () => void;
}

// Korean keyboard layout (2-set keyboard)
const KEYBOARD_LAYOUT = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
];

// Number row
const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function KoreanKeyboard({
  onKeyPress,
  onBackspace,
  onSpace,
  onEnter,
}: KoreanKeyboardProps) {
  useEffect(() => {
    initializeTypingSound();
    return () => {
      releaseTypingSound();
    };
  }, []);

  const handleKeyPress = (key: string) => {
    playTypingSound();
    onKeyPress(key);
  };

  const handleBackspace = () => {
    playTypingSound();
    if (onBackspace) {
      onBackspace();
    }
  };

  const handleSpace = () => {
    playTypingSound();
    if (onSpace) {
      onSpace();
    }
  };

  const handleEnter = () => {
    playTypingSound();
    if (onEnter) {
      onEnter();
    }
  };

  const renderKey = (key: string, index: number) => {
    const isSpecialKey = key === 'backspace' || key === 'space' || key === 'enter';
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.key,
          isSpecialKey && styles.specialKey,
          key === 'space' && styles.spaceKey,
        ]}
        onPress={() => {
          if (key === 'backspace') {
            handleBackspace();
          } else if (key === 'space') {
            handleSpace();
          } else if (key === 'enter') {
            handleEnter();
          } else {
            handleKeyPress(key);
          }
        }}
        activeOpacity={0.7}>
        <Text style={styles.keyText}>
          {key === 'backspace' ? '⌫' : key === 'space' ? 'Space' : key === 'enter' ? '↵' : key}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Number row */}
      <View style={styles.row}>
        {NUMBER_ROW.map((num, index) => renderKey(num, index))}
        {renderKey('backspace', NUMBER_ROW.length)}
      </View>

      {/* Korean character rows */}
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((char, charIndex) => renderKey(char, charIndex))}
          {rowIndex === KEYBOARD_LAYOUT.length - 1 && renderKey('enter', row.length)}
        </View>
      ))}

      {/* Space bar row */}
      <View style={styles.row}>
        {renderKey('space', 0)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#BDBDBD',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 4,
  },
  key: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  specialKey: {
    backgroundColor: '#BDBDBD',
    minWidth: 60,
  },
  spaceKey: {
    flex: 1,
    maxWidth: '80%',
  },
  keyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
  },
});

export default KoreanKeyboard;

