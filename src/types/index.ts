// ─── 단어 엔티티 ───────────────────────────────────────────────────────────────
export type WordCategory =
    | 'accounting'
    | 'hiragana-basic'
    | 'katakana-basic'
    | 'n5'
    | 'n4'
    | 'n3'
    | 'sentence-short'
    | 'sentence-long'
    | 'custom';

export interface Word {
    id: string;
    japanese: string;
    reading: string;
    romaji: string;
    meaning_ko: string;
    category: WordCategory;
    difficulty: 1 | 2 | 3 | 4 | 5;
    tags: string[];
}

export interface KanjiWord {
    id: string;
    reading: string;      // hiragana
    correctKanji: string;
    candidates: string[]; // List of kanji candidates including the correct one
    meaning_ko: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface LongText {
    id: string;
    title: string;
    author: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    content: string; // The display text (with Kanji)
    reading: string; // The reading text (Hiragana)
}

// ─── 낙하 중인 단어 (게임 런타임) ────────────────────────────────────────────
export interface FallingWord {
    instanceId: string;
    word: Word;
    x: number;          // vw 단위 (5 ~ 85)
    y: number;          // px 단위
    speed: number;      // px/frame
    isMatched: boolean;
    opacity: number;    // 0 ~ 1
    color: string;
}

// ─── 게임 상태 ────────────────────────────────────────────────────────────────
export type GameStatus =
    | 'idle'
    | 'countdown'
    | 'playing'
    | 'paused'
    | 'gameover'
    | 'clear';

export type GameMode =
    | 'falling-words'
    | 'keyboard-basic'
    | 'word-practice'
    | 'sentence'
    | 'long-text'
    | 'kanji-convert'
    | 'bomb'
    | 'quiz';

export interface GameState {
    status: GameStatus;
    mode: GameMode;
    level: 1 | 2 | 3 | 4 | 5;
    score: number;
    combo: number;
    maxCombo: number;
    lives: number;
    elapsed: number;          // ms
    fallingWords: FallingWord[];
    wordQueue: Word[];
    usedWordIds: string[];
    correctWords: number;
    totalKeystrokes: number;
    correctKeystrokes: number;
    countdownValue: number;   // 3, 2, 1, 0
}

// ─── 입력 상태 ────────────────────────────────────────────────────────────────
export type InputMode = 'romaji' | 'hiragana' | 'katakana';

export interface InputState {
    currentInput: string;     // 히라가나로 변환된 입력
    rawInput: string;         // 원본 입력 (로마자)
    inputMode: InputMode;
    isComposing: boolean;
}

// ─── 통계 ─────────────────────────────────────────────────────────────────────
export interface SessionRecord {
    id: string;
    mode: GameMode;
    level: number;
    wordListId: string;
    wpm: number;
    accuracy: number;
    totalWords: number;
    correctWords: number;
    duration: number;
    timestamp: string;
}

export interface MistakeRecord {
    wordId: string;
    word: Word;
    mistakeCount: number;
    lastMistakeAt: string;
}

// ─── 설정 ─────────────────────────────────────────────────────────────────────
export interface AppSettings {
    inputMode: InputMode;
    speed: 1 | 2 | 3 | 4 | 5;
    theme: 'dark' | 'light';
    soundEnabled: boolean;
    bgmEnabled: boolean;
    bgmVolume: number;
    sfxVolume: number;
    showFurigana: boolean;
    showMeaning: boolean;
    selectedWordListId: string;
}

// ─── 단어장 ───────────────────────────────────────────────────────────────────
export interface WordList {
    id: string;
    name: string;
    name_ko: string;
    description: string;
    words: Word[];
    isBuiltIn: boolean;
    createdAt: string;
}

// ─── 레벨 설정 ────────────────────────────────────────────────────────────────
export interface LevelConfig {
    baseSpeed: number;
    spawnInterval: number;
    maxOnScreen: number;
}

// ─── 결과 타입 ─────────────────────────────────────────────────────────────────
export type Result<T, E = Error> =
    | { ok: true; data: T }
    | { ok: false; error: E };

// ─── 베스트 기록 ──────────────────────────────────────────────────────────────
export interface BestRecords {
    [mode: string]: {
        bestWpm: number;
        bestAccuracy: number;
        totalSessions: number;
    };
}
