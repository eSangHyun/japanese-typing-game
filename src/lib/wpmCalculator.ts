/**
 * WPM (Words Per Minute) 계산
 * 일본어는 완성된 단어 개수 기준으로 계산
 */
export function calculateWPM(completedWords: number, elapsedMs: number): number {
    if (elapsedMs <= 0) return 0;
    const minutes = elapsedMs / 60000;
    return Math.round(completedWords / minutes);
}

/**
 * 정확도 계산 (0 ~ 100)
 */
export function calculateAccuracy(
    totalKeystrokes: number,
    correctKeystrokes: number
): number {
    if (totalKeystrokes <= 0) return 100;
    return Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10;
}

/**
 * 콤보 보너스 점수 계산
 */
export function calculateScore(combo: number, level: number): number {
    const base = 100;
    const comboBonus = Math.min(combo * 10, 200);
    const levelMultiplier = 1 + (level - 1) * 0.2;
    return Math.round((base + comboBonus) * levelMultiplier);
}

/**
 * 경과 시간을 mm:ss 형식으로 포맷
 */
export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 세션 ID 생성
 */
export function generateSessionId(): string {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 6);
    return `sess-${dateStr}-${random}`;
}
