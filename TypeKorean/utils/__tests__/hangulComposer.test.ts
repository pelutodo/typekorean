/**
 * Unit tests for Hangul Composer
 * Tests the logic for combining jamo into complete Hangul syllables
 *
 * @format
 */

import { addJamo, handleBackspace } from '../hangulComposer';

describe('Hangul Composer', () => {
  describe('addJamo', () => {
    describe('Basic syllable formation', () => {
      test('should combine initial + vowel', () => {
        expect(addJamo('', 'ㄱ')).toBe('ㄱ');
        expect(addJamo('ㄱ', 'ㅏ')).toBe('가');
      });

      test('should combine initial + vowel + final', () => {
        expect(addJamo('', 'ㄱ')).toBe('ㄱ');
        expect(addJamo('ㄱ', 'ㅏ')).toBe('가');
        expect(addJamo('가', 'ㅁ')).toBe('감');
      });
    });

    describe('Multiple syllables', () => {
      test('should form "고마워" correctly', () => {
        let text = '';
        text = addJamo(text, 'ㄱ'); // ㄱ
        expect(text).toBe('ㄱ');
        text = addJamo(text, 'ㅗ'); // 고
        expect(text).toBe('고');
        text = addJamo(text, 'ㅁ'); // 고 + ㅁ → 곰 (adds as final)
        expect(text).toBe('곰');
        text = addJamo(text, 'ㅏ'); // 곰 + ㅏ → 고마 (decomposes final, starts new)
        expect(text).toBe('고마');
        text = addJamo(text, 'ㅇ'); // 고마 + ㅇ → 고망 (adds as final)
        expect(text).toBe('고망');
        text = addJamo(text, 'ㅝ'); // 고망 + ㅝ → 고마워 (decomposes final, starts new)
        expect(text).toBe('고마워');
      });

      test('should form "안녕하세요" correctly', () => {
        let text = '';
        text = addJamo(text, 'ㅇ'); // ㅇ
        text = addJamo(text, 'ㅏ'); // 아
        text = addJamo(text, 'ㄴ'); // 안
        expect(text).toBe('안');
        text = addJamo(text, 'ㄴ'); // 안 + ㄴ (starts new syllable)
        expect(text).toBe('안ㄴ');
        text = addJamo(text, 'ㅕ'); // 안 + 녀 (combines ㄴ + ㅕ)
        expect(text).toBe('안녀');
        text = addJamo(text, 'ㅇ'); // 안녀 + ㅇ (adds as final) → 안녕
        expect(text).toBe('안녕');
        text = addJamo(text, 'ㅎ'); // 안녕 + ㅎ (starts new syllable)
        expect(text).toBe('안녕ㅎ');
        text = addJamo(text, 'ㅏ'); // 안녕ㅎ + ㅏ → 안녕하 (combines ㅎ + ㅏ)
        expect(text).toBe('안녕하');
        text = addJamo(text, 'ㅅ'); // 안녕하 + ㅅ (adds as final)
        expect(text).toBe('안녕핫');
        text = addJamo(text, 'ㅔ'); // 안녕핫 + ㅔ → 안녕하세 (decomposes)
        expect(text).toBe('안녕하세');
        text = addJamo(text, 'ㅇ'); // 안녕하세 + ㅇ
        text = addJamo(text, 'ㅛ'); // 안녕하세 + 요 (combines ㅇ + ㅛ)
        expect(text).toBe('안녕하세요');
      });

      test('should form "감사합니다" correctly', () => {
        let text = '';
        text = addJamo(text, 'ㄱ'); // ㄱ
        text = addJamo(text, 'ㅏ'); // 가
        text = addJamo(text, 'ㅁ'); // 감
        text = addJamo(text, 'ㅅ'); // 감 + ㅅ (adds as final)
        expect(text).toBe('감ㅅ');
        text = addJamo(text, 'ㅏ'); // 감ㅅ + ㅏ → 감사 (decomposes)
        expect(text).toBe('감사');
        text = addJamo(text, 'ㅎ'); // 감사 + ㅎ
        text = addJamo(text, 'ㅏ'); // 감사 + 하
        expect(text).toBe('감사하');
        text = addJamo(text, 'ㅂ'); // 감사하 + ㅂ (adds as final)
        expect(text).toBe('감사합');
        text = addJamo(text, 'ㄴ'); // 감사합 + ㄴ (starts new syllable, final prevents)
        expect(text).toBe('감사합ㄴ');
        text = addJamo(text, 'ㄴ'); // 감사합 + ㄴ (starts new syllable, final prevents)
        expect(text).toBe('감사합ㄴ');
        text = addJamo(text, 'ㅣ'); // 감사합ㄴ + ㅣ → 감사합니
        expect(text).toBe('감사합니');
        text = addJamo(text, 'ㄷ'); // 감사합니 + ㄷ
        text = addJamo(text, 'ㅏ'); // 감사합니 + 다
        expect(text).toBe('감사합니다');
      });
    });

    describe('Edge cases', () => {
      test('should handle replacing initial', () => {
        expect(addJamo('ㄱ', 'ㄴ')).toBe('ㄴ');
      });

      test('should handle standalone vowel', () => {
        expect(addJamo('', 'ㅏ')).toBe('ㅏ');
        expect(addJamo('ㅏ', 'ㄱ')).toBe('ㅏㄱ');
        expect(addJamo('ㅏㄱ', 'ㅏ')).toBe('ㅏ가');
      });

      test('should handle syllable with final + new initial', () => {
        expect(addJamo('감', 'ㅅ')).toBe('감ㅅ');
        expect(addJamo('감ㅅ', 'ㅏ')).toBe('감사');
      });

      test('should handle syllable without final + new initial', () => {
        expect(addJamo('가', 'ㄴ')).toBe('간'); // Adds ㄴ as final
        expect(addJamo('간', 'ㅏ')).toBe('가나'); // Decomposes final to initial, combines with vowel
      });
    });

    describe('Non-jamo characters', () => {
      test('should append non-jamo characters', () => {
        expect(addJamo('가', ' ')).toBe('가 ');
        expect(addJamo('가', 'a')).toBe('가a');
        expect(addJamo('가', '1')).toBe('가1');
      });
    });
  });

  describe('handleBackspace', () => {
    test('should remove last character from empty string', () => {
      expect(handleBackspace('')).toBe('');
    });

    test('should remove last character from simple text', () => {
      expect(handleBackspace('가나')).toBe('가ㄴㅏ'); // Decomposes 나
      expect(handleBackspace('가')).toBe('ㄱㅏ'); // Decomposes 가
    });

    test('should decompose syllable with final', () => {
      expect(handleBackspace('감')).toBe('가');
      expect(handleBackspace('간')).toBe('가');
    });

    test('should decompose syllable without final', () => {
      expect(handleBackspace('가')).toBe('ㄱㅏ');
      expect(handleBackspace('ㄱㅏ')).toBe('ㄱ');
      expect(handleBackspace('ㄱ')).toBe('');
    });

    test('should handle backspace on "고마워"', () => {
      expect(handleBackspace('고마워')).toBe('고마ㅇㅝ'); // 워 → ㅇ + ㅝ
      expect(handleBackspace('고마ㅇㅝ')).toBe('고마ㅇ'); // Remove vowel
      expect(handleBackspace('고마ㅇ')).toBe('고마'); // Remove initial
      expect(handleBackspace('고마')).toBe('고ㅁㅏ'); // Decomposes 마
      expect(handleBackspace('고ㅁㅏ')).toBe('고ㅁ'); // Remove vowel
      expect(handleBackspace('고ㅁ')).toBe('고'); // Remove initial
      expect(handleBackspace('고')).toBe('ㄱㅗ'); // Decompose
    });
  });

  describe('Simple "워" test', () => {
    test('should form "워" from ㅇ + ㅜ + ㅓ (actual keyboard input)', () => {
      let text = '';
      text = addJamo(text, 'ㅇ'); // ㅇ
      expect(text).toBe('ㅇ');
      text = addJamo(text, 'ㅜ'); // ㅇ + ㅜ → 우
      expect(text).toBe('우');
      text = addJamo(text, 'ㅓ'); // 우 + ㅓ → 워 (combines ㅜ + ㅓ = ㅝ)
      expect(text).toBe('워');
    });

    test('SIMPLE: just type ㅇ + ㅜ + ㅓ = 워', () => {
      let text = '';
      text = addJamo(text, 'ㅇ');
      text = addJamo(text, 'ㅜ');
      text = addJamo(text, 'ㅓ');
      expect(text).toBe('워');
    });

    test('should form "고마워" with actual keyboard keys (ㅜ + ㅓ)', () => {
      let text = '';
      text = addJamo(text, 'ㄱ'); // ㄱ
      expect(text).toBe('ㄱ');
      text = addJamo(text, 'ㅗ'); // 고
      expect(text).toBe('고');
      text = addJamo(text, 'ㅁ'); // 곰
      expect(text).toBe('곰');
      text = addJamo(text, 'ㅏ'); // 고마
      expect(text).toBe('고마');
      text = addJamo(text, 'ㅇ'); // 고망
      expect(text).toBe('고망');
      text = addJamo(text, 'ㅜ'); // 고망 + ㅜ → 고마우 (decomposes)
      expect(text).toBe('고마우');
      text = addJamo(text, 'ㅓ'); // 고마우 + ㅓ → 고마워 (combines ㅜ + ㅓ = ㅝ)
      expect(text).toBe('고마워');
    });
  });
});

