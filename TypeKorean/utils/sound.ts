/**
 * Sound utility for playing typing sounds
 * Uses a simple native module instead of react-native-sound
 * @format
 */

import { NativeModules } from 'react-native';

const { SoundPlayer } = NativeModules;

// Debug: log available modules to help diagnose
if (__DEV__) {
  const moduleKeys = Object.keys(NativeModules).sort();
  console.log('Available native modules:', moduleKeys);
  console.log('SoundPlayer module available:', !!SoundPlayer);
  if (!SoundPlayer) {
    console.warn('SoundPlayer not found. Make sure SoundPlayer.swift and SoundPlayer.m are added to Xcode project.');
  }
}

let soundInitialized = false;

/**
 * Initialize the typing sound
 * Note: For iOS, the key.wav file must be added to the Xcode project
 * (Right-click TypeKorean folder -> Add Files -> Select key.wav -> Check "Copy items if needed")
 */
export function initializeTypingSound(): void {
  // No initialization needed for our simple module
  soundInitialized = true;
}

/**
 * Play the typing sound
 */
export function playTypingSound(): void {
  if (!SoundPlayer) {
    console.warn('SoundPlayer native module not available');
    return;
  }

  // Play the sound file (without .wav extension, just 'key')
  SoundPlayer.playSound('key.wav')
    .then(() => {
      // Sound played successfully
    })
    .catch((error: any) => {
      console.warn('Failed to play typing sound:', error);
    });
}

/**
 * Release the sound resource
 */
export function releaseTypingSound(): void {
  if (SoundPlayer) {
    SoundPlayer.stopSound()
      .catch((error: any) => {
        console.warn('Failed to stop sound:', error);
      });
  }
}
