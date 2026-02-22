/**
 * 히라가나 키보드 레이아웃 & 로마자 매핑
 * 오십음도 (五十音) 기반
 */

export type Kana = {
    kana: string;       // 히라가나
    kata: string;       // 가타카나
    romaji: string;     // 기본 로마자
    altRomaji?: string; // 대체 로마자 (예: し → shi / si)
    row: number;        // 단 (0=あ, 1=か, ...)
    col: number;        // 행 (0=あ, 1=い, ...)
    type: 'seion' | 'dakuten' | 'handakuten' | 'small';
};

// ─── 청음 (清音) ──────────────────────────────────────────────────────────────
export const SEION: Kana[] = [
    // あ단
    { kana: 'あ', kata: 'ア', romaji: 'a', row: 0, col: 0, type: 'seion' },
    { kana: 'い', kata: 'イ', romaji: 'i', row: 0, col: 1, type: 'seion' },
    { kana: 'う', kata: 'ウ', romaji: 'u', row: 0, col: 2, type: 'seion' },
    { kana: 'え', kata: 'エ', romaji: 'e', row: 0, col: 3, type: 'seion' },
    { kana: 'お', kata: 'オ', romaji: 'o', row: 0, col: 4, type: 'seion' },
    // か단
    { kana: 'か', kata: 'カ', romaji: 'ka', row: 1, col: 0, type: 'seion' },
    { kana: 'き', kata: 'キ', romaji: 'ki', row: 1, col: 1, type: 'seion' },
    { kana: 'く', kata: 'ク', romaji: 'ku', row: 1, col: 2, type: 'seion' },
    { kana: 'け', kata: 'ケ', romaji: 'ke', row: 1, col: 3, type: 'seion' },
    { kana: 'こ', kata: 'コ', romaji: 'ko', row: 1, col: 4, type: 'seion' },
    // さ단
    { kana: 'さ', kata: 'サ', romaji: 'sa', row: 2, col: 0, type: 'seion' },
    { kana: 'し', kata: 'シ', romaji: 'si', altRomaji: 'shi', row: 2, col: 1, type: 'seion' },
    { kana: 'す', kata: 'ス', romaji: 'su', row: 2, col: 2, type: 'seion' },
    { kana: 'せ', kata: 'セ', romaji: 'se', row: 2, col: 3, type: 'seion' },
    { kana: 'そ', kata: 'ソ', romaji: 'so', row: 2, col: 4, type: 'seion' },
    // た단
    { kana: 'た', kata: 'タ', romaji: 'ta', row: 3, col: 0, type: 'seion' },
    { kana: 'ち', kata: 'チ', romaji: 'ti', altRomaji: 'chi', row: 3, col: 1, type: 'seion' },
    { kana: 'つ', kata: 'ツ', romaji: 'tu', altRomaji: 'tsu', row: 3, col: 2, type: 'seion' },
    { kana: 'て', kata: 'テ', romaji: 'te', row: 3, col: 3, type: 'seion' },
    { kana: 'と', kata: 'ト', romaji: 'to', row: 3, col: 4, type: 'seion' },
    // な단
    { kana: 'な', kata: 'ナ', romaji: 'na', row: 4, col: 0, type: 'seion' },
    { kana: 'に', kata: 'ニ', romaji: 'ni', row: 4, col: 1, type: 'seion' },
    { kana: 'ぬ', kata: 'ヌ', romaji: 'nu', row: 4, col: 2, type: 'seion' },
    { kana: 'ね', kata: 'ネ', romaji: 'ne', row: 4, col: 3, type: 'seion' },
    { kana: 'の', kata: 'ノ', romaji: 'no', row: 4, col: 4, type: 'seion' },
    // は단
    { kana: 'は', kata: 'ハ', romaji: 'ha', row: 5, col: 0, type: 'seion' },
    { kana: 'ひ', kata: 'ヒ', romaji: 'hi', row: 5, col: 1, type: 'seion' },
    { kana: 'ふ', kata: 'フ', romaji: 'fu', altRomaji: 'hu', row: 5, col: 2, type: 'seion' },
    { kana: 'へ', kata: 'ヘ', romaji: 'he', row: 5, col: 3, type: 'seion' },
    { kana: 'ほ', kata: 'ホ', romaji: 'ho', row: 5, col: 4, type: 'seion' },
    // ま단
    { kana: 'ま', kata: 'マ', romaji: 'ma', row: 6, col: 0, type: 'seion' },
    { kana: 'み', kata: 'ミ', romaji: 'mi', row: 6, col: 1, type: 'seion' },
    { kana: 'む', kata: 'ム', romaji: 'mu', row: 6, col: 2, type: 'seion' },
    { kana: 'め', kata: 'メ', romaji: 'me', row: 6, col: 3, type: 'seion' },
    { kana: 'も', kata: 'モ', romaji: 'mo', row: 6, col: 4, type: 'seion' },
    // や단
    { kana: 'や', kata: 'ヤ', romaji: 'ya', row: 7, col: 0, type: 'seion' },
    { kana: 'ゆ', kata: 'ユ', romaji: 'yu', row: 7, col: 2, type: 'seion' },
    { kana: 'よ', kata: 'ヨ', romaji: 'yo', row: 7, col: 4, type: 'seion' },
    // ら단
    { kana: 'ら', kata: 'ラ', romaji: 'ra', row: 8, col: 0, type: 'seion' },
    { kana: 'り', kata: 'リ', romaji: 'ri', row: 8, col: 1, type: 'seion' },
    { kana: 'る', kata: 'ル', romaji: 'ru', row: 8, col: 2, type: 'seion' },
    { kana: 'れ', kata: 'レ', romaji: 're', row: 8, col: 3, type: 'seion' },
    { kana: 'ろ', kata: 'ロ', romaji: 'ro', row: 8, col: 4, type: 'seion' },
    // わ단
    { kana: 'わ', kata: 'ワ', romaji: 'wa', row: 9, col: 0, type: 'seion' },
    { kana: 'を', kata: 'ヲ', romaji: 'wo', altRomaji: 'o', row: 9, col: 4, type: 'seion' },
    // ん
    { kana: 'ん', kata: 'ン', romaji: 'nn', altRomaji: 'n', row: 10, col: 2, type: 'seion' },
];

