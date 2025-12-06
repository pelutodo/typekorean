/**
 * Hangul Composition Utility
 * Combines individual jamo (Korean characters) into complete Hangul syllables
 *
 * @format
 */

// Unicode ranges for Hangul
const HANGUL_BASE = 0xac00; // 가
const INITIAL_BASE = 0x1100; // ㄱ
const VOWEL_BASE = 0x1161; // ㅏ
const FINAL_BASE = 0x11a7; // (empty final)

// Initial consonants (초성)
const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

// Vowels (중성)
const VOWELS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];

// Final consonants (종성)
const FINALS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

interface CompositionState {
  initial: string; // 초성
  vowel: string; // 중성
  final: string; // 종성
}

/**
 * Get the index of a character in an array
 */
function getIndex(char: string, array: string[]): number {
  return array.indexOf(char);
}

/**
 * Combine jamo into a complete Hangul syllable
 */
function combineJamo(initial: string, vowel: string, final: string = ''): string {
  const initialIdx = getIndex(initial, INITIALS);
  const vowelIdx = getIndex(vowel, VOWELS);
  const finalIdx = final ? getIndex(final, FINALS) : 0;

  if (initialIdx === -1 || vowelIdx === -1) {
    return '';
  }

  const codePoint =
    HANGUL_BASE + initialIdx * 588 + vowelIdx * 28 + finalIdx;
  return String.fromCharCode(codePoint);
}

/**
 * Decompose a Hangul syllable into jamo
 */
function decomposeSyllable(syllable: string): CompositionState | null {
  const code = syllable.charCodeAt(0);
  if (code < HANGUL_BASE || code > 0xd7a3) {
    return null;
  }

  const relativeCode = code - HANGUL_BASE;
  const initialIdx = Math.floor(relativeCode / 588);
  const vowelIdx = Math.floor((relativeCode % 588) / 28);
  const finalIdx = relativeCode % 28;

  return {
    initial: INITIALS[initialIdx] || '',
    vowel: VOWELS[vowelIdx] || '',
    final: FINALS[finalIdx] || '',
  };
}

/**
 * Check if a character is an initial consonant
 */
function isInitial(char: string): boolean {
  return INITIALS.includes(char);
}

/**
 * Check if a character is a vowel
 */
function isVowel(char: string): boolean {
  return VOWELS.includes(char);
}

/**
 * Check if a character is a final consonant
 */
function isFinal(char: string): boolean {
  return FINALS.includes(char) && char !== '';
}

/**
 * Check if a character is a complete Hangul syllable
 */
function isSyllable(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= HANGUL_BASE && code <= 0xd7a3;
}

/**
 * Check if two vowels can combine into a compound vowel
 * Returns the compound vowel if they can combine, null otherwise
 */
function combineVowels(vowel1: string, vowel2: string): string | null {
  const combinations: Record<string, Record<string, string>> = {
    'ㅗ': { 'ㅏ': 'ㅘ', 'ㅐ': 'ㅙ', 'ㅣ': 'ㅚ' },
    'ㅜ': { 'ㅓ': 'ㅝ', 'ㅔ': 'ㅞ', 'ㅣ': 'ㅟ' },
    'ㅡ': { 'ㅣ': 'ㅢ' },
  };
  return combinations[vowel1]?.[vowel2] || null;
}

/**
 * Check if two final consonants can combine into a compound final
 * Returns the compound final if they can combine, null otherwise
 */
function getCompoundFinal(final1: string, final2: string): string | null {
  // Compound finals mapping: first final + second final = compound final
  const compoundFinals: Record<string, Record<string, string>> = {
    'ㄱ': { 'ㅅ': 'ㄳ' },
    'ㄴ': { 'ㅈ': 'ㄵ', 'ㅎ': 'ㄶ' },
    'ㄹ': { 'ㄱ': 'ㄺ', 'ㅁ': 'ㄻ', 'ㅂ': 'ㄼ', 'ㅅ': 'ㄽ', 'ㅌ': 'ㄾ', 'ㅍ': 'ㄿ', 'ㅎ': 'ㅀ' },
    'ㅂ': { 'ㅅ': 'ㅄ' },
  };
  return compoundFinals[final1]?.[final2] || null;
}

/**
 * Add a jamo character to the current composition state
 */
