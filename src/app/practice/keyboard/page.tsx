'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SEION, DAKUTEN, HANDAKUTEN, YOUON, getKanaSet, checkKanaInput } from '@/lib/kanaData';
import type { Kana, KanaSet } from '@/lib/kanaData';
import { calculateWPM } from '@/lib/wpmCalculator';
import { audioManager } from '@/lib/audioManager';
import { useSettingsStore } from '@/stores/settingsStore';
import styles from './page.module.css';

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const ROUND_COUNT = 30;

type Status = 'setup' | 'playing' | 'result';
type ResultEntry = { kana: Kana; input: string; correct: boolean; ms: number };

const SET_OPTIONS: { id: KanaSet; label: string; sub: string; count: number }[] = [
    { id: 'seion', label: '清音', sub: '청음 (기본 46자)', count: SEION.length },
    { id: 'dakuten', label: '濁音', sub: '탁음 (20자)', count: DAKUTEN.length },
    { id: 'handakuten', label: '半濁音', sub: '반탁음 (5자)', count: HANDAKUTEN.length },
    { id: 'youon', label: '拗音', sub: '요음 (33자)', count: YOUON.length },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function KeyboardPracticePage() {
    const [status, setStatus] = useState<Status>('setup');
    const [selectedSets, setSets] = useState<KanaSet[]>(['seion']);
    const [roundCount, setRoundCount] = useState(ROUND_COUNT);
    const [showKata, setShowKata] = useState(false);  // 가타카나 표시 여부
    const { soundEnabled, sfxVolume } = useSettingsStore();

    // 오디오 설정 매칭
    useEffect(() => {
        audioManager.setSettings(soundEnabled, sfxVolume);
    }, [soundEnabled, sfxVolume]);

    // 게임 상태
    const [queue, setQueue] = useState<Kana[]>([]);
    const [idx, setIdx] = useState(0);
    const [input, setInput] = useState('');
    const [results, setResults] = useState<ResultEntry[]>([]);
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
    const [startTime, setStartTime] = useState(0);
    const [wordStart, setWordStart] = useState(0);
    const [streak, setStreak] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    const toggleSet = (id: KanaSet) => {
        setSets((prev) =>
            prev.includes(id)
                ? prev.length > 1 ? prev.filter((s) => s !== id) : prev
                : [...prev, id]
        );
    };

    // 연습 시작
    const startPractice = useCallback(() => {
        const pool = getKanaSet(selectedSets);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(roundCount, shuffled.length));
        setQueue(picked);
        setIdx(0);
        setResults([]);
        setInput('');
        setStreak(0);
        const now = Date.now();
        setStartTime(now);
        setWordStart(now);
        setStatus('playing');
        setTimeout(() => inputRef.current?.focus(), 80);
    }, [selectedSets, roundCount]);

    const currentKana = queue[idx] ?? null;

    const triggerShake = () => {
        setShake(true);
        audioManager.playError();
        setTimeout(() => setShake(false), 400);
    };

    const advance = useCallback((userInput: string, correct: boolean) => {
        const elapsed = Date.now() - wordStart;
        setResults((prev) => [...prev, { kana: currentKana!, input: userInput, correct, ms: elapsed }]);
        setInput('');
        setFlash(correct ? 'correct' : 'wrong');
        setTimeout(() => setFlash(null), 300);
        if (correct) {
            setStreak((s) => s + 1);
            audioManager.playCorrect();
        } else {
            setStreak(0);
            audioManager.playError();
        }

        const next = idx + 1;
        if (next >= queue.length) {
            setStatus('result');
            audioManager.playGameOver();
        } else {
            setIdx(next);
            setWordStart(Date.now());
        }
    }, [currentKana, idx, queue.length, wordStart]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        if (currentKana && checkKanaInput(val, currentKana)) {
            advance(val, true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!currentKana) return;
            const correct = checkKanaInput(input, currentKana);
            if (!correct) triggerShake();
            advance(input, correct);
        }
        if (e.key === 'Escape') setStatus('setup');
    };

    // 결과 집계
    const stats = (() => {
        if (results.length === 0) return null;
        const elapsed = Date.now() - startTime;
        const correct = results.filter((r) => r.correct).length;
        const wpm = calculateWPM(correct, elapsed);
        const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
        const accuracy = Math.round((correct / results.length) * 100);
        // 오답 빈도
        const wrongMap: Record<string, number> = {};
        results.filter((r) => !r.correct).forEach((r) => {
            wrongMap[r.kana.kana] = (wrongMap[r.kana.kana] ?? 0) + 1;
        });
        const topWrong = Object.entries(wrongMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([kana, count]) => ({ kana, count }));
        return { correct, total: results.length, wpm, avgMs, accuracy, topWrong };
    })();

    const progress = queue.length > 0 ? (idx / queue.length) * 100 : 0;

    // ============================================================
    // 셋업 화면
    // ============================================================
    if (status === 'setup') {
        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backBtn}>← 홈</Link>
                    <h1 className={`${styles.title} jp`}>自リ練習</h1>
                    <span style={{ width: 60 }} />
                </header>

                <div className={styles.setupBody}>
                    {/* 세트 선택 */}
                    <section className={styles.setupSection}>
                        <h2 className={styles.setupSectionTitle}>📖 연습할 가나 선택</h2>
                        <div className={styles.setGrid}>
                            {SET_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    className={`${styles.setCard} ${selectedSets.includes(opt.id) ? styles.setCardActive : ''}`}
                                    onClick={() => toggleSet(opt.id)}
                                >
                                    <div className={styles.setCardCheck}>
                                        {selectedSets.includes(opt.id) ? '✓' : ''}
                                    </div>
                                    <div className={styles.setCardBody}>
                                        <span className={`${styles.setCardLabel} jp`}>{opt.label}</span>
                                        <span className={styles.setCardSub}>{opt.sub}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className={styles.selectedCount}>
                            총 <strong>{getKanaSet(selectedSets).length}자</strong>에서 출제
                        </p>
                    </section>

                    {/* 문제 수 */}
                    <section className={styles.setupSection}>
                        <h2 className={styles.setupSectionTitle}>🎯 문제 수</h2>
                        <div className={styles.countBtns}>
                            {[10, 20, 30, 50].map((n) => (
                                <button
                                    key={n}
                                    className={`${styles.countBtn} ${roundCount === n ? styles.countBtnActive : ''}`}
                                    onClick={() => setRoundCount(n)}
                                >{n}문제</button>
                            ))}
                        </div>
                    </section>

                    {/* 표시 옵션 */}
                    <section className={styles.setupSection}>
                        <h2 className={styles.setupSectionTitle}>⚙️ 옵션</h2>
                        <button
                            className={`${styles.optionBtn} ${showKata ? styles.optionBtnActive : ''}`}
                            onClick={() => setShowKata((v) => !v)}
                        >
                            {showKata ? '✓' : ''} 가타카나도 함께 표시
                        </button>
                    </section>

                    {/* 오십음도 참고표 */}
                    <section className={styles.setupSection}>
                        <h2 className={styles.setupSectionTitle}>📋 오십음도 참고표</h2>
                        <div className={styles.kanaTable}>
                            {['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'].map((rowStart, ri) => {
                                const rowKana = SEION.filter((k) => k.row === ri);
                                return (
                                    <div key={ri} className={styles.kanaRow}>
                                        <span className={`${styles.kanaRowLabel} jp`}>{rowStart}行</span>
                                        {[0, 1, 2, 3, 4].map((ci) => {
                                            const k = rowKana.find((x) => x.col === ci);
                                            return k ? (
                                                <div key={ci} className={styles.kanaCell}>
                                                    <span className={`${styles.kanaCellMain} jp`}>{k.kana}</span>
                                                    <span className={styles.kanaCellRomaji}>{k.altRomaji ?? k.romaji}</span>
                                                </div>
                                            ) : <div key={ci} className={styles.kanaCellEmpty} />;
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <button className={styles.startBtn} onClick={startPractice}>
                        練習スタート ▶
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================
    // 결과 화면
    // ============================================================
    if (status === 'result') {
        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setStatus('setup')}>← 다시 설정</button>
                    <h1 className={`${styles.title} jp`}>練習結果</h1>
                    <button className={styles.backBtn} style={{ textAlign: 'right', color: 'var(--accent-primary)' }} onClick={startPractice}>🔄 다시</button>
                </header>

                <div className={styles.resultBody}>
                    {stats && (
                        <>
                            <div className={styles.resultStats}>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>정답</span>
                                    <span className={styles.statValue} style={{ color: 'var(--success)' }}>
                                        {stats.correct} / {stats.total}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>정확도</span>
                                    <span className={styles.statValue} style={{ color: 'var(--accent-primary)' }}>
                                        {stats.accuracy}%
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>WPM</span>
                                    <span className={styles.statValue} style={{ color: 'var(--info)' }}>{stats.wpm}</span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>평균 응답</span>
                                    <span className={styles.statValue}>{(stats.avgMs / 1000).toFixed(1)}s</span>
                                </div>
                            </div>

                            {stats.topWrong.length > 0 && (
                                <section className={styles.resultSection}>
                                    <h2 className={styles.resultSectionTitle}>❌ 자주 틀린 가나 TOP {stats.topWrong.length}</h2>
                                    <div className={styles.wrongList}>
                                        {stats.topWrong.map(({ kana, count }) => {
                                            const found = [...SEION, ...DAKUTEN, ...HANDAKUTEN, ...YOUON].find((k) => k.kana === kana);
                                            return (
                                                <div key={kana} className={styles.wrongItem}>
                                                    <span className={`${styles.wrongKana} jp`}>{kana}</span>
                                                    <span className={styles.wrongRomaji}>{found?.altRomaji ?? found?.romaji}</span>
                                                    <span className={styles.wrongCount}>{count}회 오답</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <section className={styles.resultSection}>
                                <h2 className={styles.resultSectionTitle}>📋 전체 결과</h2>
                                <div className={styles.resultGrid}>
                                    {results.map((r, i) => (
                                        <div key={i} className={`${styles.resultItem} ${r.correct ? styles.resultItemOk : styles.resultItemWrong}`}>
                                            <span className={`jp`} style={{ fontSize: '20px', fontWeight: 700 }}>{r.kana.kana}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.kana.altRomaji ?? r.kana.romaji}</span>
                                            <span style={{ fontSize: '11px' }}>{r.correct ? '✓' : `✗ (${r.input || '?'})`}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================
    // 연습 화면
    // ============================================================
    return (
        <div className={styles.practicePage}>
            {/* HUD */}
            <div className={styles.hud}>
                <button className={styles.exitBtn} onClick={() => setStatus('setup')}>✕</button>
                <div className={styles.progressWrapper}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <span className={styles.progressText}>{idx} / {queue.length}</span>
                </div>
                <div className={styles.streakBadge} style={{ color: streak >= 5 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    🔥 {streak}
                </div>
            </div>

            {/* 플래시 피드백 */}
            {flash && (
                <div className={`${styles.flashOverlay} ${flash === 'correct' ? styles.flashCorrect : styles.flashWrong}`} />
            )}

            {/* 카드 */}
            <div className={styles.practiceCenter}>
                {currentKana && (
                    <div className={`${styles.kanaCard} ${shake ? styles.kanaCardShake : ''}`}>
                        <div className={styles.kanaNum}>{idx + 1} / {queue.length}</div>

                        {/* 메인 가나 */}
                        <div className={`${styles.mainKana} jp`}>{currentKana.kana}</div>
                        {showKata && (
                            <div className={`${styles.kataKana} jp`}>{currentKana.kata}</div>
                        )}

                        {/* 타입 배지 */}
                        <div className={styles.typeBadge}>
                            {currentKana.type === 'seion' ? '清音' :
                                currentKana.type === 'dakuten' ? '濁音' :
                                    currentKana.type === 'handakuten' ? '半濁音' : '拗音'}
                        </div>

                        {/* 입력창 */}
                        <input
                            ref={inputRef}
                            className={`${styles.kanaInput} ${shake ? styles.kanaInputError : ''}`}
                            value={input}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="romaji..."
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />

                        <p className={styles.enterHint}>Enter로 제출 · ESC 종료</p>
                    </div>
                )}
            </div>

            {/* 미니 히스토리 */}
            <div className={styles.miniHistory}>
                {results.slice(-6).reverse().map((r, i) => (
                    <div key={i} className={`${styles.miniItem} ${r.correct ? styles.miniOk : styles.miniWrong}`}>
                        <span className="jp">{r.kana.kana}</span>
                        <span style={{ fontSize: 11 }}>{r.correct ? '✓' : '✗'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
