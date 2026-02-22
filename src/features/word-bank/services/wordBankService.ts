import type { WordList, Word, Result } from '@/types';
import accountingWords from '@/assets/wordlists/accounting.json';
import parkWords from '@/assets/wordlists/park.json';
import {
    loadCustomWordLists,
    saveCustomWordList,
    deleteCustomWordList as storageDelete,
} from '@/lib/storage';

// ─── 내장 단어장 (읽기 전용 — 재무·계정과목만) ──────────────────────────────
const BUILT_IN_LISTS: WordList[] = [
    {
        id: 'accounting',
        name: '会計・財務',
        name_ko: '재무·계정과목',
        description: '회계 및 재무 관련 일본어 단어 60개',
        words: accountingWords as Word[],
        isBuiltIn: true,
        createdAt: '2026-02-22T00:00:00+09:00',
    },
];

// park.json 기본 시드 (한 번만 — localStorage에 없을 때만)
const PARK_SEED: WordList = {
    id: 'park-practice',
    name: '박수현 練習単語',
    name_ko: '박수현연습단어',
    description: '판관비·자산·수익 계정과목 34개',
    words: parkWords as Word[],
    isBuiltIn: false,
    createdAt: '2026-02-22T14:12:00+09:00',
};

/** 앱 초기화 시 호출 — park 단어장이 없으면 localStorage에 시드 */
export function seedDefaultLists(): void {
    if (typeof window === 'undefined') return;
    const custom = loadCustomWordLists();
    if (!custom.find((l) => l.id === 'park-practice')) {
        saveCustomWordList(PARK_SEED);
    }
}

// ─── 조회 ─────────────────────────────────────────────────────────────────────
export function getAllWordLists(): WordList[] {
    seedDefaultLists(); // 조회 시 마다 시딩 확인 (Park 단어장 등)
    const custom = loadCustomWordLists();
    return [...BUILT_IN_LISTS, ...custom];
}

export function getWordListById(id: string): Result<WordList> {
    const found = getAllWordLists().find((l) => l.id === id);
    if (!found) return { ok: false, error: new Error(`단어장을 찾을 수 없습니다: ${id}`) };
    return { ok: true, data: found };
}

/** 여러 ID의 단어를 합쳐 반환 */
export function getWordsByListIds(ids: string[]): Word[] {
    const all = getAllWordLists();
    const seen = new Set<string>();
    const words: Word[] = [];
    for (const list of all) {
        if (!ids.includes(list.id)) continue;
        for (const w of list.words) {
            if (!seen.has(w.id)) { seen.add(w.id); words.push(w); }
        }
    }
    return words;
}

