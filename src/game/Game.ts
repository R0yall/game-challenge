import * as THREE from 'three';
import { Player } from './Player.ts';
import { Track } from './Track.ts';
import { ObstacleManager } from './Obstacles.ts';
import { Starfield } from './Starfield.ts';
import { sounds } from './Audio.ts';
import {
	BASE_SPEED,
	MAX_SPEED,
	getSlopePosition
} from './SlopeMath.ts';

export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameUIListener {
	onScoreUpdate: (score: number, distance: number, speed: number, gems: number) => void;
	onStateChange: (state: GameState, score: number, highScore: number, isNewBest: boolean) => void;
	onSoundToggle: (isMuted: boolean) => void;
}

export class Game {
	public state: GameState = 'idle';
	public score = 0;
	public highScore = 0;
	public distance = 0;
	public speed = BASE_SPEED;
	public gems = 0;

	// Three.js Core
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;

	// Game Entities
	public player: Player;
	public track: Track;
	public obstacles: ObstacleManager;
	public starfield: Starfield;

	private uiListener?: GameUIListener;
	private lastTime = 0;
	private targetCamPos = new THREE.Vector3();
	private lookAtPos = new THREE.Vector3();

	constructor(canvas: HTMLCanvasElement) {
		// Load persisted high score
		try {
			const saved = localStorage.getItem('viberunner_highscore');
			if (saved) this.highScore = parseInt(saved, 10) || 0;
		} catch {}

		// 1. Scene & Renderer
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x060212);
		this.scene.fog = new THREE.FogExp2(0x060212, 0.0035);

		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			powerPreference: 'high-performance'
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// 2. Camera
		this.camera = new THREE.PerspectiveCamera(
			65,
			window.innerWidth / window.innerHeight,
			0.1,
			650
		);

		// 3. Lighting
		const sun = new THREE.DirectionalLight(0xffffff, 2.2);
		sun.position.set(20, 40, -10);
		this.scene.add(sun);

		const ambient = new THREE.AmbientLight(0x2b1055, 0.85);
		this.scene.add(ambient);

		const hemi = new THREE.HemisphereLight(0x00f0ff, 0x120028, 1.2);
		this.scene.add(hemi);

		// 4. Entities
		this.track = new Track();
		this.scene.add(this.track.group);

		this.obstacles = new ObstacleManager();
		this.scene.add(this.obstacles.group);

		this.player = new Player();
		this.scene.add(this.player.group);
		this.scene.add(this.player.shadowMesh);

		this.starfield = new Starfield();
		this.scene.add(this.starfield.points);

		// Initial camera position
		getSlopePosition(0, -9.5, 4.6, this.targetCamPos);
		this.camera.position.copy(this.targetCamPos);
		getSlopePosition(0, 18, 0.8, this.lookAtPos);
		this.camera.lookAt(this.lookAtPos);

		// Resize listener
		window.addEventListener('resize', this.onWindowResize.bind(this));

		// Start game loop
		this.lastTime = performance.now();
		requestAnimationFrame(this.loop.bind(this));
	}

	setUIListener(listener: GameUIListener): void {
		this.uiListener = listener;
		this.uiListener.onStateChange(this.state, this.score, this.highScore, false);
		this.uiListener.onSoundToggle(sounds.isMuted);
	}

	start(): void {
		this.reset();
		this.state = 'playing';
		sounds.playStart();
		if (this.uiListener) {
			this.uiListener.onStateChange(this.state, this.score, this.highScore, false);
		}
	}

	pause(): void {
		if (this.state === 'playing') {
			this.state = 'paused';
			if (this.uiListener) {
				this.uiListener.onStateChange(this.state, this.score, this.highScore, false);
			}
		}
	}

	resume(): void {
		if (this.state === 'paused') {
			this.state = 'playing';
			this.lastTime = performance.now();
			if (this.uiListener) {
				this.uiListener.onStateChange(this.state, this.score, this.highScore, false);
			}
		}
	}

	togglePause(): void {
		if (this.state === 'playing') this.pause();
		else if (this.state === 'paused') this.resume();
	}

	toggleSound(): boolean {
		const muted = sounds.toggleMute();
		if (this.uiListener) this.uiListener.onSoundToggle(muted);
		return muted;
	}

	private triggerGameOver(): void {
		if (this.state === 'gameover') return;
		this.state = 'gameover';
		sounds.playCrash();

		const isNewBest = this.score > this.highScore && this.score > 0;
		if (isNewBest) {
			this.highScore = Math.floor(this.score);
			try {
				localStorage.setItem('viberunner_highscore', String(this.highScore));
			} catch {}
		}

		if (this.uiListener) {
			this.uiListener.onStateChange(this.state, this.score, this.highScore, isNewBest);
		}
	}

	reset(): void {
		this.score = 0;
		this.distance = 0;
		this.speed = BASE_SPEED;
		this.gems = 0;

		this.player.reset();
		this.track.reset();
		this.obstacles.reset();
		this.starfield.update(0);

		getSlopePosition(0, -9.5, 4.6, this.targetCamPos);
		this.camera.position.copy(this.targetCamPos);
		getSlopePosition(0, 18, 0.8, this.lookAtPos);
		this.camera.lookAt(this.lookAtPos);

		if (this.uiListener) {
			this.uiListener.onScoreUpdate(this.score, this.distance, this.speed, this.gems);
		}
	}

	private loop(time: number): void {
		requestAnimationFrame(this.loop.bind(this));

		const rawDt = (time - this.lastTime) / 1000;
		this.lastTime = time;
		const dt = Math.min(rawDt, 0.08);

		if (this.state === 'playing') {
			// Accelerate speed gradually
			if (this.speed < MAX_SPEED) {
				this.speed += dt * 0.45;
			}

			// Update Player
			this.player.update(dt, this.speed);
			this.distance = this.player.s;
			this.score += this.speed * dt * 0.8;

			// Update Track, Obstacles & Stars
			this.track.update(this.player.s);
			this.obstacles.update(dt, this.player.s, this.speed);
			this.starfield.update(this.player.s);

			// Check Collisions
			if (this.obstacles.checkCollision(this.player.x, this.player.s, this.player.jumpH)) {
				this.triggerGameOver();
			}

			// Check Gems
			this.obstacles.checkGems(this.player.x, this.player.s, () => {
				this.gems += 1;
				this.score += 50;
				sounds.playGem();
			});

			// Update UI
			if (this.uiListener) {
				this.uiListener.onScoreUpdate(this.score, this.distance, this.speed, this.gems);
			}

			// Smooth Camera Follow
			getSlopePosition(this.player.x * 0.35, this.player.s - 9.5, 4.6, this.targetCamPos);
			this.camera.position.x += (this.targetCamPos.x - this.camera.position.x) * 0.15;
			this.camera.position.y += (this.targetCamPos.y - this.camera.position.y) * 0.22;
			this.camera.position.z += (this.targetCamPos.z - this.camera.position.z) * 0.25;

			getSlopePosition(this.player.x * 0.15, this.player.s + 18, 0.8, this.lookAtPos);
			this.camera.lookAt(this.lookAtPos);

			// Dynamic FOV sensation
			const targetFov = 65 + (this.speed - BASE_SPEED) * 0.45;
			this.camera.fov += (targetFov - this.camera.fov) * 0.05;
			this.camera.updateProjectionMatrix();
		}

		this.renderer.render(this.scene, this.camera);
	}

	private onWindowResize(): void {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	}
}
