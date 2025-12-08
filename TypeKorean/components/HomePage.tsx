/**
 * Home Page Component
 * Landing page for the Type Korean app
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VocabularySet {
  id: string;
  name: string;
  description?: string;
}

interface HomePageProps {
  onStartTyping: (vocabularySetId?: string) => void;
}

const VOCABULARY_SETS: VocabularySet[] = [
  {
    id: 'common-words',
    name: 'Common Words',
    description: 'Essential Korean words for everyday use',
  },
];

function HomePage({ onStartTyping }: HomePageProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Type Korean</Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Vocabulary Sets</Text>
        {VOCABULARY_SETS.map((set) => (
          <TouchableOpacity
            key={set.id}
            style={styles.vocabCard}
            onPress={() => onStartTyping(set.id)}
            activeOpacity={0.7}>
            <Text style={styles.vocabCardTitle}>{set.name}</Text>
            {set.description && (
              <Text style={styles.vocabCardDescription}>{set.description}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  vocabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  vocabCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  vocabCardDescription: {
    fontSize: 16,
    color: '#757575',
  },
});

export default HomePage;

