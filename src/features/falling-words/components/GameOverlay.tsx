'use client';

import { useGameStore } from '../store/gameStore';
import { calculateWPM, calculateAccuracy } from '@/lib/wpmCalculator';
import { saveSummarySession, updateBestRecord } from '@/lib/storage';
import { generateSessionId } from '@/lib/wpmCalculator';
import { useEffect } from 'react';
import styles from './GameOverlay.module.css';

interface GameOverlayProps {
    onRestart: () => void;
    onHome: () => void;
}

export function GameOverlay({ onRestart, onHome }: GameOverlayProps) {
    const {
        status, countdownValue, score, maxCombo,
        correctWords, elapsed, totalKeystrokes, correctKeystrokes,
        mode, level,
    } = useGameStore();

    const wpm = calculateWPM(correctWords, elapsed);
    const accuracy = calculateAccuracy(totalKeystrokes, correctKeystrokes);

    // 게임 종료 시 기록 저장
    useEffect(() => {
        if (status === 'gameover' || status === 'clear') {
            const session = {
                id: generateSessionId(),
                mode,
                level,
                wordListId: 'accounting',
                wpm,
                accuracy,
                totalWords: correctWords + (totalKeystrokes - correctKeystrokes),
                correctWords,
                duration: Math.floor(elapsed / 1000),
                timestamp: new Date().toISOString(),
            };
            saveSummarySession(session);
            updateBestRecord(mode, wpm, accuracy);
        }
    }, [status]); // eslint-disable-line

    if (status === 'idle') return null;

    // 카운트다운
    if (status === 'countdown') {
        return (
            <div className={styles.overlay}>
                <div className={styles.countdown}>
                    <span key={countdownValue} className={styles.countdownNumber}>
                        {countdownValue === 0 ? 'スタート！' : countdownValue}
                    </span>
                </div>
            </div>
        );
    }

    // 일시정지
    if (status === 'paused') {
        return (
            <div className={styles.overlay}>
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>⏸ 일시정지</h2>
                    <p className={styles.panelSub}>ESC 또는 버튼을 눌러 재개하세요</p>
                    <div className={styles.actions}>
                        <button className={styles.btnPrimary} onClick={() => useGameStore.getState().resumeGame()}>
                            ▶ 재개
                        </button>
                        <button className={styles.btnSecondary} onClick={onHome}>
                            🏠 홈으로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 게임 오버
    if (status === 'gameover') {
        return (
            <div className={styles.overlay}>
                <div className={styles.panel}>
                    <div className={styles.gameoverTitle}>
                        <span className={styles.gameoverEmoji}>💀</span>
                        <h2>ゲームオーバー</h2>
                    </div>
                    <ResultStats wpm={wpm} accuracy={accuracy} score={score} maxCombo={maxCombo} correctWords={correctWords} />
                    <div className={styles.actions}>
                        <button className={styles.btnPrimary} onClick={onRestart}>
                            🔄 다시 하기
                        </button>
                        <button className={styles.btnSecondary} onClick={onHome}>
                            🏠 홈으로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

function ResultStats({
    wpm, accuracy, score, maxCombo, correctWords,
}: {
    wpm: number; accuracy: number; score: number; maxCombo: number; correctWords: number;
}) {
    return (
        <div className={styles.results}>
            <div className={styles.resultItem}>
                <span className={styles.resultLabel}>WPM</span>
                <span className={styles.resultValue} style={{ color: 'var(--success)' }}>{wpm}</span>
            </div>
            <div className={styles.resultItem}>
                <span className={styles.resultLabel}>정확도</span>
                <span className={styles.resultValue}>{accuracy}%</span>
            </div>
            <div className={styles.resultItem}>
                <span className={styles.resultLabel}>점수</span>
                <span className={styles.resultValue} style={{ color: 'var(--accent-primary)' }}>
                    {score.toLocaleString()}
                </span>
            </div>
            <div className={styles.resultItem}>
                <span className={styles.resultLabel}>최대콤보</span>
                <span className={styles.resultValue} style={{ color: 'var(--accent-secondary)' }}>
                    ×{maxCombo}
                </span>
            </div>
            <div className={styles.resultItem}>
                <span className={styles.resultLabel}>맞춘 단어</span>
                <span className={styles.resultValue}>{correctWords}개</span>
            </div>
        </div>
    );
}
