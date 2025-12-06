/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import KoreanKeyboard from './components/KoreanKeyboard';

function App() {
  const [text, setText] = useState('');

  const handleKeyPress = (key: string) => {
    setText(prev => prev + key);
  };

  const handleBackspace = () => {
    setText(prev => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setText(prev => prev + ' ');
  };

  const handleEnter = () => {
    setText(prev => prev + '\n');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🐕</Text>
          <Text style={styles.koreanText}>개</Text>
          {text.length > 0 && (
            <View style={styles.textContainer}>
              <Text style={styles.typedText}>{text}</Text>
            </View>
          )}
        </View>
        <KoreanKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onSpace={handleSpace}
          onEnter={handleEnter}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  koreanText: {
    fontSize: 48,
    marginTop: 20,
  },
  textContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    maxWidth: '90%',
    minHeight: 60,
    justifyContent: 'center',
  },
  typedText: {
    fontSize: 24,
    color: '#212121',
    textAlign: 'center',
  },
});

export default App;
