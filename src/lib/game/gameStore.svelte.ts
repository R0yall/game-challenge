import type { GameStatus } from '../types/game';
import { sounds } from '../audio/sound';

export const TRACK_WIDTH = 12;
export const BASE_SPEED = 24;
export const MAX_SPEED = 55;
export const JUMP_VELOCITY = 13;
export const GRAVITY = -34;
export const PLAYER_RADIUS = 0.6;

class GameStore {
	status = $state<GameStatus>('idle');
	score = $state<number>(0);
	highScore = $state<number>(0);
	distance = $state<number>(0);
	speed = $state<number>(BASE_SPEED);
	gems = $state<number>(0);
	isMuted = $state<boolean>(false);

	// Player position & physics
	playerX = $state<number>(0);
	playerY = $state<number>(PLAYER_RADIUS);
	playerZ = $state<number>(0);
	playerVy = $state<number>(0);
	isGrounded = $state<boolean>(true);
	rollAngle = $state<number>(0);

	// Control states
	moveLeft = $state<boolean>(false);
	moveRight = $state<boolean>(false);

	constructor() {
		if (typeof window !== 'undefined') {
			const savedBest = localStorage.getItem('viberunner_highscore');
			if (savedBest) {
				this.highScore = parseInt(savedBest, 10) || 0;
			}
			this.isMuted = sounds.isSoundMuted;
		}
	}

	start() {
		this.reset();
		this.status = 'playing';
		sounds.playStart();
	}

	pause() {
		if (this.status === 'playing') {
			this.status = 'paused';
		}
	}

	resume() {
		if (this.status === 'paused') {
			this.status = 'playing';
		}
	}

	togglePause() {
		if (this.status === 'playing') {
			this.pause();
		} else if (this.status === 'paused') {
			this.resume();
		}
	}

	toggleSound() {
		this.isMuted = sounds.toggleMute();
	}

	triggerJump() {
		if (this.status !== 'playing') return;
		if (this.isGrounded) {
			this.playerVy = JUMP_VELOCITY;
			this.isGrounded = false;
			sounds.playJump();
		}
	}

	collectGem(points: number = 50) {
		this.gems += 1;
		this.score += points;
		sounds.playGem();
	}

	triggerGameOver() {
		if (this.status === 'gameover') return;
		this.status = 'gameover';
		sounds.playCrash();

		if (this.score > this.highScore) {
			this.highScore = Math.floor(this.score);
			if (typeof window !== 'undefined') {
				localStorage.setItem('viberunner_highscore', String(this.highScore));
			}
		}
	}

	reset() {
		this.score = 0;
		this.distance = 0;
		this.speed = BASE_SPEED;
		this.gems = 0;
		this.playerX = 0;
		this.playerY = PLAYER_RADIUS;
		this.playerZ = 0;
		this.playerVy = 0;
		this.isGrounded = true;
		this.rollAngle = 0;
		this.moveLeft = false;
		this.moveRight = false;
	}
}

export const game = new GameStore();