export function addJamo(
  currentText: string,
  newJamo: string,
): string {
  // If it's not a jamo, just append it
  if (!isInitial(newJamo) && !isVowel(newJamo) && !isFinal(newJamo)) {
    return currentText + newJamo;
  }

  // If text is empty, start a new composition
  if (currentText.length === 0) {
    if (isInitial(newJamo)) {
      return newJamo;
    }
    // If starting with vowel, can't form syllable - just return it
    if (isVowel(newJamo)) {
      return newJamo;
    }
    return currentText;
  }

  const lastChar = currentText[currentText.length - 1];

  // If last character is a complete syllable, try to add final or start new
  if (isSyllable(lastChar)) {
    const decomposed = decomposeSyllable(lastChar);
    if (decomposed) {
      // Special case: If syllable has a final and we're adding a vowel,
      // decompose the final and start new syllable with it
      if (decomposed.final && isVowel(newJamo)) {
        const syllableWithoutFinal = combineJamo(
          decomposed.initial,
          decomposed.vowel,
          '',
        );
        // Start new syllable: final becomes initial + vowel (combine them)
        const newSyllable = combineJamo(decomposed.final, newJamo, '');
        return currentText.slice(0, -1) + syllableWithoutFinal + newSyllable;
      }
      
      // If syllable has a final
      if (decomposed.final) {
        // First, check if we can form a compound final (e.g., ㅂ + ㅅ = ㅄ)
        // This takes priority even if the jamo can also be an initial
        if (isFinal(newJamo)) {
          const compoundFinal = getCompoundFinal(decomposed.final, newJamo);
          if (compoundFinal) {
            // Replace with compound final
            const newSyllable = combineJamo(
              decomposed.initial,
              decomposed.vowel,
              compoundFinal,
            );
            return currentText.slice(0, -1) + newSyllable;
          }
          // Can't form compound - if it's also an initial, start new syllable
          // Otherwise, replace the final
          if (isInitial(newJamo)) {
            return currentText + newJamo;
          }
          // Replace the final
          const newSyllable = combineJamo(
            decomposed.initial,
            decomposed.vowel,
            newJamo,
          );
          return currentText.slice(0, -1) + newSyllable;
        }
        
        // If it's only an initial (not a final), start a new syllable
        if (isInitial(newJamo)) {
          return currentText + newJamo;
        }
      }
      
      // Syllable has no final
      // If adding a vowel, check if it can combine with existing vowel
      if (isVowel(newJamo)) {
        const compoundVowel = combineVowels(decomposed.vowel, newJamo);
        if (compoundVowel) {
          // Combine the vowels into a compound vowel
          const newSyllable = combineJamo(
            decomposed.initial,
            compoundVowel,
            '',
          );
          return currentText.slice(0, -1) + newSyllable;
        }
        // Can't combine, start new syllable
        return currentText + newJamo;
      }
      
      // If adding a final to a syllable without a final, add it as final
      if (isFinal(newJamo)) {
        const newSyllable = combineJamo(
          decomposed.initial,
          decomposed.vowel,
          newJamo,
        );
        return currentText.slice(0, -1) + newSyllable;
      }
      
      // If it's an initial but not a final, start new syllable
      if (isInitial(newJamo) && !isFinal(newJamo)) {
        return currentText + newJamo;
      }
    }
    // If adding non-jamo, just append
    return currentText + newJamo;
  }

  // If last character is an initial consonant
  if (isInitial(lastChar)) {
    if (isVowel(newJamo)) {
      // Combine initial + vowel
      // Check if there's a syllable before the initial that has a final
      if (currentText.length >= 2) {
        const secondLastChar = currentText[currentText.length - 2];
        if (isSyllable(secondLastChar)) {
          const decomposed = decomposeSyllable(secondLastChar);
          if (decomposed && decomposed.final) {
            // The syllable before has a final, so we need to preserve it
            // Combine: syllable with final + initial + vowel
            const syllableWithFinal = combineJamo(
              decomposed.initial,
              decomposed.vowel,
              decomposed.final,
            );
            const newSyllable = combineJamo(lastChar, newJamo, '');
            return currentText.slice(0, -2) + syllableWithFinal + newSyllable;
          }
        }
      }
      // No syllable before, just combine initial + vowel
      return currentText.slice(0, -1) + combineJamo(lastChar, newJamo);
    }
    if (isInitial(newJamo)) {
      // Replace the initial
      return currentText.slice(0, -1) + newJamo;
    }
    // Can't combine, just append
    return currentText + newJamo;
  }

  // If last character is a vowel
  if (isVowel(lastChar)) {
    if (isInitial(newJamo)) {
      // Start new syllable with initial
      return currentText + newJamo;
    }
    // Can't combine two vowels, just append
    return currentText + newJamo;
  }

  // If last character is a final consonant (standalone)
  if (isFinal(lastChar)) {
    if (isVowel(newJamo)) {
      // Start new syllable
      return currentText + newJamo;
    }
    if (isInitial(newJamo)) {
      // Start new syllable
      return currentText + newJamo;
    }
  }

  // Default: just append
  return currentText + newJamo;
}

/**
 * Handle backspace - decompose syllable if needed
 */
export function handleBackspace(currentText: string): string {
  if (currentText.length === 0) {
    return currentText;
  }

  const lastChar = currentText[currentText.length - 1];

  // If last character is a complete syllable, decompose it
  if (isSyllable(lastChar)) {
    const decomposed = decomposeSyllable(lastChar);
    if (decomposed) {
      // If it has a final consonant, remove the final
      if (decomposed.final) {
        const newSyllable = combineJamo(
          decomposed.initial,
          decomposed.vowel,
          '',
        );
        return currentText.slice(0, -1) + newSyllable;
      }
      // If it has no final, decompose to initial + vowel
      if (decomposed.vowel) {
        return currentText.slice(0, -1) + decomposed.initial + decomposed.vowel;
      }
      // If only initial, remove it
      return currentText.slice(0, -1);
    }
  }

  // Otherwise, just remove last character
  return currentText.slice(0, -1);
}

