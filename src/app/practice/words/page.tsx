'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Word, WordList } from '@/types';
import { getAllWordLists, getWordsByListIds } from '@/features/word-bank/services/wordBankService';
import { useSettingsStore } from '@/stores/settingsStore';
import { isCorrectInput } from '@/lib/romajiConverter';
import { calculateWPM, calculateAccuracy } from '@/lib/wpmCalculator';
import { saveSummarySession, updateBestRecord } from '@/lib/storage';
import { generateSessionId } from '@/lib/wpmCalculator';
import { audioManager } from '@/lib/audioManager';
import styles from './page.module.css';

// ─── 세션 상태 타입 ────────────────────────────────────────────────────────
type PracticeStatus = 'setup' | 'playing' | 'result';

type WordResult = {
    word: Word;
    userInput: string;
    correct: boolean;
    timeMs: number;
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function WordPracticePage() {
    const { inputMode, soundEnabled, sfxVolume } = useSettingsStore();

    // 오디오 설정 매칭
    useEffect(() => {
        audioManager.setSettings(soundEnabled, sfxVolume);
    }, [soundEnabled, sfxVolume]);

    // 단어장 선택
    const [lists, setLists] = useState<WordList[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>(['accounting']);
    const [wordCount, setWordCount] = useState(20);

    // 게임 상태
    const [status, setStatus] = useState<PracticeStatus>('setup');
    const [queue, setQueue] = useState<Word[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [input, setInput] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [results, setResults] = useState<WordResult[]>([]);
    const [startTime, setStartTime] = useState(0);    // 세션 시작
    const [wordStart, setWordStart] = useState(0);    // 현재 단어 시작
    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
    const [shake, setShake] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setLists(getAllWordLists()); }, []);

    // 단어장 선택 토글
    const toggleList = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.length > 1 ? prev.filter((x) => x !== id) : prev  // 최소 1개 유지
                : [...prev, id]
        );
    };

    // 연습 시작
    const startPractice = useCallback(() => {
        const allWords = getWordsByListIds(selectedIds);
        if (allWords.length === 0) return;
        const shuffled = [...allWords].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(wordCount, shuffled.length));
        setQueue(picked);
        setCurrentIdx(0);
        setResults([]);
        setInput('');
        setTotalKeystrokes(0);
        setCorrectKeystrokes(0);
        const now = Date.now();
        setStartTime(now);
        setWordStart(now);
        setStatus('playing');
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [selectedIds, wordCount]);

    // 현재 단어
    const currentWord = queue[currentIdx] ?? null;

    // 입력 처리
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        setTotalKeystrokes((t) => t + 1);

        if (!isComposing && currentWord) {
            if (isCorrectInput(val, currentWord, inputMode)) {
                advanceWord(val, true);
            }
        }
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
        setIsComposing(false);
        const composed = e.data;
        if (currentWord && isCorrectInput(composed, currentWord, inputMode)) {
            advanceWord(composed, true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isComposing) {
            // Enter로 정답 제출 (틀려도 넘기기)
            if (currentWord) {
                const correct = isCorrectInput(input, currentWord, inputMode);
                if (!correct) {
                    triggerShake();
                    audioManager.playError();
                }
                advanceWord(input, correct);
            }
        }
        if (e.key === 'Escape') setStatus('setup');
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 400);
    };

    const advanceWord = (userInput: string, correct: boolean) => {
        const elapsed = Date.now() - wordStart;
        const newResult: WordResult = {
            word: currentWord!,
            userInput,
            correct,
            timeMs: elapsed,
        };
        const newResults = [...results, newResult];
        setResults(newResults);
        if (correct) {
            setCorrectKeystrokes((c) => c + (currentWord?.reading.length ?? 0));
            audioManager.playCorrect();
        }
        setInput('');

        const nextIdx = currentIdx + 1;
        if (nextIdx >= queue.length) {
            // 연습 종료
            finishPractice(newResults);
        } else {
            setCurrentIdx(nextIdx);
            setWordStart(Date.now());
        }
    };

    const finishPractice = (finalResults: WordResult[]) => {
        setStatus('result');
        audioManager.playGameOver();
        const elapsed = Date.now() - startTime;
        const correctCount = finalResults.filter((r) => r.correct).length;
        const wpm = calculateWPM(correctCount, elapsed);
        const accuracy = calculateAccuracy(totalKeystrokes, correctKeystrokes);
        saveSummarySession({
            id: generateSessionId(),
            mode: 'word-practice',
            level: 1,
            wordListId: selectedIds.join(','),
            wpm,
            accuracy,
            totalWords: finalResults.length,
            correctWords: correctCount,
            duration: Math.floor(elapsed / 1000),
            timestamp: new Date().toISOString(),
        });
        updateBestRecord('word-practice', wpm, accuracy);
    };

    // 결과 통계
    const resultStats = (() => {
        if (results.length === 0) return null;
        const elapsed = Date.now() - startTime;
        const correctCount = results.filter((r) => r.correct).length;
        const wpm = calculateWPM(correctCount, elapsed > 0 ? elapsed : 1);
        const accuracy = Math.round((correctCount / results.length) * 100);
        const avgTime = Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length / 100) / 10;
        return { correctCount, wpm, accuracy, avgTime, total: results.length };
    })();

    const progress = queue.length > 0 ? ((currentIdx) / queue.length) * 100 : 0;

    // ─── 셋업 화면 ────────────────────────────────────────────────────────────
    if (status === 'setup') {
        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backBtn}>← 홈</Link>
                    <h1 className={`${styles.title} jp`}>単語練習</h1>
                    <Link href="/wordbank" className={styles.manageBtn}>📚 단어장 관리</Link>
                </header>

                <div className={styles.setupBody}>
                    {/* 단어장 선택 */}
                    <section className={styles.setupSection}>
                        <h2 className={styles.setupSectionTitle}>
                            📂 단어장 선택 <span className={styles.setupHint}>(복수 선택 가능)</span>
                        </h2>
                        <div className={styles.listGrid}>
                            {lists.map((list) => (
                                <button
                                    key={list.id}
                                    className={`${styles.listCard} ${selectedIds.includes(list.id) ? styles.listCardActive : ''}`}
                                    onClick={() => toggleList(list.id)}
                                >
                                    <div className={styles.listCardCheck}>
                                        {selectedIds.includes(list.id) ? '✓' : ''}
                                    </div>
                                    <div className={styles.listCardInfo}>
                                        <span className={`${styles.listCardName} jp`}>{list.name}</span>
                                        <span className={styles.listCardSub}>{list.name_ko} · {list.words.length}개</span>
                                    </div>
                                    {list.isBuiltIn && <span className={styles.builtinTag}>내장</span>}
                                </button>
                            ))}
                        </div>
                        <p className={styles.selectedCount}>
                            선택된 단어장: <strong>{selectedIds.length}개</strong> ·
                            총 단어: <strong>{getWordsByListIds(selectedIds).length}개</strong>
                        </p>
                    </section>

                    {/* 출제 수 */}
                    <section className={styles.setupSection}>
                        <h2 className={styles.setupSectionTitle}>🎯 출제 수</h2>
                        <div className={styles.countBtns}>
                            {[10, 20, 30, 50].map((n) => (
                                <button
                                    key={n}
                                    className={`${styles.countBtn} ${wordCount === n ? styles.countBtnActive : ''}`}
                                    onClick={() => setWordCount(n)}
                                >
                                    {n}개
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 시작 버튼 */}
                    <button
                        className={styles.startBtn}
                        onClick={startPractice}
                        disabled={selectedIds.length === 0}
                    >
                        連習スタート ▶
                    </button>
                </div>
            </div>
        );
    }

    // ─── 결과 화면 ────────────────────────────────────────────────────────────
    if (status === 'result') {
        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setStatus('setup')}>← 다시 설정</button>
                    <h1 className={`${styles.title} jp`}>練習結果</h1>
                    <button className={styles.manageBtn} onClick={startPractice}>🔄 다시 연습</button>
                </header>

                <div className={styles.resultBody}>
                    {resultStats && (
                        <div className={styles.resultStats}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>정답</span>
                                <span className={styles.statValue} style={{ color: 'var(--success)' }}>
                                    {resultStats.correctCount} / {resultStats.total}
                                </span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>정확도</span>
                                <span className={styles.statValue} style={{ color: 'var(--accent-primary)' }}>
                                    {resultStats.accuracy}%
                                </span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>WPM</span>
                                <span className={styles.statValue} style={{ color: 'var(--info)' }}>
                                    {resultStats.wpm}
                                </span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>단어 평균</span>
                                <span className={styles.statValue}>{resultStats.avgTime}s</span>
                            </div>
                        </div>
                    )}

                    {/* 오답 목록 */}
                    {results.filter((r) => !r.correct).length > 0 && (
                        <section className={styles.resultSection}>
                            <h2 className={styles.resultSectionTitle}>❌ 오답 목록</h2>
                            <div className={styles.resultList}>
                                {results.filter((r) => !r.correct).map((r, i) => (
                                    <div key={i} className={`${styles.resultRow} ${styles.resultRowWrong}`}>
                                        <span className={`${styles.resultJp} jp`}>{r.word.japanese}</span>
                                        <span className={`${styles.resultReading} jp`}>{r.word.reading}</span>
                                        <span className={styles.resultAnswer}>{r.word.romaji}</span>
                                        <span className={styles.resultMeaning}>{r.word.meaning_ko}</span>
                                        <span className={styles.resultUserInput} style={{ color: 'var(--danger)' }}>
                                            입력: "{r.userInput || '(없음)'}"
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 전체 결과 */}
                    <section className={styles.resultSection}>
                        <h2 className={styles.resultSectionTitle}>📋 전체 결과</h2>
                        <div className={styles.resultList}>
                            {results.map((r, i) => (
                                <div key={i} className={`${styles.resultRow} ${r.correct ? styles.resultRowOk : styles.resultRowWrong}`}>
                                    <span className={styles.resultMark}>{r.correct ? '✓' : '✗'}</span>
                                    <span className={`${styles.resultJp} jp`}>{r.word.japanese}</span>
                                    <span className={`${styles.resultReading} jp`}>{r.word.reading}</span>
                                    <span className={styles.resultMeaning}>{r.word.meaning_ko}</span>
                                    <span className={styles.resultTime}>{(r.timeMs / 1000).toFixed(1)}s</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    // ─── 연습 화면 ────────────────────────────────────────────────────────────
    return (
        <div className={styles.practicePage}>
            {/* 상단 HUD */}
            <div className={styles.practiceHud}>
                <button className={styles.exitBtn} onClick={() => setStatus('setup')}>✕ 나가기</button>
                <div className={styles.progressWrapper}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <span className={styles.progressText}>{currentIdx} / {queue.length}</span>
                </div>
                <span className={styles.modeTag}>
                    {inputMode === 'romaji' ? 'ローマ字' : 'かな'}
                </span>
            </div>

            {/* 카드 영역 */}
            <div className={styles.practiceCenter}>
                {currentWord && (
                    <div className={`${styles.wordCard} ${shake ? styles.wordCardShake : ''}`}>
                        {/* 번호 */}
                        <div className={styles.wordNum}>{currentIdx + 1} / {queue.length}</div>

                        {/* 일본어 */}
                        <div className={`${styles.wordJp} jp`}>{currentWord.japanese}</div>

                        {/* 후리가나 힌트 — 기본 숨김 */}
                        <div className={styles.furiganaHint}>
                            <span className={`jp`}>{currentWord.reading}</span>
                            <span className={styles.hintLabel}>({currentWord.romaji})</span>
                        </div>

                        <div className={styles.wordMeaning}>{currentWord.meaning_ko}</div>

                        {/* 입력창 */}
                        <input
                            ref={inputRef}
                            className={`${styles.practiceInput} ${shake ? styles.practiceInputError : ''}`}
                            value={input}
                            onChange={handleChange}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={handleCompositionEnd}
                            onKeyDown={handleKeyDown}
                            placeholder={inputMode === 'romaji' ? 'romaji로 입력...' : 'かなで入力...'}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />

                        <p className={styles.enterHint}>Enter로 건너뛰기 · ESC 종료</p>
                    </div>
                )}
            </div>

            {/* 최근 결과 미니 히스토리 */}
            <div className={styles.miniHistory}>
                {results.slice(-5).reverse().map((r, i) => (
                    <div key={i} className={`${styles.miniItem} ${r.correct ? styles.miniOk : styles.miniWrong}`}>
                        <span className={`jp`}>{r.word.japanese}</span>
                        <span>{r.correct ? '✓' : '✗'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
