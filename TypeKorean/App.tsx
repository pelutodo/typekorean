/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import KoreanKeyboard from './components/KoreanKeyboard';
import { addJamo, handleBackspace as handleHangulBackspace } from './utils/hangulComposer';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const targetWord = '개';

  const isMatch = text.trim() === targetWord;

  const handleKeyPress = (key: string) => {
    setText(prev => addJamo(prev, key));
  };

  const handleBackspace = () => {
    setText(prev => handleHangulBackspace(prev));
  };

  const handleSpace = () => {
    setText(prev => prev + ' ');
  };

  const handleEnter = () => {
    setText(prev => prev + '\n');
  };

  const handleSkip = () => {
    // Skip functionality - can be customized later
    console.log('Skip pressed');
  };

  const handleNext = () => {
    // Next functionality - can be customized later
    console.log('Next pressed');
    // For now, reset the text to allow typing the next word
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>🐕</Text>
        <View style={styles.koreanTextContainer}>
          <Text style={styles.koreanText}>개</Text>
          {isMatch && <Text style={styles.checkEmoji}>✅</Text>}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.typedText}>{text || ' '}</Text>
        </View>
        {isMatch && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
      <KoreanKeyboard
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onSpace={handleSpace}
        onEnter={handleEnter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  emoji: {
    fontSize: 100,
  },
  koreanTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  koreanText: {
    fontSize: 48,
  },
  checkEmoji: {
    fontSize: 40,
  },
  textContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    maxWidth: '90%',
    minWidth: 200,
    minHeight: 60,
    justifyContent: 'center',
  },
  typedText: {
    fontSize: 24,
    color: '#212121',
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default App;
