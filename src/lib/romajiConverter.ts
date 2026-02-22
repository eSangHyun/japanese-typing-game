import * as wanakana from 'wanakana';
import type { Word, InputMode } from '@/types';

/**
 * 로마자를 히라가나로 변환 (IMEMode: 미완성 입력 허용)
 * 예: "shi" → "し", "sh" → "sh" (미완성)
 */
export function toHiragana(romaji: string): string {
    return wanakana.toHiragana(romaji, { IMEMode: true });
}

/**
 * 입력이 단어의 정답인지 판별
 * - romaji 모드: 히라가나 변환 후 word.reading과 비교
 * - hiragana/katakana 모드: 입력을 word.reading과 직접 비교
 */
export function isCorrectInput(
    input: string,
    word: Word,
    inputMode: InputMode
): boolean {
    if (!input) return false;
    const target = word.reading.toLowerCase();

    if (inputMode === 'romaji') {
        const converted = wanakana.toHiragana(input, { IMEMode: true });
        return converted === target;
    }
    return input === target;
}

/**
 * 입력이 단어의 접두사인지 확인 (진행 중 하이라이트용)
 */
export function isPrefixMatch(
    input: string,
    word: Word,
    inputMode: InputMode
): boolean {
    if (!input) return false;
    const target = word.reading;

    if (inputMode === 'romaji') {
        const converted = wanakana.toHiragana(input, { IMEMode: true });
        return target.startsWith(converted);
    }
    return target.startsWith(input);
}

/**
 * 히라가나 문자열을 로마자로 변환 (힌트 표시용)
 */
export function toRomaji(hiragana: string): string {
    return wanakana.toRomaji(hiragana);
}

/**
 * 가타카나를 히라가나로 변환
 */
export function katakanaToHiragana(katakana: string): string {
    return wanakana.toHiragana(katakana);
}

/**
 * 입력 진행도 계산 (0 ~ 1)
 */
export function getInputProgress(
    input: string,
    word: Word,
    inputMode: InputMode
): number {
    if (!input) return 0;
    const target = word.reading;

    if (inputMode === 'romaji') {
        const converted = wanakana.toHiragana(input, { IMEMode: true });
        if (!target.startsWith(converted)) return 0;
        return converted.length / target.length;
    }
    if (!target.startsWith(input)) return 0;
    return input.length / target.length;
}
