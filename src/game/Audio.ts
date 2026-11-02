export class SoundManager {
	private ctx: AudioContext | null = null;
	private muted = false;

	constructor() {
		try {
			const saved = localStorage.getItem('viberunner_muted');
			this.muted = saved === 'true';
		} catch {
			this.muted = false;
		}
	}

	private getContext(): AudioContext | null {
		try {
			if (!this.ctx && typeof window !== 'undefined') {
				const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
				if (AudioCtx) {
					this.ctx = new AudioCtx();
				}
			}
			if (this.ctx && this.ctx.state === 'suspended') {
				this.ctx.resume().catch(() => {});
			}
			return this.ctx;
		} catch {
			return null;
		}
	}

	get isMuted(): boolean {
		return this.muted;
	}

	toggleMute(): boolean {
		this.muted = !this.muted;
		try {
			localStorage.setItem('viberunner_muted', String(this.muted));
		} catch {}
		return this.muted;
	}

	playJump(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(220, now);
			osc.frequency.linearRampToValueAtTime(540, now + 0.16);

			gain.gain.setValueAtTime(0.2, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.18);
		} catch {}
	}

	playGem(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;

			const osc1 = ctx.createOscillator();
			const osc2 = ctx.createOscillator();
			const gain = ctx.createGain();

			osc1.type = 'triangle';
			osc2.type = 'sine';

			osc1.frequency.setValueAtTime(880, now);
			osc1.frequency.setValueAtTime(1320, now + 0.08);
			osc2.frequency.setValueAtTime(1760, now + 0.08);

			gain.gain.setValueAtTime(0.22, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.22);

			osc1.connect(gain);
			osc2.connect(gain);
			gain.connect(ctx.destination);

			osc1.start(now);
			osc2.start(now + 0.08);
			osc1.stop(now + 0.22);
			osc2.stop(now + 0.22);
		} catch {}
	}

	playCrash(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;

			const bufferSize = Math.floor(ctx.sampleRate * 0.35);
			const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				data[i] = Math.random() * 2 - 1;
			}

			const noise = ctx.createBufferSource();
			noise.buffer = buffer;

			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(700, now);
			filter.frequency.linearRampToValueAtTime(60, now + 0.35);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.35, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

			noise.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);

			noise.start(now);
			noise.stop(now + 0.35);
		} catch {}
	}

	// A short original arcade arpeggio, advanced by game time so pausing stops it.
	playPowerNote(step: number): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const notes = [523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 880, 587.33, 698.46, 880, 1174.66, 1046.5, 880, 698.46, 783.99];
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'square';
			osc.frequency.setValueAtTime(notes[step % notes.length], now);
			gain.gain.setValueAtTime(0.045, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
			osc.connect(gain); gain.connect(ctx.destination);
			osc.start(now); osc.stop(now + 0.13);
		} catch {}
	}

	playSmash(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(240, now);
			osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
			gain.gain.setValueAtTime(0.16, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
			osc.connect(gain); gain.connect(ctx.destination);
			osc.start(now); osc.stop(now + 0.24);
		} catch {}
	}

	playStart(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const notes = [330, 440, 554.37, 659.25];
			const now = ctx.currentTime;

			notes.forEach((freq, idx) => {
				if (!ctx) return;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				const startTime = now + idx * 0.06;

				osc.type = 'square';
				osc.frequency.setValueAtTime(freq, startTime);

				gain.gain.setValueAtTime(0.1, startTime);
				gain.gain.linearRampToValueAtTime(0.001, startTime + 0.12);

				osc.connect(gain);
				gain.connect(ctx.destination);

				osc.start(startTime);
				osc.stop(startTime + 0.12);
			});
		} catch {}
	}

	playUfoAlarm(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(580, now);
			osc.frequency.linearRampToValueAtTime(880, now + 0.15);
			osc.frequency.linearRampToValueAtTime(580, now + 0.3);
			osc.frequency.linearRampToValueAtTime(980, now + 0.45);

			gain.gain.setValueAtTime(0.2, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.5);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.5);
		} catch {}
	}

	playUfoDrop(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(950, now);
			osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

			gain.gain.setValueAtTime(0.15, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.35);
		} catch {}
	}

	playBombExplode(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;
			const bufferSize = Math.floor(ctx.sampleRate * 0.4);
			const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				data[i] = Math.random() * 2 - 1;
			}
			const noise = ctx.createBufferSource();
			noise.buffer = buffer;

			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(450, now);
			filter.frequency.linearRampToValueAtTime(40, now + 0.38);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.4, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

			noise.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);
			noise.start(now);
			noise.stop(now + 0.4);
		} catch {}
	}

	playUfoWarp(): void {
		if (this.muted) return;
		try {
			const ctx = this.getContext();
			if (!ctx) return;
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(300, now);
			osc.frequency.exponentialRampToValueAtTime(2400, now + 0.6);

			gain.gain.setValueAtTime(0.2, now);
			gain.gain.linearRampToValueAtTime(0.001, now + 0.6);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.6);
		} catch {}
	}
}

export const sounds = new SoundManager();
