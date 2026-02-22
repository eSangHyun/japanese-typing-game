'use client';

import { useGameStore } from '@/features/falling-words/store/gameStore';
import { useInputStore } from '@/features/typing-input/store/inputStore';
import { isCorrectInput } from '@/lib/romajiConverter';
import { audioManager } from '@/lib/audioManager';
import { useRef, useEffect, type ChangeEvent, type CompositionEvent, type KeyboardEvent } from 'react';
import styles from './InputBar.module.css';

export function InputBar() {
    const { fallingWords, matchWord, status, addKeystroke } = useGameStore();
    const {
        rawInput, currentInput, inputMode, isComposing,
        setRawInput, clearInput, setComposing, setComposedInput,
    } = useInputStore();
    const { pauseGame, resumeGame } = useGameStore();
    const inputRef = useRef<HTMLInputElement>(null);

    // status가 'playing'이 되는 순간 자동 포커스
    useEffect(() => {
        if (status === 'playing') {
            // 약간의 지연으로 DOM 업데이트 후 포커스
            const id = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(id);
        }
    }, [status]);

    const checkMatch = (input: string) => {
        const activeFallingWords = fallingWords.filter(w => !w.isMatched);
        for (const fw of activeFallingWords) {
            if (isCorrectInput(input, fw.word, inputMode)) {
                matchWord(fw.instanceId);
                audioManager.playCorrect();
                clearInput();
                return true;
            }
        }
        return false;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRawInput(value);

        // Romaji 모드: 실시간 변환 후 비교 (IME 조합 중 제외)
        if (inputMode === 'romaji' && !isComposing) {
            if (value && !checkMatch(value)) {
                addKeystroke(false);
                // 오타 시 가벼운 에러음 (매 순간 나면 시끄러울 수 있으므로 로직 고민 필요하나 일단 추가)
                // audioManager.playError(); 
            }
        }
    };

    const handleCompositionStart = () => setComposing(true);

    const handleCompositionEnd = (e: CompositionEvent<HTMLInputElement>) => {
        const composed = e.data;
        setComposedInput(composed);
        checkMatch(composed);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            if (status === 'playing') pauseGame();
            else if (status === 'paused') resumeGame();
        }
    };

    const modeLabel = inputMode === 'romaji' ? 'ローマ字' : inputMode === 'hiragana' ? 'ひらがな' : 'カタカナ';

    return (
        <div className={styles.wrapper}>
            <span className={styles.modeTag}>{modeLabel}</span>

            <div className={styles.inputContainer}>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    value={rawInput}
                    onChange={handleChange}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onKeyDown={handleKeyDown}
                    placeholder={inputMode === 'romaji' ? 'romaji 입력...' : 'かな 입력...'}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    disabled={status !== 'playing'}
                />

                {/* 변환된 히라가나 미리보기 */}
                {inputMode === 'romaji' && currentInput && (
                    <span className={styles.convertedPreview}>{currentInput}</span>
                )}
            </div>

            <div className={styles.hint}>
                <kbd>ESC</kbd> 일시정지
            </div>
        </div>
    );
}
