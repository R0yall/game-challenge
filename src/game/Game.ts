/// <reference types="vite/client" />
import * as THREE from 'three';
import sharedBest from '../data/highscore.json';
import { Player } from './Player.ts';
import { Track } from './Track.ts';
import { ObstacleManager } from './Obstacles.ts';
import { Starfield } from './Starfield.ts';
import { SpeedStreaks } from './SpeedStreaks.ts';
import { UfoEncounter } from './UfoEncounter.ts';
import { sounds } from './Audio.ts';
import {
	BASE_SPEED,
	MAX_SPEED,
	SLOPE_ANGLE
} from './SlopeMath.ts';

const powerGemInterval = () => 20 + Math.floor(Math.random() * 11);

export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameUIListener {
	onScoreUpdate: (score: number, distance: number, speed: number, gems: number) => void;
	onStateChange: (state: GameState, score: number, highScore: number, isNewBest: boolean) => void;
	onSoundToggle: (isMuted: boolean) => void;
	onPowerUpdate: (remaining: number) => void;
	onUfoAlert?: (active: boolean) => void;
}

export class Game {
	public state: GameState = 'idle';
	public score = 0;
	public highScore = 0;
	public highScoreName = '';
	public playerName = '';
	public scoreSaveFailed = false;
	public onRunFinished?: (name: string, score: number) => void;
	public distance = 0;
	public speed = BASE_SPEED;
	public gems = 0;
	private powerRemaining = 0;
	private nextPowerGem = powerGemInterval();
	private powerMusicTime = 0;
	private powerMusicStep = 0;

	// Three.js Core
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	public slopeGroup: THREE.Group;

	// Game Entities
	public player: Player;
	public track: Track;
	public obstacles: ObstacleManager;
	public starfield: Starfield;
	private speedStreaks: SpeedStreaks;
	public ufo: UfoEncounter;

	private uiListener?: GameUIListener;
	private lastTime = 0;

	private playerWorldPos = new THREE.Vector3();
	private targetCamPos = new THREE.Vector3();
	private lookAtPos = new THREE.Vector3();

