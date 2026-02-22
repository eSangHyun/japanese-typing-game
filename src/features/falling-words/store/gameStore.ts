import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, GameMode, FallingWord, Word } from '@/types';
import { calculateScore } from '@/lib/wpmCalculator';

export type LevelConfig = {
    baseSpeed: number;
    spawnInterval: number;
    maxOnScreen: number;
};

export const LEVEL_CONFIG: Record<number, LevelConfig> = {
    1: { baseSpeed: 0.3, spawnInterval: 4000, maxOnScreen: 3 },
    2: { baseSpeed: 0.6, spawnInterval: 3000, maxOnScreen: 4 },
    3: { baseSpeed: 1.0, spawnInterval: 2500, maxOnScreen: 5 },
    4: { baseSpeed: 1.5, spawnInterval: 2000, maxOnScreen: 6 },
    5: { baseSpeed: 2.2, spawnInterval: 1500, maxOnScreen: 8 },
};

export const FLOOR_Y = 580; // 바닥선 px (CSS와 동기화 필요)

export const WORD_COLORS = [
    '#60A5FA', '#34D399', '#FBBF24', '#F87171',
    '#A78BFA', '#38BDF8', '#FB923C', '#4ADE80',
];

const initialState: GameState = {
    status: 'idle',
    mode: 'falling-words',
    level: 3,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    elapsed: 0,
    fallingWords: [],
    wordQueue: [],
    usedWordIds: [],
    correctWords: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    countdownValue: 3,
};

interface GameActions {
    startGame: (config: { mode: GameMode; level: 1 | 2 | 3 | 4 | 5; words: Word[] }) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    endGame: () => void;
    setCountdown: (value: number) => void;
    setPlaying: () => void;
    tick: (deltaTime: number, floorY: number) => void;
    spawnWord: () => FallingWord | null;
    matchWord: (instanceId: string) => void;
    addKeystroke: (correct: boolean) => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState & GameActions>()(
    immer((set, get) => ({
        ...initialState,

        startGame: ({ mode, level, words }) =>
            set((state) => {
                Object.assign(state, {
                    ...initialState,
                    status: 'countdown',
                    mode,
                    level,
                    wordQueue: [...words],
                    countdownValue: 3,
                });
            }),

        pauseGame: () => set((s) => { s.status = 'paused'; }),
        resumeGame: () => set((s) => { s.status = 'playing'; }),
        endGame: () => set((s) => { s.status = 'gameover'; }),
        setCountdown: (value) => set((s) => { s.countdownValue = value; }),
        setPlaying: () => set((s) => { s.status = 'playing'; }),
        resetGame: () => set(() => ({ ...initialState })),

        tick: (deltaTime, floorY) =>
            set((state) => {
                if (state.status !== 'playing') return;

                // 1. 위치 업데이트
                state.fallingWords = state.fallingWords.map((w) => ({
                    ...w,
                    y: w.y + w.speed * (deltaTime / 16),
                    opacity: w.isMatched ? Math.max(0, w.opacity - 0.06) : w.opacity,
                }));

                // 2. 소멸 완료된 단어 제거
                state.fallingWords = state.fallingWords.filter((w) => w.opacity > 0);

                // 3. 바닥 도달 감지
                const hitFloor = state.fallingWords.filter(
                    (w) => w.y >= floorY && !w.isMatched
                );

                if (hitFloor.length > 0) {
                    state.lives = Math.max(0, state.lives - hitFloor.length);
                    state.combo = 0;
                    state.fallingWords = state.fallingWords.filter(
                        (w) => w.y < floorY || w.isMatched
                    );
                }

                if (state.lives <= 0) {
                    state.status = 'gameover';
                }

                state.elapsed += deltaTime;
            }),

        spawnWord: () => {
            const state = get();
            const config = LEVEL_CONFIG[state.level];
            if (state.fallingWords.filter(w => !w.isMatched).length >= config.maxOnScreen) {
                return null;
            }

            const available = state.wordQueue.filter(
                (w) => !state.usedWordIds.includes(w.id)
            );
            if (available.length === 0) return null;

            const word = available[Math.floor(Math.random() * available.length)];

            // X 겹침 방지
            const usedX = state.fallingWords.map((w) => w.x);
            let x = 5 + Math.random() * 75;
            for (let i = 0; i < 10; i++) {
                const tooClose = usedX.some((ux) => Math.abs(ux - x) < 12);
                if (!tooClose) break;
                x = 5 + Math.random() * 75;
            }

            const newWord: FallingWord = {
                instanceId: crypto.randomUUID(),
                word,
                x,
                y: -80,
                speed: config.baseSpeed + Math.random() * 0.3,
                isMatched: false,
                opacity: 1,
                color: WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)],
            };

            set((s) => {
                s.fallingWords.push(newWord);
                s.usedWordIds.push(word.id);
            });

            return newWord;
        },

        matchWord: (instanceId) =>
            set((state) => {
                const word = state.fallingWords.find((w) => w.instanceId === instanceId);
                if (!word || word.isMatched) return;
                word.isMatched = true;
                state.score += calculateScore(state.combo, state.level);
                state.combo += 1;
                state.maxCombo = Math.max(state.maxCombo, state.combo);
                state.correctWords += 1;
                state.correctKeystrokes += word.word.reading.length;
                state.totalKeystrokes += word.word.reading.length;
            }),

        addKeystroke: (correct) =>
            set((state) => {
                state.totalKeystrokes += 1;
                if (correct) state.correctKeystrokes += 1;
                if (!correct) state.combo = 0;
            }),
    }))
);
