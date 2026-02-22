import { FallingWordsGame } from '@/features/falling-words/components/FallingWordsGame';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '단어 낙하 게임 | 일본어 타자연습',
    description: '단어가 위에서 내려옵니다. 빠르게 타이핑하세요!',
};

export default function FallingGamePage() {
    return <FallingWordsGame />;
}
