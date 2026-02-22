'use client';

import { useGameStore, FLOOR_Y } from '../store/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInputStore } from '@/features/typing-input/store/inputStore';
import { isPrefixMatch } from '@/lib/romajiConverter';
import styles from './WordCanvas.module.css';

export function WordCanvas() {
    const { fallingWords } = useGameStore();
    const { showFurigana, showMeaning } = useSettingsStore();
    const { currentInput, inputMode } = useInputStore();

    return (
        <div className={styles.canvas}>
            {/* 위험선 */}
            <div className={styles.dangerLine} style={{ top: `${FLOOR_Y - 80}px` }} />

            {/* 낙하 단어들 */}
            {fallingWords.map((fw) => {
                const isActive = isPrefixMatch(currentInput, fw.word, inputMode);
                return (
                    <div
                        key={fw.instanceId}
                        className={`${styles.wordItem} ${fw.isMatched ? styles.matched : ''} ${isActive ? styles.active : ''}`}
                        style={{
                            left: `${fw.x}vw`,
                            top: `${fw.y}px`,
                            opacity: fw.opacity,
                            color: fw.color,
                        }}
                    >
                        {/* 내부 래퍼: translateX(-50%) + 애니메이션 분리 */}
                        <div className={styles.wordInner}>
                            {/* 후리가나 */}
                            {showFurigana && !fw.isMatched && (
                                <span className={styles.furigana}>{fw.word.reading}</span>
                            )}

                            {/* 메인 일본어 */}
                            <span className={styles.japanese}>
                                {fw.word.japanese}
                            </span>

                            {/* 한국어 의미 */}
                            {showMeaning && !fw.isMatched && (
                                <span className={styles.meaning}>{fw.word.meaning_ko}</span>
                            )}
                        </div>

                        {/* 정답 타격 이펙트 */}
                        {fw.isMatched && (
                            <span className={styles.hitEffect}>✓</span>
                        )}
                    </div>
                );
            })}

            {/* 바닥선 */}
            <div className={styles.floor} style={{ top: `${FLOOR_Y}px` }} />
        </div>
    );
}
