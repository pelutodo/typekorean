/**
 * Text-to-Speech utility for reading Korean words
 * @format
 */

let TTS: any = null;
let isInitialized = false;

// Try to import react-native-tts, but don't fail if it's not available
try {
  TTS = require('react-native-tts').default;
} catch (error: any) {
  console.warn('react-native-tts not available:', error);
  TTS = null;
}

/**
 * Initialize TTS with Korean language settings
 */
export async function initializeTTS(): Promise<void> {
  if (!TTS) {
    console.warn('TTS module not available');
    return;
  }

  if (isInitialized) {
    return;
  }

  try {
    // Try to set Korean language (optional - will use system default if fails)
    if (TTS.setDefaultLanguage) {
      try {
        await TTS.setDefaultLanguage('ko-KR');
      } catch (error) {
        console.warn('Error setting default language (will use system default):', error);
      }
    }
    
    // Skip setting default rate/pitch during init - set them per-speak call instead
    // This avoids the type conversion errors
    
    isInitialized = true;
    console.log('TTS initialized');
  } catch (error) {
    console.warn('Error initializing TTS:', error);
    // Try to continue anyway - TTS might still work with defaults
    isInitialized = true;
  }
}

/**
 * Speak a Korean word
 * @param text - The Korean text to speak
 */
export async function speakKorean(text: string): Promise<void> {
  if (!TTS) {
    console.warn('TTS module not available');
    return;
  }

  if (!text || text.trim().length === 0) {
    return;
  }

  try {
    if (!isInitialized) {
      await initializeTTS();
    }

    // Stop any currently speaking text
    try {
      await TTS.stop();
    } catch (error) {
      // Ignore stop errors
    }
    
    // Speak the text in Korean
    // Try with options first, fallback to simple speak
    try {
      await TTS.speak(text, {
        language: 'ko-KR',
        rate: 0.5, // Slightly slower for clarity
        pitch: 1.0,
      });
    } catch (error) {
      // Fallback to simple speak without options
      console.warn('Error speaking with options, trying simple speak:', error);
      try {
        await TTS.speak(text);
      } catch (e) {
        console.error('Error speaking text:', e);
      }
    }
  } catch (error) {
    console.error('Error speaking text:', error);
  }
}

/**
 * Stop speaking
 */
export async function stopSpeaking(): Promise<void> {
  if (!TTS) {
    return;
  }

  try {
    await TTS.stop();
  } catch (error) {
    console.error('Error stopping TTS:', error);
  }
}

/**
 * Check if TTS is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  if (!TTS) {
    return false;
  }

  try {
    return await TTS.isSpeaking();
  } catch (error) {
    console.error('Error checking TTS status:', error);
    return false;
  }
}