// ─── 탁음 (濁音) ──────────────────────────────────────────────────────────────
export const DAKUTEN: Kana[] = [
    { kana: 'が', kata: 'ガ', romaji: 'ga', row: 1, col: 0, type: 'dakuten' },
    { kana: 'ぎ', kata: 'ギ', romaji: 'gi', row: 1, col: 1, type: 'dakuten' },
    { kana: 'ぐ', kata: 'グ', romaji: 'gu', row: 1, col: 2, type: 'dakuten' },
    { kana: 'げ', kata: 'ゲ', romaji: 'ge', row: 1, col: 3, type: 'dakuten' },
    { kana: 'ご', kata: 'ゴ', romaji: 'go', row: 1, col: 4, type: 'dakuten' },
    { kana: 'ざ', kata: 'ザ', romaji: 'za', row: 2, col: 0, type: 'dakuten' },
    { kana: 'じ', kata: 'ジ', romaji: 'zi', altRomaji: 'ji', row: 2, col: 1, type: 'dakuten' },
    { kana: 'ず', kata: 'ズ', romaji: 'zu', row: 2, col: 2, type: 'dakuten' },
    { kana: 'ぜ', kata: 'ゼ', romaji: 'ze', row: 2, col: 3, type: 'dakuten' },
    { kana: 'ぞ', kata: 'ゾ', romaji: 'zo', row: 2, col: 4, type: 'dakuten' },
    { kana: 'だ', kata: 'ダ', romaji: 'da', row: 3, col: 0, type: 'dakuten' },
    { kana: 'ぢ', kata: 'ヂ', romaji: 'di', row: 3, col: 1, type: 'dakuten' },
    { kana: 'づ', kata: 'ヅ', romaji: 'du', row: 3, col: 2, type: 'dakuten' },
    { kana: 'で', kata: 'デ', romaji: 'de', row: 3, col: 3, type: 'dakuten' },
    { kana: 'ど', kata: 'ド', romaji: 'do', row: 3, col: 4, type: 'dakuten' },
    { kana: 'ば', kata: 'バ', romaji: 'ba', row: 5, col: 0, type: 'dakuten' },
    { kana: 'び', kata: 'ビ', romaji: 'bi', row: 5, col: 1, type: 'dakuten' },
    { kana: 'ぶ', kata: 'ブ', romaji: 'bu', row: 5, col: 2, type: 'dakuten' },
    { kana: 'べ', kata: 'ベ', romaji: 'be', row: 5, col: 3, type: 'dakuten' },
    { kana: 'ぼ', kata: 'ボ', romaji: 'bo', row: 5, col: 4, type: 'dakuten' },
];

// ─── 반탁음 (半濁音) ──────────────────────────────────────────────────────────
export const HANDAKUTEN: Kana[] = [
    { kana: 'ぱ', kata: 'パ', romaji: 'pa', row: 5, col: 0, type: 'handakuten' },
    { kana: 'ぴ', kata: 'ピ', romaji: 'pi', row: 5, col: 1, type: 'handakuten' },
    { kana: 'ぷ', kata: 'プ', romaji: 'pu', row: 5, col: 2, type: 'handakuten' },
    { kana: 'ぺ', kata: 'ペ', romaji: 'pe', row: 5, col: 3, type: 'handakuten' },
    { kana: 'ぽ', kata: 'ポ', romaji: 'po', row: 5, col: 4, type: 'handakuten' },
];

