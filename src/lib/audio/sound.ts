// Web Audio API synthesizer for zero-dependency retro SFX

class SoundManager {
	private ctx: AudioContext | null = null;
	private muted: boolean = false;

	constructor() {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem('viberunner_muted');
				this.muted = saved === 'true';
			} catch {
				this.muted = false;
			}
		}
	}

	private initContext(): AudioContext | null {
		try {
			if (!this.ctx && typeof window !== 'undefined') {
				const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
				if (AudioContextClass) {
					this.ctx = new AudioContextClass();
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

	public get isSoundMuted(): boolean {
		return this.muted;
	}

	public toggleMute(): boolean {
		this.muted = !this.muted;
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('viberunner_muted', String(this.muted));
			} catch {}
		}
		return this.muted;
	}

	public playJump() {
		if (this.muted) return;
		try {
			const ctx = this.initContext();
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

	public playGem() {
		if (this.muted) return;
		try {
			const ctx = this.initContext();
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

			gain.gain.setValueAtTime(0.2, now);
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

	public playCrash() {
		if (this.muted) return;
		try {
			const ctx = this.initContext();
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

	public playStart() {
		if (this.muted) return;
		try {
			const ctx = this.initContext();
			if (!ctx) return;

			const notes = [330, 440, 554.37, 659.25];
			const now = ctx.currentTime;

			notes.forEach((freq, idx) => {
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
}

export const sounds = new SoundManager();
