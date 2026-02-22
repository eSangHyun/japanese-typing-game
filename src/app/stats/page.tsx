'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadSessions, loadBestRecords, clearSessions } from '@/lib/storage';
import { formatTime } from '@/lib/wpmCalculator';
import type { SessionRecord, BestRecords } from '@/types';
import styles from './page.module.css';

type TabType = 'overview' | 'history';

const MODE_LABEL: Record<string, string> = {
    'falling-words': '단어 낙하',
    'word-practice': '단어 연습',
    'sentence': '문장 연습',
    'kanji-convert': '한자 변환',
    'long-text': '장문 연습',
};

export default function StatsPage() {
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [records, setRecords] = useState<BestRecords>({});
    const [tab, setTab] = useState<TabType>('overview');
    const [filterMode, setFilterMode] = useState<string>('all');

    const load = () => {
        setSessions(loadSessions().reverse());
        setRecords(loadBestRecords());
    };

    useEffect(() => { load(); }, []);

    const filteredSessions = filterMode === 'all'
        ? sessions
        : sessions.filter((s) => s.mode === filterMode);

    const handleClear = () => {
        if (!confirm('모든 기록을 삭제하시겠습니까?')) return;
        clearSessions();
        load();
    };

    // ─── 집계 통계 ────────────────────────────────────────────────────────────
    const agg = (() => {
        if (sessions.length === 0) return null;
        const totalPlays = sessions.length;
        const avgWpm = Math.round(sessions.reduce((s, r) => s + r.wpm, 0) / sessions.length);
        const avgAccuracy = Math.round(sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length);
        const totalDuration = sessions.reduce((s, r) => s + (r.duration ?? 0), 0);
        const totalWords = sessions.reduce((s, r) => s + (r.correctWords ?? 0), 0);

        // 최근 10판 WPM 트렌드
        const recent = [...sessions].slice(0, 10).reverse();
        const trend = recent.map((s) => s.wpm);

        return { totalPlays, avgWpm, avgAccuracy, totalDuration, totalWords, trend };
    })();

    const maxTrend = agg ? Math.max(...agg.trend, 1) : 1;

    // 베스트 카드 렌더링 함수
    const renderBestCard = (modeId: string, icon: string, label: string, href: string) => {
        const record = records[modeId];
        return (
            <div className={styles.bestCard}>
                <div className={styles.bestCardHeader}>
                    <span className={styles.bestIcon}>{icon}</span>
                    <Link href={href} className={styles.bestModeLink}>{label}</Link>
                </div>
                {record ? (
                    <div className={styles.bestStats}>
                        <div className={styles.bestStat}>
                            <span className={styles.bestLabel}>최고 WPM</span>
                            <span className={styles.bestValue} style={{ color: 'var(--success)' }}>{record.bestWpm}</span>
                        </div>
                        <div className={styles.bestStat}>
                            <span className={styles.bestLabel}>최고 정확도</span>
                            <span className={styles.bestValue} style={{ color: 'var(--accent-primary)' }}>{record.bestAccuracy}%</span>
                        </div>
                        <div className={styles.bestStat}>
                            <span className={styles.bestLabel}>총 플레이</span>
                            <span className={styles.bestValue}>{record.totalSessions}회</span>
                        </div>
                    </div>
                ) : (
                    <p className={styles.noRecord}>기록 없음</p>
                )}
            </div>
        );
    };

    return (
        <div className={`${styles.page} scrollable`}>
            <header className={styles.header}>
                <Link href="/" className={styles.backBtn}>← 홈</Link>
                <h1 className={`${styles.title} jp`}>統計・記録</h1>
                <button className={styles.clearBtn} onClick={handleClear}>🗑 초기화</button>
            </header>

            {/* 탭 */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${tab === 'overview' ? styles.tabActive : ''}`} onClick={() => setTab('overview')}>
                    📊 개요
                </button>
                <button className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => setTab('history')}>
                    📋 기록 목록
                </button>
            </div>

            {/* ─── 개요 탭 ────────────────────────────────────────────────────── */}
            {tab === 'overview' && (
                <div className={styles.body}>
                    {/* 전체 집계 */}
                    {agg ? (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>🎮 전체 플레이 현황</h2>
                            <div className={styles.aggGrid}>
                                <div className={styles.aggCard}>
                                    <span className={styles.aggLabel}>총 플레이</span>
                                    <span className={styles.aggValue}>{agg.totalPlays}회</span>
                                </div>
                                <div className={styles.aggCard}>
                                    <span className={styles.aggLabel}>평균 WPM</span>
                                    <span className={styles.aggValue} style={{ color: 'var(--success)' }}>{agg.avgWpm}</span>
                                </div>
                                <div className={styles.aggCard}>
                                    <span className={styles.aggLabel}>평균 정확도</span>
                                    <span className={styles.aggValue} style={{ color: 'var(--accent-primary)' }}>{agg.avgAccuracy}%</span>
                                </div>
                                <div className={styles.aggCard}>
                                    <span className={styles.aggLabel}>총 연습 시간</span>
                                    <span className={styles.aggValue}>{formatTime(agg.totalDuration)}</span>
                                </div>
                                <div className={styles.aggCard}>
                                    <span className={styles.aggLabel}>맞춘 단어/문장</span>
                                    <span className={styles.aggValue}>{agg.totalWords.toLocaleString()}개</span>
                                </div>
                            </div>

                            {/* WPM 트렌드 바 차트 */}
                            {agg.trend.length > 1 && (
                                <div className={styles.trendSection}>
                                    <div className={styles.trendTitle}>📈 최근 WPM 추이</div>
                                    <div className={styles.trendChart}>
                                        {agg.trend.map((wpm, i) => (
                                            <div key={i} className={styles.trendBar}>
                                                <div
                                                    className={styles.trendFill}
                                                    style={{ height: `${(wpm / maxTrend) * 100}%` }}
                                                />
                                                <span className={styles.trendLabel}>{wpm}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📂</div>
                            <p>아직 기록이 없습니다.</p>
                            <Link href="/game/falling" className={styles.startBtn}>단어 낙하 시작하기 →</Link>
                        </div>
                    )}

                    {/* 모드별 베스트 */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>🏆 모드별 최고 기록</h2>
                        <div className={styles.bestGrid}>
                            {renderBestCard('falling-words', '🎮', '단어 낙하', '/game/falling')}
                            {renderBestCard('word-practice', '📝', '단어 연습', '/practice/words')}
                            {renderBestCard('sentence', '📖', '문장 연습', '/practice/sentence')}
                            {renderBestCard('kanji-convert', '漢', '한자 변환', '/practice/kanji')}
                            {renderBestCard('long-text', '📜', '장문 연습', '/practice/long-text')}
                        </div>
                    </section>
                </div>
            )}

            {/* ─── 기록 탭 ────────────────────────────────────────────────────── */}
            {tab === 'history' && (
                <div className={styles.body}>
                    <div className={styles.filterRow}>
                        {['all', 'falling-words', 'word-practice', 'sentence', 'kanji-convert', 'long-text'].map((m) => (
                            <button
                                key={m}
                                className={`${styles.filterBtn} ${filterMode === m ? styles.filterBtnActive : ''}`}
                                onClick={() => setFilterMode(m)}
                            >
                                {m === 'all' ? '전체' : MODE_LABEL[m] ?? m}
                            </button>
                        ))}
                        <span className={styles.filterCount}>{filteredSessions.length}건</span>
                    </div>

                    {filteredSessions.length === 0 ? (
                        <div className={styles.empty}>
                            <p>해당 기록이 없습니다.</p>
                        </div>
                    ) : (
                        <div className={styles.sessionTable}>
                            <div className={styles.sessionHeader}>
                                <span>날짜</span>
                                <span>모드</span>
                                <span>레벨</span>
                                <span>WPM</span>
                                <span>정확도</span>
                                <span>시간</span>
                                <span>정답</span>
                            </div>
                            {filteredSessions.slice(0, 50).map((s, i) => (
                                <div key={s.id ?? i} className={styles.sessionRow}>
                                    <span className={styles.sessionDate}>
                                        {new Date(s.timestamp).toLocaleDateString('ko-KR', {
                                            month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                    <span className={styles.sessionMode}>{MODE_LABEL[s.mode] ?? s.mode}</span>
                                    <span className={styles.sessionLevel}>Lv.{s.level}</span>
                                    <span className={styles.sessionWpm} style={{ color: 'var(--success)' }}>{s.wpm}</span>
                                    <span className={styles.sessionAccuracy}
                                        style={{ color: s.accuracy >= 90 ? 'var(--success)' : s.accuracy >= 70 ? 'var(--warning)' : 'var(--danger)' }}>
                                        {s.accuracy}%
                                    </span>
                                    <span className={styles.sessionDuration}>{formatTime((s.duration ?? 0) * 1000)}</span>
                                    <span className={styles.sessionWords}>{s.correctWords ?? '-'}개</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