// ─── 요음 (拗音) ──────────────────────────────────────────────────────────────
export const YOUON: Kana[] = [
    { kana: 'きゃ', kata: 'キャ', romaji: 'kya', row: 1, col: 0, type: 'seion' },
    { kana: 'きゅ', kata: 'キュ', romaji: 'kyu', row: 1, col: 1, type: 'seion' },
    { kana: 'きょ', kata: 'キョ', romaji: 'kyo', row: 1, col: 2, type: 'seion' },
    { kana: 'しゃ', kata: 'シャ', romaji: 'sya', altRomaji: 'sha', row: 2, col: 0, type: 'seion' },
    { kana: 'しゅ', kata: 'シュ', romaji: 'syu', altRomaji: 'shu', row: 2, col: 1, type: 'seion' },
    { kana: 'しょ', kata: 'ショ', romaji: 'syo', altRomaji: 'sho', row: 2, col: 2, type: 'seion' },
    { kana: 'ちゃ', kata: 'チャ', romaji: 'tya', altRomaji: 'cha', row: 3, col: 0, type: 'seion' },
    { kana: 'ちゅ', kata: 'チュ', romaji: 'tyu', altRomaji: 'chu', row: 3, col: 1, type: 'seion' },
    { kana: 'ちょ', kata: 'チョ', romaji: 'tyo', altRomaji: 'cho', row: 3, col: 2, type: 'seion' },
    { kana: 'にゃ', kata: 'ニャ', romaji: 'nya', row: 4, col: 0, type: 'seion' },
    { kana: 'にゅ', kata: 'ニュ', romaji: 'nyu', row: 4, col: 1, type: 'seion' },
    { kana: 'にょ', kata: 'ニョ', romaji: 'nyo', row: 4, col: 2, type: 'seion' },
    { kana: 'ひゃ', kata: 'ヒャ', romaji: 'hya', row: 5, col: 0, type: 'seion' },
    { kana: 'ひゅ', kata: 'ヒュ', romaji: 'hyu', row: 5, col: 1, type: 'seion' },
    { kana: 'ひょ', kata: 'ヒョ', romaji: 'hyo', row: 5, col: 2, type: 'seion' },
    { kana: 'みゃ', kata: 'ミャ', romaji: 'mya', row: 6, col: 0, type: 'seion' },
    { kana: 'みゅ', kata: 'ミュ', romaji: 'myu', row: 6, col: 1, type: 'seion' },
    { kana: 'みょ', kata: 'ミョ', romaji: 'myo', row: 6, col: 2, type: 'seion' },
    { kana: 'りゃ', kata: 'リャ', romaji: 'rya', row: 8, col: 0, type: 'seion' },
    { kana: 'りゅ', kata: 'リュ', romaji: 'ryu', row: 8, col: 1, type: 'seion' },
    { kana: 'りょ', kata: 'リョ', romaji: 'ryo', row: 8, col: 2, type: 'seion' },
    { kana: 'ぎゃ', kata: 'ギャ', romaji: 'gya', row: 1, col: 0, type: 'dakuten' },
    { kana: 'ぎゅ', kata: 'ギュ', romaji: 'gyu', row: 1, col: 1, type: 'dakuten' },
    { kana: 'ぎょ', kata: 'ギョ', romaji: 'gyo', row: 1, col: 2, type: 'dakuten' },
    { kana: 'じゃ', kata: 'ジャ', romaji: 'zya', altRomaji: 'ja', row: 2, col: 0, type: 'dakuten' },
    { kana: 'じゅ', kata: 'ジュ', romaji: 'zyu', altRomaji: 'ju', row: 2, col: 1, type: 'dakuten' },
    { kana: 'じょ', kata: 'ジョ', romaji: 'zyo', altRomaji: 'jo', row: 2, col: 2, type: 'dakuten' },
    { kana: 'びゃ', kata: 'ビャ', romaji: 'bya', row: 5, col: 0, type: 'dakuten' },
    { kana: 'びゅ', kata: 'ビュ', romaji: 'byu', row: 5, col: 1, type: 'dakuten' },
    { kana: 'びょ', kata: 'ビョ', romaji: 'byo', row: 5, col: 2, type: 'dakuten' },
    { kana: 'ぴゃ', kata: 'ピャ', romaji: 'pya', row: 5, col: 0, type: 'handakuten' },
    { kana: 'ぴゅ', kata: 'ピュ', romaji: 'pyu', row: 5, col: 1, type: 'handakuten' },
    { kana: 'ぴょ', kata: 'ピョ', romaji: 'pyo', row: 5, col: 2, type: 'handakuten' },
];

// ─── 세트 정의 ────────────────────────────────────────────────────────────────
export type KanaSet = 'seion' | 'dakuten' | 'handakuten' | 'youon' | 'all';

export function getKanaSet(sets: KanaSet[]): Kana[] {
    const result: Kana[] = [];
    if (sets.includes('seion') || sets.includes('all')) result.push(...SEION);
    if (sets.includes('dakuten') || sets.includes('all')) result.push(...DAKUTEN);
    if (sets.includes('handakuten') || sets.includes('all')) result.push(...HANDAKUTEN);
    if (sets.includes('youon') || sets.includes('all')) result.push(...YOUON);
    return result;
}

export function checkKanaInput(input: string, kana: Kana): boolean {
    const normalized = input.toLowerCase().trim();
    return normalized === kana.romaji || normalized === kana.altRomaji;
}

// 오십음도 행 순서 라벨
export const ROW_LABELS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'ん'];
export const COL_LABELS = ['ア列', 'イ列', 'ウ列', 'エ列', 'オ列'];
