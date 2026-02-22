'use client';

import { useSettingsStore } from '@/stores/settingsStore';
import { clearSessions, clearAllData } from '@/lib/storage';
import Link from 'next/link';
import styles from './page.module.css';

export default function SettingsPage() {
    const {
        inputMode, speed, theme, soundEnabled, bgmEnabled,
        bgmVolume, sfxVolume, showFurigana, showMeaning,
        updateSettings, resetSettings
    } = useSettingsStore();

    const handleClearStats = () => {
        if (confirm('학습 기록과 통계 데이터를 삭제하시겠습니까?')) {
            clearSessions();
            alert('기록이 초기화되었습니다.');
        }
    };

    const handleFactoryReset = () => {
        if (confirm('경고: 모든 설정, 기록, 커스텀 단어장이 완전히 삭제됩니다. 진행하시겠습니까?')) {
            clearAllData();
            resetSettings();
            alert('모든 데이터가 초기화되었습니다.');
            window.location.reload();
        }
    };

    const handleToggle = (key: any, current: boolean) => {
        updateSettings({ [key]: !current });
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/" className={styles.backBtn}>← 홈</Link>
                <h1 className={`${styles.title} jp`}>設定</h1>
                <div className={styles.placeholder}></div>
            </header>

            <main className={`${styles.container} scrollable`}>
                {/* ─── 입력 및 표시 ─── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>입력 및 표시</h2>
                    <div className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>기본 입력 모드</span>
                                <span className={styles.itemDesc}>연습 시 시작되는 기본 자판 모드</span>
                            </div>
                            <div className={styles.btnGroup}>
                                {(['romaji', 'hiragana', 'katakana'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        className={`${styles.optionBtn} ${inputMode === mode ? styles.optionBtnOn : ''}`}
                                        onClick={() => updateSettings({ inputMode: mode })}
                                    >
                                        {mode === 'romaji' ? '로마자' : mode === 'hiragana' ? '히라가나' : '가타카나'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>후리가나(읽기) 표시</span>
                                <span className={styles.itemDesc}>한자 위에 읽기를 항상 표시합니다</span>
                            </div>
                            <div
                                className={`${styles.switch} ${showFurigana ? styles.switchOn : ''}`}
                                onClick={() => handleToggle('showFurigana', showFurigana)}
                            >
                                <div className={styles.switchThumb}></div>
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>의미 표시</span>
                                <span className={styles.itemDesc}>단어 연습 중 한국어 의미를 표시합니다</span>
                            </div>
                            <div
                                className={`${styles.switch} ${showMeaning ? styles.switchOn : ''}`}
                                onClick={() => handleToggle('showMeaning', showMeaning)}
                            >
                                <div className={styles.switchThumb}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 게임 설정 ─── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>게임 설정</h2>
                    <div className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>기본 난이도</span>
                                <span className={styles.itemDesc}>단어 낙하 속도 등 기본 레벨 (1~5)</span>
                            </div>
                            <select
                                className={styles.resetBtn}
                                value={speed}
                                onChange={(e) => updateSettings({ speed: parseInt(e.target.value) as any })}
                            >
                                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>Level {v}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* ─── 오디오 ─── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>오디오</h2>
                    <div className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>효과음</span>
                                <span className={styles.itemDesc}>타이핑 및 게임 피드백 사운드</span>
                            </div>
                            <div className={styles.control}>
                                <input
                                    type="range" className={styles.slider} min="0" max="1" step="0.1"
                                    value={sfxVolume} onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
                                />
                                <div
                                    className={`${styles.switch} ${soundEnabled ? styles.switchOn : ''}`}
                                    onClick={() => handleToggle('soundEnabled', soundEnabled)}
                                >
                                    <div className={styles.switchThumb}></div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>배경음악 (BGM)</span>
                                <span className={styles.itemDesc}>게임 중 재생되는 음악</span>
                            </div>
                            <div className={styles.control}>
                                <input
                                    type="range" className={styles.slider} min="0" max="1" step="0.1"
                                    value={bgmVolume} onChange={(e) => updateSettings({ bgmVolume: parseFloat(e.target.value) })}
                                />
                                <div
                                    className={`${styles.switch} ${bgmEnabled ? styles.switchOn : ''}`}
                                    onClick={() => handleToggle('bgmEnabled', bgmEnabled)}
                                >
                                    <div className={styles.switchThumb}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 테마 ─── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>테마</h2>
                    <div className={styles.card}>
                        <div className={styles.themeGrid}>
                            <div
                                className={`${styles.themeItem} ${theme === 'dark' ? styles.themeItemActive : ''}`}
                                onClick={() => updateSettings({ theme: 'dark' })}
                            >
                                <div className={`${styles.themePreview} ${styles.darkPreview}`}></div>
                                <span className={styles.itemLabel}>Dark</span>
                            </div>
                            <div
                                className={`${styles.themeItem} ${theme === 'light' ? styles.themeItemActive : ''}`}
                                onClick={() => updateSettings({ theme: 'light' })}
                            >
                                <div className={`${styles.themePreview} ${styles.lightPreview}`}></div>
                                <span className={styles.itemLabel}>Light</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 데이터 관리 ─── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>데이터 관리</h2>
                    <div className={`${styles.card} ${styles.dangerZone}`}>
                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel}>학습 기록 초기화</span>
                                <span className={styles.itemDesc}>모든 세션 기록과 베스트 스코어를 삭제합니다</span>
                            </div>
                            <button className={styles.resetBtn} onClick={handleClearStats}>기록 삭제</button>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemLabel} style={{ color: 'var(--danger)' }}>공장 초기화</span>
                                <span className={styles.itemDesc}>모든 데이터와 설정을 삭제하고 초기 상태로 돌아갑니다</span>
                            </div>
                            <button className={styles.dangerBtn} onClick={handleFactoryReset}>전체 초기화</button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
