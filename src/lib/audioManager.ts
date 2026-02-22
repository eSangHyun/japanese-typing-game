/**
 * Web Audio API를 이용한 간단한 효과음 생성기
 */

class AudioManager {
    private ctx: AudioContext | null = null;
    private volume: number = 0.5;
    private enabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            // Lazy init context on first user interaction to satisfy browser policy
        }
    }

    private initCtx() {
        if (!this.ctx && typeof window !== 'undefined') {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    setSettings(enabled: boolean, volume: number) {
        this.enabled = enabled;
        this.volume = volume;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volMultiplier: number = 1) {
        if (!this.enabled) return;
        const ctx = this.initCtx();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * volMultiplier, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    // 성공음 (청량한 띵!)
    playCorrect() {
        this.playTone(880, 'sine', 0.2, 0.5); // A5
        setTimeout(() => this.playTone(1108.73, 'sine', 0.3, 0.4), 50); // C#6
    }

    // 실패음 (묵직한 뿡)
    playError() {
        this.playTone(220, 'triangle', 0.3, 0.8); // A3
        this.playTone(110, 'triangle', 0.4, 0.6); // A2
    }

    // 미스/바닥 충돌음 (둔탁한 툭)
    playMiss() {
        this.playTone(150, 'sawtooth', 0.2, 0.5);
    }

    // 카운트다운 틱 (짧은 낮은 음)
    playTick() {
        this.playTone(440, 'sine', 0.1, 0.3);
    }

    // 카운트다운 완료 벨 (높은 청량한 음)
    playBell() {
        this.playTone(880, 'sine', 0.4, 0.5);
        setTimeout(() => this.playTone(1760, 'sine', 0.3, 0.3), 50);
    }

    // 게임 오버 (내려가는 음)
    playGameOver() {
        const startFreq = 440;
        const ctx = this.initCtx();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 1);

        gain.gain.setValueAtTime(this.volume, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1);
    }
}

export const audioManager = new AudioManager();
