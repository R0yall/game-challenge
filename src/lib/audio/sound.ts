// Web Audio API synthesizer for zero-dependency retro SFX

class SoundManager {
	private ctx: AudioContext | null = null;
	private muted: boolean = false;
	private bgOsc: OscillatorNode | null = null;
	private bgGain: GainNode | null = null;
	private isBgPlaying: boolean = false;

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('viberunner_muted');
			this.muted = saved === 'true';
		}
	}

	private initContext() {
		if (!this.ctx && typeof window !== 'undefined') {
			const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (AudioContextClass) {
				this.ctx = new AudioContextClass();
			}
		}
		if (this.ctx && this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
	}

	public get isSoundMuted(): boolean {
		return this.muted;
	}

	public toggleMute(): boolean {
		this.muted = !this.muted;
		if (typeof window !== 'undefined') {
			localStorage.setItem('viberunner_muted', String(this.muted));
		}
		if (this.muted && this.bgGain) {
			this.bgGain.gain.value = 0;
		}
		return this.muted;
	}

	public playJump() {
		if (this.muted) return;
		this.initContext();
		if (!this.ctx) return;

		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(220, now);
		osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);

		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(now);
		osc.stop(now + 0.2);
	}

	public playGem() {
		if (this.muted) return;
		this.initContext();
		if (!this.ctx) return;

		const now = this.ctx.currentTime;
		const osc1 = this.ctx.createOscillator();
		const osc2 = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc1.type = 'triangle';
		osc2.type = 'sine';

		osc1.frequency.setValueAtTime(880, now);
		osc1.frequency.setValueAtTime(1320, now + 0.08);

		osc2.frequency.setValueAtTime(1760, now + 0.08);

		gain.gain.setValueAtTime(0.25, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

		osc1.connect(gain);
		osc2.connect(gain);
		gain.connect(this.ctx.destination);

		osc1.start(now);
		osc2.start(now + 0.08);
		osc1.stop(now + 0.25);
		osc2.stop(now + 0.25);
	}

	public playCrash() {
		if (this.muted) return;
		this.initContext();
		if (!this.ctx) return;

		const now = this.ctx.currentTime;
		// Noise burst + low pitch drop
		const bufferSize = this.ctx.sampleRate * 0.4;
		const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = Math.random() * 2 - 1;
		}

		const noise = this.ctx.createBufferSource();
		noise.buffer = buffer;

		const filter = this.ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(800, now);
		filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(0.4, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(this.ctx.destination);

		noise.start(now);
		noise.stop(now + 0.4);
	}

	public playStart() {
		if (this.muted) return;
		this.initContext();
		if (!this.ctx) return;

		const notes = [330, 440, 554.37, 659.25];
		const now = this.ctx.currentTime;

		notes.forEach((freq, idx) => {
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			const startTime = now + idx * 0.07;

			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, startTime);

			gain.gain.setValueAtTime(0.12, startTime);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(startTime);
			osc.stop(startTime + 0.15);
		});
	}
}

export const sounds = new SoundManager();
