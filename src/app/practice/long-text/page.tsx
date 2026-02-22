'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { toHiragana, toRomaji } from '@/lib/romajiConverter';
import { calculateWPM, calculateAccuracy, generateSessionId } from '@/lib/wpmCalculator';
import { saveSummarySession, updateBestRecord } from '@/lib/storage';
import { audioManager } from '@/lib/audioManager';
import { useSettingsStore } from '@/stores/settingsStore';
import { LongText } from '@/types';
import longTextsJson from '@/assets/texts/long_texts.json';
import styles from './page.module.css';

const LONG_TEXTS = longTextsJson as LongText[];

type Screen = 'setup' | 'playing' | 'result';

export default function LongTextPracticePage() {
    const [screen, setScreen] = useState<Screen>('setup');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Play state
    const [currentText, setCurrentText] = useState<LongText | null>(null);
    const [lines, setLines] = useState<{ content: string; reading: string }[]>([]);
    const [lineIdx, setLineIdx] = useState(0);
    const [input, setInput] = useState('');
    const [totalChars, setTotalChars] = useState(0); // Cumulative chars for WPM
    const [mistakes, setMistakes] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [allResults, setAllResults] = useState<{ wpm: number; accuracy: number; time: number } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const settings = useSettingsStore();

    // 오디오 설정 매칭
    useEffect(() => {
        audioManager.setSettings(settings.soundEnabled, settings.sfxVolume);
    }, [settings.soundEnabled, settings.sfxVolume]);

    // ─── Setup ───────────────────────────────────────────────────────────────

    const startSession = () => {
        if (!selectedId) return;
        const text = LONG_TEXTS.find(t => t.id === selectedId);
        if (!text) return;

        // Split text into meaningful chunks (lines ending with punctuation)
        const contentLines = text.content.match(/[^。？！]+[。？！]?/g) || [text.content];
        const readingLines = text.reading.match(/[^。？！]+[。？！]?/g) || [text.reading];

        // Ensure they match in length (safety)
        const combinedLines = contentLines.map((c, i) => ({
            content: c.trim(),
            reading: readingLines[i]?.trim() || ''
        }));

        setCurrentText(text);
        setLines(combinedLines);
        setLineIdx(0);
        setInput('');
        setTotalChars(0);
        setMistakes(0);
        setScreen('playing');
        setStartTime(Date.now());
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // ─── Play Logic ──────────────────────────────────────────────────────────

    const currentLine = lines[lineIdx];
    const expectedRomaji = useMemo(() => {
        if (!currentLine) return '';
        return toRomaji(currentLine.reading);
    }, [currentLine]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const hira = toHiragana(val);

        // Error detection
        if (hira.length > input.length) {
            const lastChar = hira[hira.length - 1];
            const expectedChar = currentLine.reading[hira.length - 1];
            if (lastChar !== expectedChar) {
                setMistakes(prev => prev + 1);
                audioManager.playMiss();
            }
        }

        setInput(val);

        // Completion check
        if (hira === currentLine.reading) {
            audioManager.playCorrect();
            moveToNextLine();
        }
    };

    const moveToNextLine = () => {
        const hiraLen = currentLine.reading.length;
        setTotalChars(prev => prev + hiraLen);

        if (lineIdx < lines.length - 1) {
            setLineIdx(prev => prev + 1);
            setInput('');
            // Scroll to next line if needed
            setTimeout(() => {
                const activeLine = document.getElementById(`line-${lineIdx + 1}`);
                if (activeLine && scrollContainerRef.current) {
                    activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        } else {
            finishSession();
        }
    };

    const finishSession = () => {
        const elapsed = Date.now() - startTime;
        const finalTotalChars = totalChars + currentLine.reading.length;
        const wpm = calculateWPM(finalTotalChars, elapsed);

        // For accuracy, use total reading length and mistakes
        const totalReadingLen = lines.reduce((acc, l) => acc + l.reading.length, 0);
        // Correct chars = total length - mistakes? Not quite, but let's use a standard formula.
        // Actually wpmCalculator.calculateAccuracy uses keystrokes. 
        // For simplicity let's use: (totalLength - mistakes) / totalLength
        const accuracy = Math.max(0, Math.round(((totalReadingLen - mistakes) / totalReadingLen) * 100));

        const res = { wpm, accuracy, time: elapsed };
        setAllResults(res);
        setScreen('result');
        audioManager.playGameOver();

        // Save session
        saveSummarySession({
            id: generateSessionId(),
            mode: 'long-text',
            level: currentText?.difficulty || 3,
            wordListId: currentText?.id || 'long-text',
            wpm,
            accuracy,
            totalWords: lines.length,
            correctWords: lines.length, // Completed all lines
            duration: elapsed,
            timestamp: new Date().toISOString()
        });
        updateBestRecord('long-text', wpm, accuracy);
    };

    // ─── Rendering ───────────────────────────────────────────────────────────

    // Character Highlight Generator
    const renderHighlights = (reading: string, currentHira: string) => {
        return reading.split('').map((char, i) => {
            let status = styles.charPending;
            if (i < currentHira.length) {
                status = currentHira[i] === char ? styles.charOk : styles.charNg;
            } else if (i === currentHira.length) {
                status = styles.charCur;
            }
            return <span key={i} className={status}>{char}</span>;
        });
    };

    if (screen === 'setup') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backBtn}>← 홈</Link>
                    <h1 className={`${styles.title} jp`}>長文練習</h1>
                    <div className={styles.stats}></div>
                </header>

                <main className={styles.container}>
                    <div className={styles.setupCard}>
                        <h2>연습할 글 선택</h2>
                        <div className={styles.textList}>
                            {LONG_TEXTS.map(text => (
                                <div
                                    key={text.id}
                                    className={`${styles.textItem} ${selectedId === text.id ? styles.textItemActive : ''}`}
                                    onClick={() => setSelectedId(text.id)}
                                >
                                    <div className={styles.textMain}>
                                        <span className={styles.textTitle}>{text.title}</span>
                                        <span className={styles.textAuthor}>{text.author}</span>
                                    </div>
                                    <div className={styles.textMeta}>
                                        <span className={styles.diffBadge}>{'★'.repeat(text.difficulty)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className={styles.startBtn}
                            disabled={!selectedId}
                            onClick={startSession}
                        >
                            시작하기
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (screen === 'playing') {
        const currentHira = toHiragana(input);
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setScreen('setup')}>← 중단</button>
                    <h1 className={`${styles.title} jp`}>{currentText?.title}</h1>
                    <div className={styles.stats}>
                        <span>Miss: {mistakes}</span>
                    </div>
                </header>

                <main className={styles.container}>
                    <div className={styles.playingLayout}>
                        <div className={styles.textArea} ref={scrollContainerRef}>
                            {lines.map((l, i) => (
                                <div
                                    key={i}
                                    id={`line-${i}`}
                                    className={`${styles.lineWrapper} ${i === lineIdx ? styles.lineActive : styles.linePassive}`}
                                >
                                    <div className={`${styles.contentLine} jp`}>{l.content}</div>
                                    <div className={`${styles.readingLine} jp`}>
                                        {i === lineIdx ? renderHighlights(l.reading, currentHira) : l.reading}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <input
                            ref={inputRef}
                            className={styles.inputField}
                            value={input}
                            onChange={handleChange}
                            placeholder="로마자 타이핑..."
                            autoFocus
                        />

                        <div className={styles.footer}>
                            <span className={styles.progressLabel}>Progress: {lineIdx + 1} / {lines.length}</span>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (screen === 'result') {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.backBtn}></div>
                    <h1 className={`${styles.title}`}>RESULT</h1>
                    <div className={styles.stats}></div>
                </header>

                <main className={styles.container}>
                    <div className={styles.resultCard}>
                        <h2>연습 결과</h2>
                        <div className={styles.resultGrid}>
                            <div className={styles.resItem}>
                                <span className={styles.resLabel}>평균 속도</span>
                                <span className={styles.resValue}>{allResults?.wpm} WPM</span>
                            </div>
                            <div className={styles.resItem}>
                                <span className={styles.resLabel}>정확도</span>
                                <span className={styles.resValue}>{allResults?.accuracy}%</span>
                            </div>
                            <div className={styles.resItem}>
                                <span className={styles.resLabel}>오타</span>
                                <span className={styles.resValue}>{mistakes}</span>
                            </div>
                            <div className={styles.resItem}>
                                <span className={styles.resLabel}>소요 시간</span>
                                <span className={styles.resValue}>{Math.round((allResults?.time || 0) / 1000)}s</span>
                            </div>
                        </div>
                        <div className={styles.resActions}>
                            <button className={`${styles.resBtn} ${styles.btnPrimary}`} onClick={startSession}>다시 하기</button>
                            <Link href="/" className={`${styles.resBtn} ${styles.btnSecondary}`}>홈으로</Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return null;
}
