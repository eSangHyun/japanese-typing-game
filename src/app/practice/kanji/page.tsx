'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toHiragana } from '@/lib/romajiConverter';
import { KanjiWord } from '@/types';
import kanjiDataJson from '@/assets/kanji/kanji_list.json';
import styles from './page.module.css';
import { calculateWPM, calculateAccuracy, generateSessionId } from '@/lib/wpmCalculator';
import { saveSummarySession, updateBestRecord } from '@/lib/storage';
import { audioManager } from '@/lib/audioManager';
import { useSettingsStore } from '@/stores/settingsStore';

const KANJI_DATA = kanjiDataJson as KanjiWord[];

type Screen = 'setup' | 'playing' | 'result';

export default function KanjiPracticePage() {
    const [screen, setScreen] = useState<Screen>('setup');

    // Setup state
    const [difficulty, setDifficulty] = useState<string>('all');
    const [questionCount, setQuestionCount] = useState<number>(10);

    // Play state
    const [questions, setQuestions] = useState<KanjiWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [results, setResults] = useState<{ word: KanjiWord; time: number; ok: boolean; selected: string }[]>([]);
    const [lastAction, setLastAction] = useState<'ok' | 'ng' | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const playStartTime = useRef(0);
    const settings = useSettingsStore();

    // 오디오 설정 매칭
    useEffect(() => {
        audioManager.setSettings(settings.soundEnabled, settings.sfxVolume);
    }, [settings.soundEnabled, settings.sfxVolume]);

    // Start game
    const start = () => {
        let pool = [...KANJI_DATA];
        if (difficulty === '1-2') pool = pool.filter(k => k.difficulty <= 2);
        if (difficulty === '3-5') pool = pool.filter(k => k.difficulty >= 3);

        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, questionCount);
        setQuestions(shuffled);
        setCurrentIndex(0);
        setInput('');
        setIsConverting(false);
        setMistakes(0);
        setResults([]);
        setScreen('playing');
        setStartTime(Date.now());
        playStartTime.current = Date.now();
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const currentQuestion = questions[currentIndex];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (screen !== 'playing' || !currentQuestion) return;

        // Space: Convert
        if (e.key === ' ') {
            e.preventDefault();
            const inputHira = toHiragana(input);
            if (inputHira === currentQuestion.reading) {
                if (!isConverting) {
                    setIsConverting(true);
                    setSelectedIdx(0);
                } else {
                    setSelectedIdx((prev) => (prev + 1) % currentQuestion.candidates.length);
                }
            } else {
                // Not matching reading yet - just a space? In real IME it's ignored or triggers conversion of what's there.
                // For simplicity, we only allow conversion when reading fully matches.
            }
            return;
        }

        // Enter: Select/Submit
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isConverting) {
                const selected = currentQuestion.candidates[selectedIdx];
                const isOk = selected === currentQuestion.correctKanji;

                submitAnswer(selected, isOk);
            } else {
                // Direct enter without space? Maybe user wants to input hiragana directly?
                // In this mode, we enforce conversion.
                const inputHira = toHiragana(input);
                if (inputHira === currentQuestion.reading) {
                    // If it matches exactly but user didn't hit space, we can auto-submit first candidate or hiragana.
                    // But usually Kanji practice is about selecting. Let's just do nothing or show hint.
                }
            }
            return;
        }

        // Backspace: Reset conversion
        if (e.key === 'Backspace') {
            if (isConverting) {
                setIsConverting(false);
                return;
            }
        }

        // Esc: Cancel conversion
        if (e.key === 'Escape') {
            if (isConverting) {
                setIsConverting(false);
                return;
            }
            if (confirm('게임을 종료하시겠습니까?')) {
                setScreen('setup');
            }
        }
    };

    const submitAnswer = (selected: string, isOk: boolean) => {
        const timeTaken = Date.now() - startTime;
        setResults(prev => [...prev, { word: currentQuestion, time: timeTaken, ok: isOk, selected }]);

        if (!isOk) {
            setMistakes(prev => prev + 1);
            audioManager.playError();
        } else {
            audioManager.playCorrect();
        }

        setLastAction(isOk ? 'ok' : 'ng');
        setTimeout(() => setLastAction(null), 500);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setInput('');
            setIsConverting(false);
            setStartTime(Date.now());
        } else {
            finish();
        }
    };

    const finish = () => {
        setScreen('result');
        audioManager.playGameOver();
        const totalElapsed = Date.now() - playStartTime.current;

        // Save to global stats
        const totalChars = results.reduce((acc, r) => acc + r.word.correctKanji.length, 0) + (isConverting ? 0 : 0); // approx
        // Using a more accurate character count for WPM: reading length based
        const totalReadingChars = questions.reduce((acc, q) => acc + q.reading.length, 0);

        const wpm = calculateWPM(totalReadingChars, totalElapsed);
        const accuracy = Math.round((results.filter(r => r.ok).length / questions.length) * 100);

        const session = {
            id: generateSessionId(),
            mode: 'kanji-convert' as const,
            level: difficulty === 'all' ? 3 : difficulty === '1-2' ? 1 : 4,
            wordListId: 'internal-kanji',
            wpm,
            accuracy,
            totalWords: questions.length,
            correctWords: results.filter(r => r.ok).length,
            duration: totalElapsed,
            timestamp: new Date().toISOString(),
        };

        saveSummarySession(session);
        updateBestRecord('kanji-convert', wpm, accuracy);
    };


    // ─── UI ──────────────────────────────────────────────────────────────────

    if (screen === 'setup') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backBtn}>← 홈</Link>
                    <h1 className={`${styles.title} jp`}>漢字変換練習</h1>
                    <div className={styles.score}></div>
                </header>

                <main className={styles.container}>
                    <div className={styles.setupCard}>
                        <h2 className={styles.setupTitle}>한자 변환 연습</h2>

                        <div className={styles.setupSection}>
                            <p className={styles.label}>난이도 선택</p>
                            <div className={styles.btnGroup}>
                                {['all', '1-2', '3-5'].map(d => (
                                    <button
                                        key={d}
                                        className={`${styles.optionBtn} ${difficulty === d ? styles.optionBtnActive : ''}`}
                                        onClick={() => setDifficulty(d)}
                                    >
                                        {d === 'all' ? '전체' : d === '1-2' ? '초급 (1-2)' : '중고급 (3-5)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.setupSection}>
                            <p className={styles.label}>문항 수</p>
                            <div className={styles.btnGroup}>
                                {[10, 20, 30].map(c => (
                                    <button
                                        key={c}
                                        className={`${styles.optionBtn} ${questionCount === c ? styles.optionBtnActive : ''}`}
                                        onClick={() => setQuestionCount(c)}
                                    >
                                        {c}문항
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className={styles.startBtn} onClick={start}>시작하기</button>
                    </div>
                </main>
            </div>
        );
    }

    if (screen === 'playing') {
        const inputHira = toHiragana(input);
        const isMatched = inputHira === currentQuestion.reading;

        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setScreen('setup')}>← 중단</button>
                    <h1 className={`${styles.title} jp`}>漢字変換</h1>
                    <div className={styles.score}>Miss: {mistakes}</div>
                </header>

                <main className={styles.container}>
                    <div className={styles.gameArea}>
                        <div className={styles.progressWrap}>
                            <div className={styles.progressText}>{currentIndex + 1} / {questions.length}</div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className={styles.promptCard}>
                            <div className={styles.meaning}>{currentQuestion.meaning_ko}</div>
                            <div className={`${styles.reading} jp`}>{currentQuestion.reading}</div>
                        </div>

                        <div className={styles.inputArea}>
                            <input
                                ref={inputRef}
                                className={`${styles.input} jp ${lastAction === 'ok' ? styles.inputOk : lastAction === 'ng' ? styles.inputNg : ''}`}
                                value={isConverting ? currentQuestion.candidates[selectedIdx] : inputHira}
                                onChange={(e) => !isConverting && setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="로마자 입력..."
                                autoFocus
                            />

                            {isConverting && (
                                <div className={styles.candidateList}>
                                    {currentQuestion.candidates.map((cand, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.candidateItem} ${selectedIdx === i ? styles.candidateActive : ''}`}
                                            onClick={() => { setSelectedIdx(i); inputRef.current?.focus(); }}
                                        >
                                            <span className={styles.candidateIndex}>{i + 1}</span>
                                            <span className={`${styles.candidateText} jp`}>{cand}</span>
                                            {cand === currentQuestion.correctKanji && selectedIdx === i && <span className={styles.label}>✔</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.hint}>
                                {!isMatched && <span>히라가나를 끝까지 입력하세요.</span>}
                                {isMatched && !isConverting && (
                                    <>
                                        <kbd className={styles.kbd}>Space</kbd> 변환
                                        <kbd className={styles.kbd}>Enter</kbd> 확정
                                    </>
                                )}
                                {isConverting && (
                                    <>
                                        <kbd className={styles.kbd}>Space</kbd> 다음 후보
                                        <kbd className={styles.kbd}>Enter</kbd> 선택
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (screen === 'result') {
        const totalElapsed = results.reduce((acc, r) => acc + r.time, 0);
        const avgTime = Math.round(totalElapsed / questions.length / 1000 * 10) / 10;
        const accuracy = Math.round((results.filter(r => r.ok).length / questions.length) * 100);

        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.backBtn}></div>
                    <h1 className={`${styles.title}`}>RESULT</h1>
                    <div className={styles.score}></div>
                </header>

                <main className={styles.container}>
                    <div className={styles.resultCard}>
                        <h2 className={styles.resultTitle}>연습 종료!</h2>

                        <div className={styles.statGrid}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>정확도</span>
                                <span className={styles.statValue}>{accuracy}%</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>평균 시간</span>
                                <span className={styles.statValue}>{avgTime}s</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>오타</span>
                                <span className={styles.statValue}>{mistakes}</span>
                            </div>
                        </div>

                        <div className={styles.actionRow}>
                            <button className={styles.retryBtn} onClick={start}>다시 하기</button>
                            <Link href="/" className={styles.homeBtn}>홈으로</Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return null;
}
