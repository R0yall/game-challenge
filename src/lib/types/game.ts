export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type ObstacleType = 'barrier' | 'pillar' | 'moving_barrier' | 'spikes';
export type CollectibleType = 'gem' | 'boost';

export interface Obstacle {
	id: number;
	type: ObstacleType;
	x: number;
	y: number;
	z: number;
	width: number;
	height: number;
	depth: number;
	color: string;
	speedX?: number; // for moving obstacles
	minX?: number;
	maxX?: number;
}

export interface Collectible {
	id: number;
	type: CollectibleType;
	x: number;
	y: number;
	z: number;
	size: number;
	color: string;
	rotationSpeed: number;
	collected?: boolean;
}

export interface TrackSegment {
	id: number;
	z: number;
	length: number;
	color: string;
}