export function pickWords(list: WordList, count: number): Word[] {
    const shuffled = [...list.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── 단어장 생성 ──────────────────────────────────────────────────────────────
export function createWordList(name: string): Result<WordList> {
    const existing = loadCustomWordLists();
    const duplicate = existing.find((l) => l.name === name);
    if (duplicate) return { ok: false, error: new Error('같은 이름의 단어장이 이미 존재합니다.') };

    const newList: WordList = {
        id: `custom-${Date.now()}`,
        name,
        name_ko: name,
        description: '',
        words: [],
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
    };
    const result = saveCustomWordList(newList);
    if (!result.ok) return result;
    return { ok: true, data: newList };
}

// ─── 단어장 메타 수정 (이름 + 설명) ──────────────────────────────────────────
export function updateWordListMeta(
    listId: string,
    patch: { name?: string; description?: string }
): Result<void> {
    const result = getWordListById(listId);
    if (!result.ok) return result;
    const list = result.data;
    if (list.isBuiltIn) return { ok: false, error: new Error('내장 단어장은 수정할 수 없습니다.') };
    return saveCustomWordList({
        ...list,
        name: patch.name ?? list.name,
        name_ko: patch.name ?? list.name_ko,
        description: patch.description ?? list.description,
    });
}

// ─── 단어 추가 ────────────────────────────────────────────────────────────────
export function addWordToList(
    listId: string,
    wordData: Omit<Word, 'id' | 'category'>
): Result<Word> {
    const result = getWordListById(listId);
    if (!result.ok) return result;
    const list = result.data;
    if (list.isBuiltIn) return { ok: false, error: new Error('내장 단어장은 편집할 수 없습니다.') };

    const newWord: Word = {
        ...wordData,
        id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: 'custom',
    };
    const updated: WordList = { ...list, words: [...list.words, newWord] };
    saveCustomWordList(updated);
    return { ok: true, data: newWord };
}

// ─── 단어 수정 ────────────────────────────────────────────────────────────────
export function updateWordInList(
    listId: string,
    wordId: string,
    patch: Partial<Omit<Word, 'id' | 'category'>>
): Result<void> {
    const result = getWordListById(listId);
    if (!result.ok) return result;
    const list = result.data;
    if (list.isBuiltIn) return { ok: false, error: new Error('내장 단어장은 편집할 수 없습니다.') };

    const updated: WordList = {
        ...list,
        words: list.words.map((w) => (w.id === wordId ? { ...w, ...patch } : w)),
    };
    return saveCustomWordList(updated);
}

// ─── 단어 삭제 ────────────────────────────────────────────────────────────────
export function deleteWordFromList(listId: string, wordId: string): Result<void> {
    const result = getWordListById(listId);
    if (!result.ok) return result;
    const list = result.data;
    if (list.isBuiltIn) return { ok: false, error: new Error('내장 단어장은 편집할 수 없습니다.') };

    const updated: WordList = { ...list, words: list.words.filter((w) => w.id !== wordId) };
    return saveCustomWordList(updated);
}

// ─── 단어장 삭제 ──────────────────────────────────────────────────────────────
export function deleteWordList(listId: string): Result<void> {
    const result = getWordListById(listId);
    if (!result.ok) return result;
    if (result.data.isBuiltIn) return { ok: false, error: new Error('내장 단어장은 삭제할 수 없습니다.') };
    storageDelete(listId);
    return { ok: true, data: undefined };
}

// ─── 이름 변경 (updateWordListMeta로 대체되지만 하위 호환 유지) ───────────────
export function renameWordList(listId: string, newName: string): Result<void> {
    return updateWordListMeta(listId, { name: newName });
}

// ─── JSON 내보내기 ────────────────────────────────────────────────────────────
export function exportWordListAsJson(list: WordList): void {
    const data = JSON.stringify(list.words, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name_ko || list.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── JSON 파일 가져오기 (새 단어장 생성) ────────────────────────────────────
export async function parseWordListFile(file: File, name: string): Promise<Result<WordList>> {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) return { ok: false, error: new Error('JSON 배열 형식이어야 합니다.') };

        const words: Word[] = data.map((item, idx) => {
            if (!item.japanese || !item.reading || !item.romaji) {
                throw new Error(`${idx + 1}번째 항목에 필수 필드 누락 (japanese, reading, romaji)`);
            }
            return {
                id: item.id ?? `custom-${idx}-${Date.now()}`,
                japanese: String(item.japanese).slice(0, 50),
                reading: String(item.reading).slice(0, 50),
                romaji: String(item.romaji).slice(0, 50),
                meaning_ko: String(item.meaning_ko ?? '').slice(0, 100),
                category: 'custom' as const,
                difficulty: (item.difficulty as 1 | 2 | 3 | 4 | 5) ?? 1,
                tags: item.tags ?? [],
            };
        });

        const wordList: WordList = {
            id: `custom-${Date.now()}`,
            name,
            name_ko: name,
            description: `JSON 가져오기 (${words.length}개)`,
            words,
            isBuiltIn: false,
            createdAt: new Date().toISOString(),
        };

        const saveResult = saveCustomWordList(wordList);
        if (!saveResult.ok) return saveResult;
        return { ok: true, data: wordList };
    } catch (e) {
        return { ok: false, error: e as Error };
    }
}

// ─── JSON 파일로 기존 단어장 단어 교체(가져오기) ─────────────────────────────
export async function importWordsIntoList(listId: string, file: File): Promise<Result<number>> {
    const result = getWordListById(listId);
    if (!result.ok) return result;
    const list = result.data;
    if (list.isBuiltIn) return { ok: false, error: new Error('내장 단어장은 교체할 수 없습니다.') };

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) return { ok: false, error: new Error('JSON 배열 형식이어야 합니다.') };

        const words: Word[] = data.map((item, idx) => {
            if (!item.japanese || !item.reading || !item.romaji) {
                throw new Error(`${idx + 1}번째에 필수 필드 누락`);
            }
            return {
                id: `w-${Date.now()}-${idx}`,
                japanese: String(item.japanese),
                reading: String(item.reading),
                romaji: String(item.romaji),
                meaning_ko: String(item.meaning_ko ?? ''),
                category: 'custom' as const,
                difficulty: (item.difficulty as 1 | 2 | 3 | 4 | 5) ?? 1,
                tags: item.tags ?? [],
            };
        });

        saveCustomWordList({ ...list, words });
        return { ok: true, data: words.length };
    } catch (e) {
        return { ok: false, error: e as Error };
    }
}
