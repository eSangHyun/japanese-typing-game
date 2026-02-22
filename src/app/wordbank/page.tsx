'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { WordList, Word } from '@/types';
import {
    getAllWordLists,
    createWordList,
    addWordToList,
    updateWordInList,
    deleteWordFromList,
    deleteWordList,
    updateWordListMeta,
    exportWordListAsJson,
    importWordsIntoList,
    parseWordListFile,
} from '@/features/word-bank/services/wordBankService';
import styles from './page.module.css';

// ─── 타입 ─────────────────────────────────────────────────────────────────────
type EditingWord = {
    japanese: string;
    reading: string;
    romaji: string;
    meaning_ko: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    tags: string[];
};

const EMPTY_WORD: EditingWord = {
    japanese: '', reading: '', romaji: '', meaning_ko: '', difficulty: 1, tags: [],
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function WordBankPage() {
    const [lists, setLists] = useState<WordList[]>([]);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [newListName, setNewListName] = useState('');
    const [createError, setCreateError] = useState('');
    const [wordModal, setWordModal] = useState<{
        open: boolean;
        mode: 'add' | 'edit';
        wordId?: string;
        data: EditingWord;
    }>({ open: false, mode: 'add', data: EMPTY_WORD });
    const [wordError, setWordError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // 메타 편집 상태
    const [editMetaMode, setEditMetaMode] = useState(false);
    const [editMetaName, setEditMetaName] = useState('');
    const [editMetaDesc, setEditMetaDesc] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importToExistingRef = useRef<HTMLInputElement>(null);

    const refresh = useCallback(() => {
        const all = getAllWordLists();
        setLists(all);
        if (selectedListId === null && all.length > 0) {
            // 초기 로드 시 첫 번째 리스트 선택 (선택 사항)
            // setSelectedListId(all[0].id);
        }
    }, [selectedListId]);

    useEffect(() => { refresh(); }, [refresh]);

    const selectedList = lists.find((l) => l.id === selectedListId) ?? null;

    // 단어장 생성
    const handleCreateList = () => {
        const name = newListName.trim();
        if (!name) return;
        const result = createWordList(name);
        if (!result.ok) { setCreateError(result.error.message); return; }
        setNewListName('');
        setCreateError('');
        refresh();
        setSelectedListId(result.data.id);
    };

    // 단어장 삭제
    const handleDeleteList = (id: string) => {
        if (!confirm('단어장을 삭제하시겠습니까?')) return;
        deleteWordList(id);
        refresh();
        if (selectedListId === id) setSelectedListId(null);
    };

    // 메타 편집 저장
    const handleSaveMeta = () => {
        if (!selectedListId || !editMetaName.trim()) return;
        const result = updateWordListMeta(selectedListId, {
            name: editMetaName.trim(),
            description: editMetaDesc.trim()
        });
        if (!result.ok) { alert(result.error.message); return; }
        refresh();
        setEditMetaMode(false);
    };

    // 메타 편집 시작
    const startEditMeta = () => {
        if (!selectedList) return;
        setEditMetaName(selectedList.name_ko || selectedList.name);
        setEditMetaDesc(selectedList.description || '');
        setEditMetaMode(true);
    };

    // JSON 내보내기
    const handleExport = () => {
        if (!selectedList) return;
        exportWordListAsJson(selectedList);
    };

    // JSON 가져오기 (새 단어장)
    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const name = file.name.replace('.json', '') || '가져온 단어장';
        const result = await parseWordListFile(file, name);
        if (result.ok) {
            refresh();
            setSelectedListId(result.data.id);
        } else {
            alert(result.error.message);
        }
        e.target.value = '';
    };

    // JSON 데이터 교체 (기존 단어장에 덮어쓰기)
    const handleImportToExisting = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedListId) return;
        const file = e.target.files?.[0];
        if (!file) return;
        if (!confirm('기존 단어들을 모두 삭제하고 선택한 파일의 단어들로 교체하시겠습니까?')) {
            e.target.value = '';
            return;
        }
        const result = await importWordsIntoList(selectedListId, file);
        if (result.ok) {
            alert(`${result.data}개의 단어를 가져왔습니다.`);
            refresh();
        } else {
            alert(result.error.message);
        }
        e.target.value = '';
    };

    // 단어 모달 제어
    const openAddModal = () => {
        setWordModal({ open: true, mode: 'add', data: EMPTY_WORD });
        setWordError('');
    };
    const openEditModal = (word: Word) => {
        setWordModal({
            open: true, mode: 'edit', wordId: word.id,
            data: {
                japanese: word.japanese, reading: word.reading,
                romaji: word.romaji, meaning_ko: word.meaning_ko,
                difficulty: word.difficulty,
                tags: word.tags || [],
            },
        });
        setWordError('');
    };

    const handleSaveWord = () => {
        if (!selectedListId) return;
        const { japanese, reading, romaji } = wordModal.data;
        if (!japanese || !reading || !romaji) {
            setWordError('일본어·읽기·로마자는 필수입니다.'); return;
        }
        if (wordModal.mode === 'add') {
            const result = addWordToList(selectedListId, wordModal.data);
            if (!result.ok) { setWordError(result.error.message); return; }
        } else {
            if (!wordModal.wordId) return;
            const result = updateWordInList(selectedListId, wordModal.wordId, wordModal.data);
            if (!result.ok) { setWordError(result.error.message); return; }
        }
        setWordModal({ open: false, mode: 'add', data: EMPTY_WORD });
        refresh();
    };

    const handleDeleteWord = (wordId: string) => {
        if (!selectedListId || !confirm('단어를 삭제할까요?')) return;
        deleteWordFromList(selectedListId, wordId);
        refresh();
    };

    const filteredWords = (selectedList?.words ?? []).filter((w) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            w.japanese.includes(searchQuery) ||
            w.reading.includes(q) ||
            w.romaji.toLowerCase().includes(q) ||
            w.meaning_ko.includes(searchQuery)
        );
    });

    return (
        <div className={`${styles.page} scrollable`}>
            <header className={styles.header}>
                <Link href="/" className={styles.backBtn}>← 홈</Link>
                <h1 className={`${styles.title} jp`}>単語帳管理</h1>
                <Link href="/practice/words" className={styles.practiceBtn}>
                    ✏️ 연습하기
                </Link>
            </header>

            <div className={styles.body}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>단어장 목록</div>

                    <div className={styles.createBox}>
                        <input
                            className={styles.createInput}
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                            placeholder="새 단어장 이름..."
                        />
                        <button className={styles.createBtn} onClick={handleCreateList} title="새 단어장">+</button>
                    </div>

                    <div className={styles.sidebarActions}>
                        <button className={styles.importBtn} onClick={() => fileInputRef.current?.click()}>
                            📥 JSON 가져오기
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept=".json" onChange={handleFileImport} />
                    </div>

                    <div className={styles.listItems}>
                        {lists.map((list) => (
                            <div
                                key={list.id}
                                className={`${styles.listItem} ${selectedListId === list.id ? styles.listItemActive : ''}`}
                            >
                                <button
                                    className={styles.listItemBtn}
                                    onClick={() => { setSelectedListId(list.id); setEditMetaMode(false); }}
                                >
                                    <span className={styles.listItemName}>{list.name_ko || list.name}</span>
                                    <span className={styles.listItemCount}>{list.words.length}</span>
                                </button>
                                {!list.isBuiltIn && (
                                    <button
                                        className={styles.listDeleteBtn}
                                        onClick={() => handleDeleteList(list.id)}
                                        title="삭제"
                                    >×</button>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                <main className={styles.main}>
                    {!selectedList ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📚</div>
                            <p>왼쪽에서 단어장을 선택하거나 새로 만드세요</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.wordListHeader}>
                                <div className={styles.wordListTitleArea}>
                                    {editMetaMode && !selectedList.isBuiltIn ? (
                                        <div className={styles.editMetaBox}>
                                            <input
                                                className={styles.editMetaInput}
                                                value={editMetaName}
                                                onChange={(e) => setEditMetaName(e.target.value)}
                                                placeholder="단어장 이름"
                                                autoFocus
                                            />
                                            <textarea
                                                className={styles.editMetaDesc}
                                                value={editMetaDesc}
                                                onChange={(e) => setEditMetaDesc(e.target.value)}
                                                placeholder="단어장에 대한 설명..."
                                            />
                                            <div className={styles.editMetaBtns}>
                                                <button className={styles.metaSaveBtn} onClick={handleSaveMeta}>저장</button>
                                                <button className={styles.metaCancelBtn} onClick={() => setEditMetaMode(false)}>취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.titleDisplay}>
                                            <div className={styles.titleRow}>
                                                <h2 className={`${styles.wordListTitle} jp`}>{selectedList.name_ko || selectedList.name}</h2>
                                                {!selectedList.isBuiltIn && (
                                                    <button className={styles.editTitleBtn} onClick={startEditMeta} title="제목/설명 수정">
                                                        ✏️
                                                    </button>
                                                )}
                                                {selectedList.isBuiltIn && <span className={styles.builtinBadge}>내장</span>}
                                            </div>
                                            <p className={styles.wordListDesc}>{selectedList.description || '설명이 없습니다.'}</p>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.wordListActions}>
                                    <div className={styles.searchBox}>
                                        <input
                                            className={styles.searchInput}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="🔍 단어 검색..."
                                        />
                                    </div>
                                    <div className={styles.extraActions}>
                                        {!selectedList.isBuiltIn && (
                                            <>
                                                <button className={styles.addWordBtn} onClick={openAddModal}>+ 단어 추가</button>
                                                <button className={styles.actionBtn} onClick={() => importToExistingRef.current?.click()} title="JSON에서 단어 교체">
                                                    📥 가져오기
                                                </button>
                                                <input type="file" ref={importToExistingRef} hidden accept=".json" onChange={handleImportToExisting} />
                                            </>
                                        )}
                                        <button className={styles.actionBtn} onClick={handleExport} title="JSON으로 내보내기">
                                            📤 내보내기
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.wordTableContainer}>
                                {filteredWords.length === 0 ? (
                                    <div className={styles.empty}>
                                        <p>{searchQuery ? '검색 결과가 없습니다.' : '단어가 없습니다. 단어를 추가하거나 JSON을 가져오세요.'}</p>
                                    </div>
                                ) : (
                                    <table className={styles.wordTable}>
                                        <thead>
                                            <tr>
                                                <th>일본어</th>
                                                <th>읽기</th>
                                                <th>로마자</th>
                                                <th>의미</th>
                                                <th>難易度</th>
                                                {!selectedList.isBuiltIn && <th>관리</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredWords.map((word) => (
                                                <tr key={word.id} className={styles.wordRow}>
                                                    <td className={`${styles.tdJp} jp`}>{word.japanese}</td>
                                                    <td className={`${styles.tdReading} jp`}>{word.reading}</td>
                                                    <td className={styles.tdRomaji}>{word.romaji}</td>
                                                    <td className={styles.tdMeaning}>{word.meaning_ko}</td>
                                                    <td className={styles.tdDiff}>{'★'.repeat(word.difficulty)}</td>
                                                    {!selectedList.isBuiltIn && (
                                                        <td className={styles.tdActions}>
                                                            <button className={styles.editBtn} onClick={() => openEditModal(word)}>편집</button>
                                                            <button className={styles.deleteBtn} onClick={() => handleDeleteWord(word.id)}>삭제</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {wordModal.open && (
                <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setWordModal({ ...wordModal, open: false })}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>{wordModal.mode === 'add' ? '새 단어 추가' : '단어 편집'}</h3>
                        <div className={styles.formGrid}>
                            <label className={styles.field}>
                                <span>일본어 (한자 포함) *</span>
                                <input value={wordModal.data.japanese} onChange={e => setWordModal({ ...wordModal, data: { ...wordModal.data, japanese: e.target.value } })} placeholder="예: 資産" />
                            </label>
                            <label className={styles.field}>
                                <span>읽기 (히라가나) *</span>
                                <input className="jp" value={wordModal.data.reading} onChange={e => setWordModal({ ...wordModal, data: { ...wordModal.data, reading: e.target.value } })} placeholder="예: しさん" />
                            </label>
                            <label className={styles.field}>
                                <span>로마자 *</span>
                                <input value={wordModal.data.romaji} onChange={e => setWordModal({ ...wordModal, data: { ...wordModal.data, romaji: e.target.value } })} placeholder="예: shisan" />
                            </label>
                            <label className={styles.field}>
                                <span>한국어 의미</span>
                                <input value={wordModal.data.meaning_ko} onChange={e => setWordModal({ ...wordModal, data: { ...wordModal.data, meaning_ko: e.target.value } })} placeholder="예: 자산" />
                            </label>
                            <label className={styles.field}>
                                <span>난이도</span>
                                <div className={styles.diffGroup}>
                                    {[1, 2, 3, 4, 5].map(d => (
                                        <button key={d} className={`${styles.diffItem} ${wordModal.data.difficulty === d ? styles.diffActive : ''}`} onClick={() => setWordModal({ ...wordModal, data: { ...wordModal.data, difficulty: d as any } })}>{d}</button>
                                    ))}
                                </div>
                            </label>
                        </div>
                        {wordError && <p className={styles.modalError}>{wordError}</p>}
                        <div className={styles.modalFooter}>
                            <button className={styles.modalCancel} onClick={() => setWordModal({ ...wordModal, open: false })}>취소</button>
                            <button className={styles.modalSave} onClick={handleSaveWord}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