	constructor(canvas: HTMLCanvasElement) {
		const best = sharedBest.scores[0] as { name: string; score: number } | undefined;
		if (best) { this.highScore = best.score; this.highScoreName = best.name; }
		try {
			const saved = localStorage.getItem('viberunner_highscore');
			const localScore = Number.parseInt(saved || '0', 10) || 0;
			if (localScore > this.highScore) {
				this.highScore = localScore;
				this.highScoreName = localStorage.getItem('viberunner_highscore_name') || 'Unknown';
			}
			const savedName = localStorage.getItem('viberunner_player_name');
			if (savedName) this.playerName = savedName;
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

		// 2. Downhill Slope Group
		// The entire track slopes downward into infinity
		this.slopeGroup = new THREE.Group();
		this.slopeGroup.rotation.x = SLOPE_ANGLE;
		this.scene.add(this.slopeGroup);

		// 3. World Camera - looks down at the downhill slope from behind
		this.camera = new THREE.PerspectiveCamera(
			65,
			window.innerWidth / window.innerHeight,
			0.1,
			650
		);
		this.scene.add(this.camera);

		// 4. Lighting
		const sun = new THREE.DirectionalLight(0xffffff, 2.2);
		sun.position.set(20, 50, -10);
		this.scene.add(sun);

		const ambient = new THREE.AmbientLight(0x2b1055, 0.85);
		this.scene.add(ambient);

		const hemi = new THREE.HemisphereLight(0x00f0ff, 0x120028, 1.2);
		this.scene.add(hemi);

		// 5. Entities in slopeGroup
		this.track = new Track();
		this.slopeGroup.add(this.track.group);

		this.obstacles = new ObstacleManager();
		this.slopeGroup.add(this.obstacles.group);

		this.player = new Player();
		this.slopeGroup.add(this.player.group);

		this.speedStreaks = new SpeedStreaks();
		this.slopeGroup.add(this.speedStreaks.group);

		// 3D UFO Encounter
		this.ufo = new UfoEncounter((alert) => {
			this.uiListener?.onUfoAlert?.(alert);
		});
		this.slopeGroup.add(this.ufo.group);

		// Starfield in world space
		this.starfield = new Starfield();
		this.scene.add(this.starfield.points);

		// Initial camera setup
		this.updateCamera(1.0);

		window.addEventListener('resize', this.onWindowResize.bind(this));

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

		const isNewBest = Math.floor(this.score) > this.highScore;
		if (isNewBest) {
			this.highScore = Math.floor(this.score);
			this.highScoreName = this.playerName;
			try {
				localStorage.setItem('viberunner_highscore', String(this.highScore));
				localStorage.setItem('viberunner_highscore_name', this.highScoreName);
			} catch {}
		}

		if (Math.floor(this.score) > 0) this.onRunFinished?.(this.playerName, Math.floor(this.score));
		if (this.uiListener) {
			this.uiListener.onStateChange(this.state, this.score, this.highScore, isNewBest);
		}
	}

	reset(): void {
		this.score = 0;
		this.distance = 0;
		this.speed = BASE_SPEED;
		this.gems = 0;
		this.powerRemaining = 0;
		this.nextPowerGem = powerGemInterval();
		this.powerMusicTime = 0;
		this.powerMusicStep = 0;
		this.uiListener?.onPowerUpdate(0);
		this.speedStreaks.group.visible = false;
		this.camera.fov = 65;
		this.camera.updateProjectionMatrix();

		this.player.reset();
		this.track.reset();
		this.obstacles.reset();
		this.ufo.reset();
		this.updateCamera(1.0);
		this.starfield.update(this.camera.position);

		if (this.uiListener) {
			this.uiListener.onScoreUpdate(this.score, this.distance, this.speed, this.gems);
		}
	}

	private updateCamera(lerpFactor = 0.2): void {
		// Get player's world position (including slope tilt)
		this.player.group.getWorldPosition(this.playerWorldPos);

		// Calculate world direction of slope
		const cosA = Math.cos(SLOPE_ANGLE);
		const sinA = Math.sin(SLOPE_ANGLE);

		// Place camera behind and slightly above the player along world coordinates
		const camDistBack = 8.5;
		const camHeightAbove = 3.6;

		this.targetCamPos.set(
			this.playerWorldPos.x * 0.45,
			this.playerWorldPos.y + sinA * camDistBack + cosA * camHeightAbove,
			this.playerWorldPos.z - cosA * camDistBack + sinA * camHeightAbove
		);

		if (lerpFactor >= 1.0) {
			this.camera.position.copy(this.targetCamPos);
		} else {
			this.camera.position.x += (this.targetCamPos.x - this.camera.position.x) * lerpFactor;
			this.camera.position.y += (this.targetCamPos.y - this.camera.position.y) * lerpFactor;
			this.camera.position.z += (this.targetCamPos.z - this.camera.position.z) * lerpFactor;
		}

		// Look ahead down the slope
		const lookAheadDist = 18;
		this.lookAtPos.set(
			this.playerWorldPos.x * 0.15,
			this.playerWorldPos.y - sinA * lookAheadDist + 0.5,
			this.playerWorldPos.z + cosA * lookAheadDist
		);
		this.camera.lookAt(this.lookAtPos);
	}

	private loop(time: number): void {
		requestAnimationFrame(this.loop.bind(this));

		const rawDt = (time - this.lastTime) / 1000;
		this.lastTime = time;
		const dt = Math.min(rawDt, 0.08);

		if (this.state === 'playing') {
			if (this.speed < MAX_SPEED) {
				this.speed += dt * 0.45;
			}

			if (this.powerRemaining > 0) {
				this.powerRemaining = Math.max(0, this.powerRemaining - dt);
				if (this.powerRemaining === 0) this.nextPowerGem = this.gems + powerGemInterval();
				this.powerMusicTime -= dt;
				if (this.powerRemaining > 0 && this.powerMusicTime <= 0) {
					sounds.playPowerNote(this.powerMusicStep++);
					this.powerMusicTime += 0.15;
				}
			}
			this.player.setPowerFlash(this.powerRemaining > 0, time / 1000);
			this.uiListener?.onPowerUpdate(this.powerRemaining);
			const runSpeed = this.speed * (this.powerRemaining > 0 ? 1.4 : 1);
			// Update Player
			this.player.update(dt, runSpeed);
			this.speedStreaks.update(this.powerRemaining > 0, dt, this.player.x, this.player.z, runSpeed);
			this.distance = this.player.z;
			this.score += runSpeed * dt * 0.8;

			// Update Track & Obstacles
			this.track.update(this.player.z);
			this.obstacles.update(dt, this.player.z, runSpeed);

			// Update UFO Encounter
			this.ufo.update(dt, this.player.z, this.player.x, runSpeed);

			// Collect first so a gem can activate protection on the same frame as a hit.
			this.obstacles.checkGems(this.player.x, this.player.z, () => {
				this.gems += 1;
				this.score += 50;
				sounds.playGem();
				if (this.powerRemaining === 0 && this.gems >= this.nextPowerGem) {
					this.powerRemaining = 10;
					this.powerMusicTime = 0;
					this.powerMusicStep = 0;
					this.uiListener?.onPowerUpdate(this.powerRemaining);
				}
			});

			// Check track obstacle collisions
			if (this.obstacles.checkCollision(this.player.x, this.player.z, this.player.jumpY, this.powerRemaining > 0, () => sounds.playSmash())) {
				this.triggerGameOver();
			}

			// Check UFO bomb collisions
			this.ufo.checkCollision(this.player.x, this.player.z, this.player.jumpY, (bomb) => {
				if (this.powerRemaining > 0) {
					this.ufo.destroyBomb(bomb);
					sounds.playSmash();
					this.score += 150;
				} else {
					this.triggerGameOver();
				}
			});

			// Notify UI
			if (this.uiListener) {
				this.uiListener.onScoreUpdate(this.score, this.distance, this.speed, this.gems);
			}

			// Update Camera smoothly
			this.updateCamera(0.2);

			// Keep starfield centered around the camera in 360 degrees
			this.starfield.update(this.camera.position);

			// Dynamic FOV sensation
			const targetFov = this.powerRemaining > 0 ? 110 : 65 + (this.speed - BASE_SPEED) * 0.45;
			this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-4 * dt));
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
