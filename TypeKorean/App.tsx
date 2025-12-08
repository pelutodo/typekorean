/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import KoreanKeyboard from './components/KoreanKeyboard';
import HomePage from './components/HomePage';
import { addJamo, handleBackspace as handleHangulBackspace } from './utils/hangulComposer';
import {
  initializeDatabase,
  getWordsBatch,
  type Word,
} from './services/database';
import { playSuccessSound } from './utils/sound';
import { initializeTTS, speakKorean } from './utils/textToSpeech';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
      <AppContent />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'typing'>('typing');
  const [text, setText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsBatch, setWordsBatch] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const BATCH_SIZE = 10;
  const currentWord = wordsBatch[currentWordIndex];
  const targetWord = currentWord?.korean || '';
  const isMatch = text.trim() === targetWord;
  const prevIsMatchRef = useRef(false);

  // Play success sound when word is matched
  useEffect(() => {
    if (isMatch && !prevIsMatchRef.current && targetWord) {
      // Only play if we just matched (wasn't matched before)
      playSuccessSound();
    }
    prevIsMatchRef.current = isMatch;
  }, [isMatch, targetWord]);

  // Speak the Korean word when it changes
  useEffect(() => {
    if (currentWord?.korean && !isLoading) {
      // Small delay to ensure TTS is ready
      const timer = setTimeout(() => {
        speakKorean(currentWord.korean);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentWord?.korean, isLoading]);

  // Initialize database and load first batch
  useEffect(() => {
    async function init() {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized, loading words...');
        const words = await getWordsBatch(BATCH_SIZE, 0);
        console.log(`Loaded ${words.length} words:`, words);
        setWordsBatch(words);
        setIsLoading(false);
        
        // Initialize TTS
        await initializeTTS();
      } catch (error) {
        console.error('Error initializing app:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleSpeak = () => {
    if (currentWord?.korean) {
      speakKorean(currentWord.korean);
    }
  };

  // Load next batch when reaching the end
  const loadNextBatch = async (): Promise<Word[]> => {
    try {
      const nextOffset = wordsBatch.length;
      const nextWords = await getWordsBatch(BATCH_SIZE, nextOffset);
      if (nextWords.length > 0) {
        setWordsBatch(prev => [...prev, ...nextWords]);
      }
      return nextWords;
    } catch (error) {
      console.error('Error loading next batch:', error);
      return [];
    }
  };

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

  const handleSkip = async () => {
    // Skip to next word without requiring a match
    const nextIndex = currentWordIndex + 1;

    // If we're at the end of current batch, load more
    if (nextIndex >= wordsBatch.length) {
      const newWords = await loadNextBatch();
      if (newWords.length > 0) {
        // New words were loaded, move to next index
        setCurrentWordIndex(nextIndex);
        setText('');
      } else {
        // No more words available
        console.log('No more words available');
      }
      return;
    }

    // Move to next word
    setCurrentWordIndex(nextIndex);
    setText('');
  };

  const handleNext = async () => {
    // Move to next word
    const nextIndex = currentWordIndex + 1;

    // If we're at the end of current batch, load more
    if (nextIndex >= wordsBatch.length) {
      const newWords = await loadNextBatch();
      if (newWords.length > 0) {
        // New words were loaded, move to next index
        setCurrentWordIndex(nextIndex);
        setText('');
      } else {
        // No more words available
        console.log('No more words available');
        // Could show a message to user here
      }
      return;
    }

    // Move to next word
    setCurrentWordIndex(nextIndex);
    setText('');
  };

  // Swipe gesture for skipping (swipe left or right)
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Minimum horizontal movement to activate (both directions)
    .failOffsetY([-10, 10]) // Fail if vertical movement is too large
    .onEnd((event) => {
      // Swipe left or right (either direction skips)
      const swipeDistance = Math.abs(event.translationX);
      const swipeVelocity = Math.abs(event.velocityX);
      if (swipeDistance > 50 || swipeVelocity > 300) {
        handleSkip();
      }
    });

  const handleHome = () => {
    setCurrentPage('home');
  };

  const handleStartTyping = (vocabularySetId?: string) => {
    setCurrentPage('typing');
    // TODO: Use vocabularySetId to filter/load specific vocabulary set
  };

  // Home page component
  if (currentPage === 'home') {
    return <HomePage onStartTyping={handleStartTyping} />;
  }

  // Typing page
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHome}
          activeOpacity={0.7}>
          <Text style={styles.homeButtonText}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.swipeArea}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : currentWord ? (
            <>
              <Text style={styles.emoji}>
                {currentWord.emoji || '📚'}
              </Text>
              <View style={styles.koreanTextContainer}>
                <Text style={styles.koreanText}>{currentWord.korean}</Text>
                {isMatch && <Text style={styles.checkEmoji}>✅</Text>}
              </View>
              <TouchableOpacity
                style={styles.speakerButton}
                onPress={handleSpeak}
                activeOpacity={0.7}>
                <Text style={styles.speakerIcon}>🔊</Text>
              </TouchableOpacity>
              <Text style={styles.englishHint}>{currentWord.english}</Text>
            </>
          ) : (
            <Text style={styles.loadingText}>No words available</Text>
          )}
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
        </GestureDetector>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  homeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  homeButtonText: {
    fontSize: 20,
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
  swipeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  speakerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speakerIcon: {
    fontSize: 20,
  },
  checkEmoji: {
    fontSize: 40,
  },
  englishHint: {
    fontSize: 18,
    color: '#757575',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 24,
    color: '#757575',
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
