import builtInSentences from '@/assets/sentences/sentences.json';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type SentenceCategory =
    | 'greeting' | 'daily' | 'business' | 'accounting'
    | 'nature' | 'health' | 'tech' | 'custom';

export interface Sentence {
    id: string;
    japanese: string;   // 표시용 (한자 포함)
    reading: string;    // 히라가나 읽기
    romaji: string;     // 기대 romaji
    meaning_ko: string; // 한국어 의미
    category: SentenceCategory;
    difficulty: DifficultyLevel;
}

const STORAGE_KEY = 'jtg:custom-sentences';

// ─── 커스텀 문장 로드/저장 ─────────────────────────────────────────────────
export function loadCustomSentences(): Sentence[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Sentence[]) : [];
    } catch {
        return [];
    }
}

export function saveCustomSentences(sentences: Sentence[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));
}

// ─── 전체 문장 조회 ──────────────────────────────────────────────────────────
export function getAllSentences(): Sentence[] {
    const custom = loadCustomSentences();
    return [...(builtInSentences as Sentence[]), ...custom];
}

// ─── 추가 ────────────────────────────────────────────────────────────────────
export function addSentence(data: Omit<Sentence, 'id'>): Sentence {
    const custom = loadCustomSentences();
    const newSentence: Sentence = {
        ...data,
        id: `custom-s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: data.category ?? 'custom',
    };
    saveCustomSentences([...custom, newSentence]);
    return newSentence;
}

// ─── 수정 ────────────────────────────────────────────────────────────────────
export function updateSentence(id: string, patch: Partial<Omit<Sentence, 'id'>>): boolean {
    const custom = loadCustomSentences();
    const idx = custom.findIndex((s) => s.id === id);
    if (idx < 0) return false; // 내장 문장은 수정 불가
    custom[idx] = { ...custom[idx], ...patch };
    saveCustomSentences(custom);
    return true;
}

// ─── 삭제 ────────────────────────────────────────────────────────────────────
export function deleteSentence(id: string): boolean {
    const custom = loadCustomSentences();
    const next = custom.filter((s) => s.id !== id);
    if (next.length === custom.length) return false; // 내장 문장은 삭제 불가
    saveCustomSentences(next);
    return true;
}

// ─── 필터/샘플링 ─────────────────────────────────────────────────────────────
export function filterSentences(opts: {
    categories?: SentenceCategory[];
    difficulty?: [DifficultyLevel, DifficultyLevel]; // [min, max]
    includeCustom?: boolean;
}): Sentence[] {
    let pool: Sentence[] = builtInSentences as Sentence[];
    if (opts.includeCustom !== false) pool = [...pool, ...loadCustomSentences()];
    if (opts.categories?.length) pool = pool.filter((s) => opts.categories!.includes(s.category));
    if (opts.difficulty) {
        const [min, max] = opts.difficulty;
        pool = pool.filter((s) => s.difficulty >= min && s.difficulty <= max);
    }
    return pool;
}

export function pickSentences(pool: Sentence[], count: number): Sentence[] {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── 카테고리 메타 ───────────────────────────────────────────────────────────
export const CATEGORY_META: Record<SentenceCategory, { label: string; emoji: string }> = {
    greeting: { label: '인사말', emoji: '👋' },
    daily: { label: '일상회화', emoji: '💬' },
    business: { label: '비즈니스', emoji: '💼' },
    accounting: { label: '회계·재무', emoji: '📊' },
    nature: { label: '자연·계절', emoji: '🌸' },
    health: { label: '건강', emoji: '💪' },
    tech: { label: '기술', emoji: '🤖' },
    custom: { label: '커스텀', emoji: '✏️' },
};
