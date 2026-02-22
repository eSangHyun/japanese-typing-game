'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '@/features/typing-input/store/inputStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { WordCanvas } from './WordCanvas';
import { GameHUD } from './GameHUD';
import { GameOverlay } from './GameOverlay';
import { InputBar } from '@/features/typing-input/components/InputBar';
import { getWordListById, getAllWordLists, pickWords } from '@/features/word-bank/services/wordBankService';
import { audioManager } from '@/lib/audioManager';
import type { InputMode } from '@/types';
import styles from './FallingWordsGame.module.css';

export function FallingWordsGame() {
    const router = useRouter();
    // ← 렌더마다 최신 설정값을 ref로 캡처해 stale closure 방지
    const settingsRef = useRef({ speed: 3, selectedWordListId: 'accounting', inputMode: 'romaji' as InputMode });
    const settings = useSettingsStore();
    settingsRef.current = {
        speed: settings.speed,
        selectedWordListId: settings.selectedWordListId,
        inputMode: settings.inputMode,
    };

    // 오디오 설정 실시간 반영
    useEffect(() => {
        audioManager.setSettings(settings.soundEnabled, settings.sfxVolume);
    }, [settings.soundEnabled, settings.sfxVolume]);

    const {
        startGame, setCountdown, setPlaying, status,
        countdownValue, lives, combo
    } = useGameStore();

    // 라이프 감소 감지 (Miss 사운드)
    const prevLives = useRef(3);
    useEffect(() => {
        if (lives < prevLives.current && status === 'playing') {
            audioManager.playMiss();
        }
        prevLives.current = lives;
    }, [lives, status]);

    // 게임 오버 사운드
    useEffect(() => {
        if (status === 'gameover') {
            audioManager.playGameOver();
        }
    }, [status]);
    const { setInputMode } = useInputStore();

    // 게임 루프 활성화
    useGameLoop();

    // 게임 시작 — 항상 최신 settingsRef에서 읽음
    const initGame = useCallback(() => {
        const { speed, selectedWordListId, inputMode } = settingsRef.current;
        const result = getWordListById(selectedWordListId);
        const words = result.ok ? pickWords(result.data, 200) : [];
        setInputMode(inputMode);
        startGame({ mode: 'falling-words', level: speed as 1 | 2 | 3 | 4 | 5, words });
    }, [startGame, setInputMode]); // settingsRef는 ref라서 deps 불필요

    // 처음 마운트 시 게임 시작
    useEffect(() => {
        initGame();
    }, []); // eslint-disable-line

    // 카운트다운 처리
    useEffect(() => {
        if (status !== 'countdown') return;

        let count = 3;
        setCountdown(count);
        audioManager.playTick(); // 첫틱 (3)

        const timer = setInterval(() => {
            count -= 1;
            if (count === 0) {
                clearInterval(timer);
                setCountdown(0);
                audioManager.playBell(); // 완료 벨
                setTimeout(() => setPlaying(), 600);
            } else {
                setCountdown(count);
                audioManager.playTick(); // 틱 (2, 1)
            }
        }, 900);

        return () => clearInterval(timer);
    }, [status, setCountdown, setPlaying]);

    const handleRestart = () => initGame();
    const handleHome = () => router.push('/');

    // 현재 선택된 단어장 이름 표시
    const currentListName = (() => {
        const lists = getAllWordLists();
        const found = lists.find((l) => l.id === settings.selectedWordListId);
        return found ? (found.name_ko || found.name) : '단어장';
    })();

    return (
        <div className={styles.container}>
            <GameHUD listName={currentListName} />

            <div className={styles.gameArea}>
                <WordCanvas />
                <GameOverlay onRestart={handleRestart} onHome={handleHome} />
            </div>

            <InputBar />
        </div>
    );
}
