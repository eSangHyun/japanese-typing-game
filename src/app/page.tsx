'use client';

import Link from 'next/link';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadBestRecords } from '@/lib/storage';
import { getAllWordLists } from '@/features/word-bank/services/wordBankService';
import { useEffect, useState, useRef } from 'react';
import type { BestRecords, WordList } from '@/types';
import styles from './page.module.css';

interface Mode {
    id: string;
    href: string;
    icon: string;
    title: string;
    title_ko: string;
    desc: string;
    badge?: string;
}

const MODES: Mode[] = [
    { id: 'falling', href: '/game/falling', icon: '🎮', title: '単語落下', title_ko: '단어 낙하', desc: '위에서 내려오는 단어를 타이핑하세요' },
    { id: 'keyboard', href: '/practice/keyboard', icon: '⌨️', title: '自り練習', title_ko: '자리 연습', desc: '히라가나·가타카나 자판 위치 익히기' },
    { id: 'words', href: '/practice/words', icon: '📝', title: '単語練習', title_ko: '단어 연습', desc: '탁음·반탁음·요음 포함 단어 연습' },
    { id: 'sentence', href: '/practice/sentence', icon: '📖', title: '文章練習', title_ko: '문장 연습', desc: '짧은 문장과 인사말 타이핑' },
    { id: 'kanji', href: '/practice/kanji', icon: '漢', title: '漢字変換', title_ko: '한자 변환', desc: '가나 → 한자 변환 연습' },
    { id: 'long-text', href: '/practice/long-text', icon: '📜', title: '長文練習', title_ko: '장복 연습', desc: '명작 소설과 기 긴 기사 타이핑' },
    { id: 'stats', href: '/stats', icon: '📊', title: '統計', title_ko: '통계', desc: 'WPM 기록, 정확도, 학습 이력' },
    { id: 'settings', href: '/settings', icon: '⚙️', title: '設定', title_ko: '설정', desc: '테마, 사운드, 입력 방식 등 관리' },
];

export default function HomePage() {
    const { speed, inputMode, updateSettings, selectedWordListId } = useSettingsStore();
    const [records, setRecords] = useState<BestRecords>({});
    const [wordLists, setWordLists] = useState<WordList[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setRecords(loadBestRecords());
        setWordLists(getAllWordLists());
    }, []);

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fallingRecord = records['falling-words'];
    const currentList = wordLists.find((l) => l.id === selectedWordListId);

    const selectList = (id: string) => {
        updateSettings({ selectedWordListId: id });
        setDropdownOpen(false);
    };

    return (
        <div className={`${styles.page} scrollable`}>
            {/* 헤더 */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoJp}>日本語タイピング</span>
                    <span className={styles.logoKo}>일본어 타자연습</span>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/wordbank" className={styles.settingsBtn}>📚 단어장 관리</Link>
                </div>
            </header>

            {/* 히어로 섹션 */}
            <section className={styles.hero}>
                <h1 className={styles.heroTitle}>
                    <span className={styles.heroAccent}>재무·계정과목</span> 단어로<br />
                    일본어 타자 실력을 키우세요
                </h1>
                <p className={styles.heroSub}>
                    단어 낙하 게임 · 자리 연습 · 통계 추적
                </p>

                {/* 빠른 설정 */}
                <div className={styles.quickSettings}>
                    {/* 단어장 선택 드롭다운 */}
                    <div className={styles.quickItem}>
                        <label>단어장</label>
                        <div className={styles.wordListDropdown} ref={dropdownRef}>
                            <button
                                className={styles.wordListBtn}
                                onClick={() => setDropdownOpen((o) => !o)}
                            >
                                <span>
                                    {currentList
                                        ? `${currentList.name_ko || currentList.name} (${currentList.words.length}개)`
                                        : '단어장 선택'}
                                </span>
                                <span className={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</span>
                            </button>

                            {dropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    {wordLists.map((list) => (
                                        <button
                                            key={list.id}
                                            className={`${styles.dropdownItem} ${list.id === selectedWordListId ? styles.dropdownItemActive : ''}`}
                                            onClick={() => selectList(list.id)}
                                        >
                                            <div className={styles.dropdownItemInfo}>
                                                <span className={`${styles.dropdownItemName} jp`}>{list.name}</span>
                                                <span className={styles.dropdownItemSub}>
                                                    {list.name_ko} · {list.words.length}개
                                                </span>
                                            </div>
                                            {list.id === selectedWordListId && (
                                                <span className={styles.dropdownItemCheck}>✓</span>
                                            )}
                                        </button>
                                    ))}
                                    <div className={styles.dropdownDivider} />
                                    <Link href="/wordbank" className={styles.dropdownManage} onClick={() => setDropdownOpen(false)}>
                                        ⚙️ 단어장 관리
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 속도 */}
                    <div className={styles.quickItem}>
                        <label>속도 단계</label>
                        <div className={styles.speedBtns}>
                            {([1, 2, 3, 4, 5] as const).map((s) => (
                                <button
                                    key={s}
                                    className={`${styles.speedBtn} ${speed === s ? styles.speedBtnActive : ''}`}
                                    onClick={() => updateSettings({ speed: s })}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 입력 방식 */}
                    <div className={styles.quickItem}>
                        <label>입력 방식</label>
                        <div className={styles.modeBtns}>
                            <button
                                className={`${styles.modeBtn} ${inputMode === 'romaji' ? styles.modeBtnActive : ''}`}
                                onClick={() => updateSettings({ inputMode: 'romaji' })}
                            >
                                ローマ字
                            </button>
                            <button
                                className={`${styles.modeBtn} ${inputMode === 'hiragana' ? styles.modeBtnActive : ''}`}
                                onClick={() => updateSettings({ inputMode: 'hiragana' })}
                            >
                                ひらがな
                            </button>
                        </div>
                    </div>
                </div>

                {/* 최고 기록 미리보기 */}
                {fallingRecord && (
                    <div className={styles.recordBadge}>
                        🏆 최고 WPM: <strong>{fallingRecord.bestWpm}</strong> ·
                        정확도: <strong>{fallingRecord.bestAccuracy}%</strong> ·
                        총 {fallingRecord.totalSessions}회 플레이
                    </div>
                )}
            </section>

            {/* 모드 그리드 */}
            <section className={styles.modeGrid}>
                {MODES.map((mode) => (
                    <Link
                        key={mode.id}
                        href={mode.href}
                        className={`${styles.modeCard} ${mode.badge ? styles.modeCardDisabled : ''}`}
                        onClick={mode.badge ? (e) => e.preventDefault() : undefined}
                    >
                        <div className={styles.modeIcon}>{mode.icon}</div>
                        <div className={styles.modeInfo}>
                            <div className={styles.modeName}>
                                <span className={`${styles.modeNameJp} jp`}>{mode.title}</span>
                                <span className={styles.modeNameKo}>{mode.title_ko}</span>
                            </div>
                            <p className={styles.modeDesc}>{mode.desc}</p>
                        </div>
                        {mode.badge && <span className={styles.badge}>{mode.badge}</span>}
                        {!mode.badge && <span className={styles.arrow}>→</span>}
                    </Link>
                ))}
            </section>

            {/* 푸터 */}
            <footer className={styles.footer}>
                <p>Japanese Typing Game v0.1.0 · Built with Next.js</p>
            </footer>
        </div>
    );
}
