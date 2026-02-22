import type { Result, WordList, SessionRecord, BestRecords, MistakeRecord, AppSettings } from '@/types';

const KEYS = {
    SESSIONS: 'jtg:sessions',
    RECORDS: 'jtg:records',
    MISTAKES: 'jtg:mistakes',
    SETTINGS: 'jtg:settings',
    WORDLISTS: 'jtg:wordlists',
} as const;

const MAX_SESSIONS = 100;
const MAX_MISTAKES = 500;

function safeGet<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function safeSet<T>(key: string, value: T): Result<void> {
    if (typeof window === 'undefined') return { ok: false, error: new Error('SSR') };
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return { ok: true, data: undefined };
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            // 용량 초과 시 오래된 세션 삭제
            pruneSessions();
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return { ok: true, data: undefined };
            } catch {
                return { ok: false, error: e };
            }
        }
        return { ok: false, error: e as Error };
    }
}

function pruneSessions(): void {
    const sessions = safeGet<SessionRecord[]>(KEYS.SESSIONS) ?? [];
    const pruned = sessions.slice(-50); // 최근 50개만 유지
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(pruned));
}

// ─── Sessions ───────────────────────────────────────────────────────────────
export function saveSummarySession(session: SessionRecord): Result<void> {
    const sessions = safeGet<SessionRecord[]>(KEYS.SESSIONS) ?? [];
    const updated = [...sessions, session].slice(-MAX_SESSIONS);
    return safeSet(KEYS.SESSIONS, updated);
}

export function loadSessions(): SessionRecord[] {
    return safeGet<SessionRecord[]>(KEYS.SESSIONS) ?? [];
}

export function clearSessions(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.SESSIONS);
    localStorage.removeItem(KEYS.RECORDS);
}

// ─── Best Records ────────────────────────────────────────────────────────────
export function updateBestRecord(mode: string, wpm: number, accuracy: number): void {
    const records = safeGet<BestRecords>(KEYS.RECORDS) ?? {};
    const current = records[mode] ?? { bestWpm: 0, bestAccuracy: 0, totalSessions: 0 };
    records[mode] = {
        bestWpm: Math.max(current.bestWpm, wpm),
        bestAccuracy: Math.max(current.bestAccuracy, accuracy),
        totalSessions: current.totalSessions + 1,
    };
    safeSet(KEYS.RECORDS, records);
}

export function loadBestRecords(): BestRecords {
    return safeGet<BestRecords>(KEYS.RECORDS) ?? {};
}

// ─── Mistakes ────────────────────────────────────────────────────────────────
export function recordMistake(record: MistakeRecord): void {
    const mistakes = safeGet<MistakeRecord[]>(KEYS.MISTAKES) ?? [];
    const idx = mistakes.findIndex(m => m.wordId === record.wordId);
    if (idx >= 0) {
        mistakes[idx] = record;
    } else {
        mistakes.push(record);
    }
    safeSet(KEYS.MISTAKES, mistakes.slice(-MAX_MISTAKES));
}

export function loadMistakes(): MistakeRecord[] {
    return safeGet<MistakeRecord[]>(KEYS.MISTAKES) ?? [];
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function saveSettings(settings: AppSettings): void {
    safeSet(KEYS.SETTINGS, settings);
}

export function loadSettings(): AppSettings | null {
    return safeGet<AppSettings>(KEYS.SETTINGS);
}

// ─── Custom Word Lists ───────────────────────────────────────────────────────
export function saveCustomWordList(list: WordList): Result<void> {
    const lists = safeGet<WordList[]>(KEYS.WORDLISTS) ?? [];
    const idx = lists.findIndex(l => l.id === list.id);
    if (idx >= 0) {
        lists[idx] = list;
    } else {
        lists.push(list);
    }
    return safeSet(KEYS.WORDLISTS, lists);
}

export function loadCustomWordLists(): WordList[] {
    return safeGet<WordList[]>(KEYS.WORDLISTS) ?? [];
}

export function deleteCustomWordList(id: string): void {
    const lists = safeGet<WordList[]>(KEYS.WORDLISTS) ?? [];
    safeSet(KEYS.WORDLISTS, lists.filter(l => l.id !== id));
}

export function clearAllData(): void {
    if (typeof window === 'undefined') return;
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
