import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: '日本語タイピング練習 | 일본어 타자연습',
    description: '재무·계정과목 단어 중심의 일본어 타자연습 게임. 단어 낙하, 자리연습, 통계 추적 지원.',
    keywords: ['일본어 타자연습', '日本語タイピング', '재무 일본어', '계정과목', 'typing game'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" data-theme="dark">
            <body>{children}</body>
        </html>
    );
}
