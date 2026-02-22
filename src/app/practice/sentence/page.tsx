'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    getAllSentences, filterSentences, pickSentences,
    CATEGORY_META, addSentence, updateSentence, deleteSentence,
    loadCustomSentences,
} from '@/features/sentences/sentenceService';
import type { Sentence, SentenceCategory, DifficultyLevel } from '@/features/sentences/sentenceService';
import { calculateWPM, calculateAccuracy } from '@/lib/wpmCalculator';
import { audioManager } from '@/lib/audioManager';
import { useSettingsStore } from '@/stores/settingsStore';
import styles from './page.module.css';

// ─── 타입 ─────────────────────────────────────────────────────────────────────
type Screen = 'setup' | 'playing' | 'result' | 'manage';

interface SentenceResult {
    sentence: Sentence;
    userInput: string;
    timeMs: number;
    wpm: number;
    accuracy: number;
}

const ALL_CATS = Object.keys(CATEGORY_META).filter(c => c !== 'custom') as SentenceCategory[];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function SentencePracticePage() {
    const [screen, setScreen] = useState<Screen>('setup');

    // 셋업 상태
    const [selCats, setSelCats] = useState<SentenceCategory[]>(['greeting', 'daily']);
    const [diffRange, setDiffRange] = useState<[DifficultyLevel, DifficultyLevel]>([1, 3]);
    const [sentCount, setSentCount] = useState(10);
    const [showReading, setShowRd] = useState(true);

    // 플레이 상태
    const [queue, setQueue] = useState<Sentence[]>([]);
    const [idx, setIdx] = useState(0);
    const [input, setInput] = useState('');
    const [charIdx, setCharIdx] = useState(0);
    const [errors, setErrors] = useState(0);           // 현재 문장 오류 수
    const [totalErrors, setTotalErrors] = useState(0);
    const [results, setResults] = useState<SentenceResult[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [sentStart, setSentStart] = useState(0);
    const [flash, setFlash] = useState<'ok' | 'ng' | null>(null);
    const [shake, setShake] = useState(false);

    // 관리 모드 상태
    const [customList, setCustomList] = useState<Sentence[]>([]);
    const [editTarget, setEditTarget] = useState<Sentence | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [manageSearch, setManageSearch] = useState('');
    const [newForm, setNewForm] = useState<Omit<Sentence, 'id'>>({
        japanese: '', reading: '', romaji: '', meaning_ko: '',
        category: 'custom', difficulty: 2,
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const settings = useSettingsStore();

    // 오디오 설정 매칭
    useEffect(() => {
        audioManager.setSettings(settings.soundEnabled, settings.sfxVolume);
    }, [settings.soundEnabled, settings.sfxVolume]);

    const refreshCustom = () => setCustomList(loadCustomSentences());
    useEffect(() => { refreshCustom(); }, []);

    // ─── 시작 ──────────────────────────────────────────────────────────────────
    const start = useCallback(() => {
        const pool = filterSentences({
            categories: selCats, difficulty: diffRange, includeCustom: true,
        });
        const picked = pickSentences(pool, sentCount);
        if (picked.length === 0) { alert('해당 조건의 문장이 없습니다.'); return; }
        const now = Date.now();
        setQueue(picked);
        setIdx(0); setInput(''); setCharIdx(0);
        setErrors(0); setTotalErrors(0);
        setResults([]);
        setStartTime(now); setSentStart(now);
        setScreen('playing');
        setTimeout(() => inputRef.current?.focus(), 80);
    }, [selCats, diffRange, sentCount]);

    const currentSent = queue[idx] ?? null;
    const expectedRomaji = currentSent?.romaji ?? '';

    // ─── 타이핑 처리 ───────────────────────────────────────────────────────────
    const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') { setScreen('setup'); return; }
        if (e.key === 'Enter') {
            // 완성 판정
            if (!currentSent) return;
            const elapsed = Date.now() - sentStart;
            const errCount = [...input].filter((c, i) => c !== expectedRomaji[i]).length
                + Math.max(0, expectedRomaji.length - input.length);
            const wpm = calculateWPM(currentSent.reading.replace(/[。、？！]/g, '').length, elapsed);
            const acc = calculateAccuracy(expectedRomaji.length, Math.max(0, expectedRomaji.length - errCount));
            setResults(prev => [...prev, { sentence: currentSent, userInput: input, timeMs: elapsed, wpm, accuracy: acc }]);
            setTotalErrors(t => t + errors);
            setFlash(acc >= 80 ? 'ok' : 'ng');

            if (acc >= 80) audioManager.playCorrect();
            else audioManager.playError();

            setTimeout(() => setFlash(null), 300);
            const next = idx + 1;
            if (next >= queue.length) {
                setScreen('result');
                audioManager.playGameOver();
                return;
            }
            setIdx(next); setInput(''); setCharIdx(0); setErrors(0);
            setSentStart(Date.now());
            return;
        }
        if (e.key === 'Backspace') {
            setInput(prev => prev.slice(0, -1));
            setCharIdx(prev => Math.max(0, prev - 1));
        }
    }, [currentSent, errors, expectedRomaji, idx, input, queue.length, sentStart]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        // 실시간 오류 감지 — 현재 입력 길이 기준
        const ch = val[val.length - 1];
        if (!ch) return;
        const expected = expectedRomaji[val.length - 1];
        if (ch !== expected) {
            setErrors(prev => prev + 1);
            setShake(true);
            audioManager.playMiss(); // 오타 시 뭉툭한 소리
            setTimeout(() => setShake(false), 250);
        }
        setCharIdx(val.length);
    }, [expectedRomaji]);

    // ─── 통계 집계 ─────────────────────────────────────────────────────────────
    const stats = (() => {
        if (results.length === 0) return null;
        const elapsed = Date.now() - startTime;
        const totalChars = results.reduce((s, r) => s + r.sentence.reading.replace(/[。、？！]/g, '').length, 0);
        const wpm = calculateWPM(totalChars, elapsed);
        const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
        const avgTime = Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length / 1000 * 10) / 10;
        return { wpm, avgAccuracy, avgTime, totalErrors, elapsed };
    })();

    // ─── 관리 모드 저장 ─────────────────────────────────────────────────────────
    const handleAddSentence = () => {
        if (!newForm.japanese || !newForm.romaji) { alert('일본어와 로마자는 필수입니다.'); return; }
        addSentence(newForm);
        refreshCustom();
        setNewForm({ japanese: '', reading: '', romaji: '', meaning_ko: '', category: 'custom', difficulty: 2 });
        setShowAddForm(false);
    };

    const handleUpdateSentence = () => {
        if (!editTarget) return;
        updateSentence(editTarget.id, editTarget);
        refreshCustom(); setEditTarget(null);
    };

    const handleDelete = (id: string) => {
        if (!confirm('삭제하시겠습니까?')) return;
        deleteSentence(id); refreshCustom();
    };

    const filteredManage = customList.filter(s =>
        s.japanese.includes(manageSearch) || s.meaning_ko.includes(manageSearch) || s.romaji.includes(manageSearch)
    );

    // ============================================================
    // 셋업 화면
    // ============================================================
    if (screen === 'setup') {
        const pool = filterSentences({ categories: selCats, difficulty: diffRange, includeCustom: true });
        const toggleCat = (c: SentenceCategory) =>
            setSelCats(p => p.includes(c) ? (p.length > 1 ? p.filter(x => x !== c) : p) : [...p, c]);

        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backBtn}>← 홈</Link>
                    <h1 className={`${styles.title} jp`}>文章練習</h1>
                    <button className={styles.manageBtn} onClick={() => setScreen('manage')}>✏️ 문장 관리</button>
                </header>

                <div className={styles.setupBody}>
                    {/* 카테고리 */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>📂 카테고리</h2>
                        <div className={styles.catGrid}>
                            {ALL_CATS.map(c => (
                                <button key={c}
                                    className={`${styles.catBtn} ${selCats.includes(c) ? styles.catBtnOn : ''}`}
                                    onClick={() => toggleCat(c)}>
                                    <span>{CATEGORY_META[c].emoji}</span>
                                    <span>{CATEGORY_META[c].label}</span>
                                    <span className={styles.catCount}>{
                                        (getAllSentences()).filter(s => s.category === c).length
                                    }문장</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 난이도 */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            ⭐ 난이도 &nbsp;
                            <span className={styles.diffLabel}>{diffRange[0]} ~ {diffRange[1]}</span>
                        </h2>
                        <div className={styles.diffRow}>
                            {([1, 2, 3, 4, 5] as DifficultyLevel[]).map(d => (
                                <button key={d}
                                    className={`${styles.diffBtn} ${d >= diffRange[0] && d <= diffRange[1] ? styles.diffBtnOn : ''}`}
                                    onClick={() => {
                                        if (diffRange[0] === d && diffRange[1] === d) return;
                                        if (d < diffRange[0]) setDiffRange([d, diffRange[1]]);
                                        else if (d > diffRange[1]) setDiffRange([diffRange[0], d]);
                                        else if (d === diffRange[0]) setDiffRange([d + 1 as DifficultyLevel, diffRange[1]]);
                                        else setDiffRange([diffRange[0], d - 1 as DifficultyLevel]);
                                    }}>
                                    {'★'.repeat(d)}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 문장 수 */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>🎯 문장 수</h2>
                        <div className={styles.countRow}>
                            {[5, 10, 20, 30].map(n => (
                                <button key={n}
                                    className={`${styles.countBtn} ${sentCount === n ? styles.countBtnOn : ''}`}
                                    onClick={() => setSentCount(n)}>
                                    {n}문장
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 옵션 */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>⚙️ 옵션</h2>
                        <button className={`${styles.optBtn} ${showReading ? styles.optBtnOn : ''}`}
                            onClick={() => setShowRd(v => !v)}>
                            {showReading ? '✓' : ''} 히라가나 읽기 표시
                        </button>
                    </section>

                    <div className={styles.poolInfo}>
                        선택된 조건: <strong>{pool.length}문장</strong> 중 <strong>{Math.min(sentCount, pool.length)}문장</strong> 출제
                    </div>

                    <button className={styles.startBtn} onClick={start}>練習スタート ▶</button>
                </div>
            </div>
        );
    }

    // ============================================================
    // 결과 화면
    // ============================================================
    if (screen === 'result') {
        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setScreen('setup')}>← 다시 설정</button>
                    <h1 className={`${styles.title} jp`}>練習結果</h1>
                    <button className={styles.backBtn} style={{ color: 'var(--accent-primary)' }} onClick={start}>🔄 다시</button>
                </header>

                <div className={styles.resultBody}>
                    {stats && (
                        <div className={styles.statGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>WPM</span>
                                <span className={styles.statVal} style={{ color: 'var(--success)' }}>{stats.wpm}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>평균 정확도</span>
                                <span className={styles.statVal} style={{ color: 'var(--accent-primary)' }}>{stats.avgAccuracy}%</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>총 오타</span>
                                <span className={styles.statVal} style={{ color: 'var(--danger)' }}>{stats.totalErrors}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>문장당 평균</span>
                                <span className={styles.statVal}>{stats.avgTime}s</span>
                            </div>
                        </div>
                    )}

                    <section className={styles.section} style={{ marginTop: 24 }}>
                        <h2 className={styles.sectionTitle}>📋 문장별 결과</h2>
                        <div className={styles.resultList}>
                            {results.map((r, i) => (
                                <div key={i} className={`${styles.resultRow} ${r.accuracy >= 80 ? styles.resultOk : styles.resultNg}`}>
                                    <div className={styles.resultNum}>{i + 1}</div>
                                    <div className={styles.resultMain}>
                                        <div className={`${styles.resultJp} jp`}>{r.sentence.japanese}</div>
                                        <div className={styles.resultKo}>{r.sentence.meaning_ko}</div>
                                        {r.userInput !== r.sentence.romaji && (
                                            <div className={styles.resultDiff}>
                                                <span className={styles.resultExpect}>✓ {r.sentence.romaji}</span>
                                                <span className={styles.resultMine}>✗ {r.userInput}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.resultMeta}>
                                        <span style={{ color: 'var(--success)' }}>{r.wpm} WPM</span>
                                        <span>{r.accuracy}%</span>
                                        <span>{(r.timeMs / 1000).toFixed(1)}s</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    // ============================================================
    // 문장 관리 화면
    // ============================================================
    if (screen === 'manage') {
        return (
            <div className={`${styles.page} scrollable`}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setScreen('setup')}>← 뒤로</button>
                    <h1 className={`${styles.title} jp`}>文章管理</h1>
                    <button className={styles.manageBtn} onClick={() => setShowAddForm(v => !v)}>+ 추가</button>
                </header>

                <div className={styles.manageBody}>
                    {/* 추가 폼 */}
                    {showAddForm && (
                        <div className={styles.formCard}>
                            <h3 className={styles.formTitle}>새 문장 추가</h3>
                            <div className={styles.formGrid}>
                                <label>일본어 *</label>
                                <input className={styles.formInput} value={newForm.japanese}
                                    onChange={e => setNewForm(p => ({ ...p, japanese: e.target.value }))}
                                    placeholder="日本語の文章" />
                                <label>히라가나</label>
                                <input className={styles.formInput} value={newForm.reading}
                                    onChange={e => setNewForm(p => ({ ...p, reading: e.target.value }))}
                                    placeholder="ひらがな読み" />
                                <label>로마자 *</label>
                                <input className={styles.formInput} value={newForm.romaji}
                                    onChange={e => setNewForm(p => ({ ...p, romaji: e.target.value }))}
                                    placeholder="romaji" />
                                <label>한국어 의미</label>
                                <input className={styles.formInput} value={newForm.meaning_ko}
                                    onChange={e => setNewForm(p => ({ ...p, meaning_ko: e.target.value }))}
                                    placeholder="한국어 해석" />
                                <label>카테고리</label>
                                <select className={styles.formSelect} value={newForm.category}
                                    onChange={e => setNewForm(p => ({ ...p, category: e.target.value as SentenceCategory }))}>
                                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                                        <option key={k} value={k}>{v.emoji} {v.label}</option>
                                    ))}
                                </select>
                                <label>난이도</label>
                                <select className={styles.formSelect} value={newForm.difficulty}
                                    onChange={e => setNewForm(p => ({ ...p, difficulty: +e.target.value as DifficultyLevel }))}>
                                    {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
                                </select>
                            </div>
                            <div className={styles.formBtns}>
                                <button className={styles.saveBtn} onClick={handleAddSentence}>저장</button>
                                <button className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>취소</button>
                            </div>
                        </div>
                    )}

                    {/* 커스텀 문장 목록 */}
                    <div className={styles.manageHeader}>
                        <h2 className={styles.sectionTitle}>✏️ 커스텀 문장 ({customList.length})</h2>
                        <input className={styles.searchInput} value={manageSearch}
                            onChange={e => setManageSearch(e.target.value)}
                            placeholder="검색..." />
                    </div>

                    {filteredManage.length === 0 ? (
                        <div className={styles.emptyManage}>
                            {customList.length === 0
                                ? '아직 커스텀 문장이 없습니다. + 추가를 눌러 문장을 등록하세요.'
                                : '검색 결과가 없습니다.'}
                        </div>
                    ) : (
                        <div className={styles.manageList}>
                            {filteredManage.map(s => (
                                editTarget?.id === s.id ? (
                                    <div key={s.id} className={`${styles.formCard} ${styles.formCardInline}`}>
                                        <div className={styles.formGrid}>
                                            <label>일본어</label>
                                            <input className={styles.formInput} value={editTarget.japanese}
                                                onChange={e => setEditTarget(p => p && ({ ...p, japanese: e.target.value }))} />
                                            <label>히라가나</label>
                                            <input className={styles.formInput} value={editTarget.reading}
                                                onChange={e => setEditTarget(p => p && ({ ...p, reading: e.target.value }))} />
                                            <label>로마자</label>
                                            <input className={styles.formInput} value={editTarget.romaji}
                                                onChange={e => setEditTarget(p => p && ({ ...p, romaji: e.target.value }))} />
                                            <label>한국어</label>
                                            <input className={styles.formInput} value={editTarget.meaning_ko}
                                                onChange={e => setEditTarget(p => p && ({ ...p, meaning_ko: e.target.value }))} />
                                        </div>
                                        <div className={styles.formBtns}>
                                            <button className={styles.saveBtn} onClick={handleUpdateSentence}>저장</button>
                                            <button className={styles.cancelBtn} onClick={() => setEditTarget(null)}>취소</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={s.id} className={styles.manageRow}>
                                        <div className={styles.manageMain}>
                                            <div className={`${styles.manageJp} jp`}>{s.japanese}</div>
                                            <div className={styles.manageRomaji}>{s.romaji}</div>
                                            <div className={styles.manageMeaning}>{s.meaning_ko}</div>
                                        </div>
                                        <div className={styles.manageMeta}>
                                            <span className={styles.manageCat}>{CATEGORY_META[s.category]?.emoji}</span>
                                            <span className={styles.manageDiff}>{'★'.repeat(s.difficulty)}</span>
                                        </div>
                                        <div className={styles.manageActions}>
                                            <button className={styles.editBtn} onClick={() => setEditTarget(s)}>편집</button>
                                            <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>삭제</button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {/* 내장 문장 미리보기 */}
                    <div className={styles.builtinSection}>
                        <h2 className={styles.sectionTitle}>📚 내장 문장 ({(getAllSentences()).filter(s => !s.id.startsWith('custom')).length}) — 읽기전용</h2>
                        <div className={styles.builtinGrid}>
                            {Object.entries(CATEGORY_META).filter(([k]) => k !== 'custom').map(([cat, meta]) => {
                                const count = getAllSentences().filter(s => s.category === cat && !s.id.startsWith('custom')).length;
                                return (
                                    <div key={cat} className={styles.builtinCard}>
                                        <span>{meta.emoji}</span>
                                        <span>{meta.label}</span>
                                        <strong>{count}</strong>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // 타이핑 화면
    // ============================================================
    const romParts = expectedRomaji.split('');

    return (
        <div className={styles.playPage}>
            {/* 플래시 피드백 */}
            {flash && <div className={`${styles.flash} ${flash === 'ok' ? styles.flashOk : styles.flashNg}`} />}

            {/* HUD */}
            <div className={styles.hud}>
                <button className={styles.exitBtn} onClick={() => setScreen('setup')}>✕</button>
                <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(idx / queue.length) * 100}%` }} />
                    </div>
                    <span className={styles.progressText}>{idx} / {queue.length}</span>
                </div>
                <div className={styles.errorCount} style={{ color: totalErrors > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    ✗ {totalErrors}
                </div>
            </div>

            <div className={styles.playCenter}>
                {currentSent && (
                    <div className={styles.sentCard}>
                        <div className={styles.sentNum}>{idx + 1} / {queue.length}</div>

                        {/* 카테고리 + 난이도 */}
                        <div className={styles.sentMeta}>
                            <span className={styles.catBadge}>
                                {CATEGORY_META[currentSent.category]?.emoji} {CATEGORY_META[currentSent.category]?.label}
                            </span>
                            <span className={styles.diffBadge}>{'★'.repeat(currentSent.difficulty)}</span>
                        </div>

                        {/* 일본어 문장 */}
                        <div className={`${styles.sentJp} jp`}>{currentSent.japanese}</div>

                        {/* 히라가나 읽기 */}
                        {showReading && (
                            <div className={`${styles.sentReading} jp`}>{currentSent.reading}</div>
                        )}

                        {/* 한국어 의미 */}
                        <div className={styles.sentKo}>{currentSent.meaning_ko}</div>

                        {/* 로마자 진행 표시 */}
                        <div className={styles.romajiDisplay} aria-hidden>
                            {romParts.map((ch, i) => {
                                const isTyped = i < input.length;
                                const isCorrect = isTyped && input[i] === ch;
                                const isWrong = isTyped && input[i] !== ch;
                                const isCurrent = i === input.length;
                                return (
                                    <span key={i} className={
                                        isCorrect ? styles.charOk :
                                            isWrong ? styles.charNg :
                                                isCurrent ? styles.charCur :
                                                    styles.charPending
                                    }>{ch}</span>
                                );
                            })}
                        </div>

                        {/* 입력창 */}
                        <input
                            ref={inputRef}
                            className={`${styles.sentInput} ${shake ? styles.sentInputShake : ''}`}
                            value={input}
                            onChange={handleChange}
                            onKeyDown={handleKey}
                            placeholder="로마자로 입력하세요..."
                            autoComplete="off" autoCorrect="off" spellCheck={false}
                        />

                        <p className={styles.hint}>Enter로 다음 · ESC 종료</p>
                    </div>
                )}
            </div>
        </div>
    );
}
