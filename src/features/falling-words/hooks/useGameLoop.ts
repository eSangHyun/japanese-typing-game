'use client';

import { useEffect, useRef } from 'react';
import { useGameStore, LEVEL_CONFIG, FLOOR_Y } from '../store/gameStore';

/**
 * requestAnimationFrame 기반 게임 루프
 * - 게임 시작(playing) 전환 직후 즉시 첫 단어 스폰
 * - 이후 spawnInterval마다 추가 스폰
 */
export function useGameLoop() {
    const status = useGameStore((s) => s.status);
    const level = useGameStore((s) => s.level);

    // 최신 함수를 ref로 참조 → loop 재생성 없이 항상 최신 값 사용
    const tickRef = useRef(useGameStore.getState().tick);
    const spawnRef = useRef(useGameStore.getState().spawnWord);

    useEffect(() => {
        // 스토어 구독으로 항상 최신 액션 참조
        const unsub = useGameStore.subscribe((state) => {
            tickRef.current = state.tick;
            spawnRef.current = state.spawnWord;
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (status !== 'playing') return;

        let rafId = 0;
        let lastTime = 0;
        const config = LEVEL_CONFIG[level];
        // ★ spawnInterval 이상으로 초기화 → 첫 틱에서 즉시 스폰
        let spawnTimer = config.spawnInterval;

        function loop(timestamp: number) {
            if (lastTime === 0) lastTime = timestamp;
            const deltaTime = Math.min(timestamp - lastTime, 50);
            lastTime = timestamp;

            // 위치 업데이트
            tickRef.current(deltaTime, FLOOR_Y);

            // 단어 스폰
            spawnTimer += deltaTime;
            if (spawnTimer >= config.spawnInterval) {
                spawnTimer = 0;
                spawnRef.current();
            }

            rafId = requestAnimationFrame(loop);
        }

        // 즉시 첫 단어 스폰 (루프 시작 전)
        spawnRef.current();
        rafId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [status, level]); // level 변경 시에도 루프 재시작
}
