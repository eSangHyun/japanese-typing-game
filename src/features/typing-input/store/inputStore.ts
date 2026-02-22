import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InputState, InputMode } from '@/types';
import { toHiragana } from '@/lib/romajiConverter';

interface InputActions {
    setRawInput: (raw: string) => void;
    clearInput: () => void;
    setInputMode: (mode: InputMode) => void;
    setComposing: (isComposing: boolean) => void;
    setComposedInput: (text: string) => void;  // IME 확정 후 가나 직접 설정
}

const DEFAULT_INPUT_MODE: InputMode = 'romaji';

export const useInputStore = create<InputState & InputActions>()(
    immer((set) => ({
        // state
        currentInput: '',
        rawInput: '',
        inputMode: DEFAULT_INPUT_MODE,
        isComposing: false,

        // actions
        setRawInput: (raw) =>
            set((state) => {
                state.rawInput = raw;
                if (state.inputMode === 'romaji') {
                    state.currentInput = toHiragana(raw);
                } else {
                    state.currentInput = raw;
                }
            }),

        clearInput: () =>
            set((state) => {
                state.rawInput = '';
                state.currentInput = '';
            }),

        setInputMode: (mode) =>
            set((state) => {
                state.inputMode = mode;
                state.rawInput = '';
                state.currentInput = '';
            }),

        setComposing: (isComposing) =>
            set((state) => {
                state.isComposing = isComposing;
            }),

        setComposedInput: (text) =>
            set((state) => {
                state.currentInput = text;
                state.rawInput = text;
                state.isComposing = false;
            }),
    }))
);
