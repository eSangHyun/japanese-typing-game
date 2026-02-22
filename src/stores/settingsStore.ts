import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
    inputMode: 'romaji',
    speed: 3,
    theme: 'dark',
    soundEnabled: true,
    bgmEnabled: false,
    bgmVolume: 0.4,
    sfxVolume: 0.7,
    showFurigana: true,
    showMeaning: true,
    selectedWordListId: 'accounting',
};

interface SettingsActions {
    updateSettings: (partial: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<AppSettings & SettingsActions>()(
    persist(
        immer((set) => ({
            ...DEFAULT_SETTINGS,

            updateSettings: (partial) =>
                set((state) => {
                    Object.assign(state, partial);
                }),

            resetSettings: () => set(() => ({ ...DEFAULT_SETTINGS })),
        })),
        {
            name: 'jtg:settings',
        }
    )
);
