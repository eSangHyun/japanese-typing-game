'use client';

import { useGameStore } from '../store/gameStore';
import { useInputStore } from '@/features/typing-input/store/inputStore';
import { calculateWPM, calculateAccuracy } from '@/lib/wpmCalculator';
import styles from './GameHUD.module.css';

export function GameHUD({ listName }: { listName?: string }) {
    const { score, combo, lives, elapsed, correctWords, totalKeystrokes, correctKeystrokes, level } = useGameStore();
    const wpm = calculateWPM(correctWords, elapsed);
    const accuracy = calculateAccuracy(totalKeystrokes, correctKeystrokes);
    const maxLives = 3;

    return (
        <div className={styles.hud}>
            {/* 단어장 이름 */}
            {listName && (
                <div className={styles.hudItem}>
                    <span className={styles.label}>단어장</span>
                    <span className={styles.value} style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}>
                        {listName}
                    </span>
                </div>
            )}

            {/* 레벨 */}
            <div className={styles.hudItem}>
                <span className={styles.label}>LEVEL</span>
                <span className={styles.value} style={{ color: 'var(--accent-secondary)' }}>
                    {level}
                </span>
            </div>

            {/* 체력 */}
            <div className={styles.hudItem}>
                <span className={styles.label}>체력</span>
                <div className={styles.lives}>
                    {Array.from({ length: maxLives }).map((_, i) => (
                        <span
                            key={i}
                            className={`${styles.heart} ${i < lives ? styles.heartFull : styles.heartEmpty}`}
                        >
                            {i < lives ? '♥' : '♡'}
                        </span>
                    ))}
                </div>
            </div>

            {/* 점수 */}
            <div className={styles.hudItem}>
                <span className={styles.label}>SCORE</span>
                <span className={styles.value}>{score.toLocaleString()}</span>
            </div>

            {/* 콤보 */}
            <div className={styles.hudItem}>
                <span className={styles.label}>COMBO</span>
                <span
                    className={`${styles.value} ${combo > 0 ? styles.comboActive : ''}`}
                    style={{ color: combo >= 5 ? 'var(--accent-primary)' : undefined }}
                >
                    {combo > 0 ? `×${combo}` : '-'}
                </span>
            </div>

            {/* WPM */}
            <div className={styles.hudItem}>
                <span className={styles.label}>WPM</span>
                <span className={styles.value} style={{ color: 'var(--success)' }}>
                    {wpm}
                </span>
            </div>

            {/* 정확도 */}
            <div className={styles.hudItem}>
                <span className={styles.label}>정확도</span>
                <span
                    className={styles.value}
                    style={{ color: accuracy >= 90 ? 'var(--success)' : accuracy >= 70 ? 'var(--warning)' : 'var(--danger)' }}
                >
                    {accuracy}%
                </span>
            </div>
        </div>
    );
}
