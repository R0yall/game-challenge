import * as THREE from 'three';
import {
	SLOPE_ANGLE,
	HALF_TRACK,
	PLAYER_RADIUS,
	getSlopePosition
} from './SlopeMath.ts';

export type ObstacleType = 'barrier' | 'pillar' | 'moving';

interface ObstacleEntity {
	type: ObstacleType;
	x: number;
	s: number;
	w: number;
	h: number;
	d: number;
	speedX?: number;
	group: THREE.Group;
}

interface GemEntity {
	x: number;
	s: number;
	collected: boolean;
	mesh: THREE.Mesh;
}

export class ObstacleManager {
	public group: THREE.Group;
	private obstacles: ObstacleEntity[] = [];
	private gems: GemEntity[] = [];
	private tempPos = new THREE.Vector3();

	constructor() {
		this.group = new THREE.Group();
		this.initObstacles();
		this.initGems();
	}

	private initObstacles(): void {
		const barrierGeo = new THREE.BoxGeometry(3.4, 0.85, 0.6);
		const pillarGeo = new THREE.BoxGeometry(2.2, 4.4, 1.2);
		const movingGeo = new THREE.BoxGeometry(2.8, 2.2, 0.8);

		const barrierMat = new THREE.MeshStandardMaterial({
			color: 0xff0055,
			emissive: 0xff0055,
			emissiveIntensity: 0.9,
			roughness: 0.25,
			metalness: 0.7
		});

		const pillarMat = new THREE.MeshStandardMaterial({
			color: 0x9900ff,
			emissive: 0x9900ff,
			emissiveIntensity: 0.9,
			roughness: 0.25,
			metalness: 0.7
		});

		const movingMat = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			emissive: 0xffaa00,
			emissiveIntensity: 1.0,
			roughness: 0.2,
			metalness: 0.8
		});

		// 12 Obstacles in pool
		const types: ObstacleType[] = [
			'barrier', 'pillar', 'moving',
			'barrier', 'pillar', 'barrier',
			'moving', 'pillar', 'barrier',
			'pillar', 'barrier', 'moving'
		];

		const laneOffsets = [-3.2, 0, 3.2];

		types.forEach((type, idx) => {
			const grp = new THREE.Group();
			grp.rotation.x = -SLOPE_ANGLE;

			let w = 3.4;
			let h = 0.85;
			let d = 0.6;
			let speedX: number | undefined;

			if (type === 'barrier') {
				const mesh = new THREE.Mesh(barrierGeo, barrierMat);
				mesh.position.y = h / 2;
				grp.add(mesh);
			} else if (type === 'pillar') {
				w = 2.2;
				h = 4.4;
				d = 1.2;
				const mesh = new THREE.Mesh(pillarGeo, pillarMat);
				mesh.position.y = h / 2;
				grp.add(mesh);
			} else {
				w = 2.8;
				h = 2.2;
				d = 0.8;
				speedX = (idx % 2 === 0 ? 1 : -1) * 5.5;
				const mesh = new THREE.Mesh(movingGeo, movingMat);
				mesh.position.y = h / 2;
				grp.add(mesh);
			}

			const laneX = laneOffsets[idx % laneOffsets.length];
			const startS = 55 + idx * 28;

			getSlopePosition(laneX, startS, 0, this.tempPos);
			grp.position.copy(this.tempPos);

			this.group.add(grp);
			this.obstacles.push({
				type,
				x: laneX,
				s: startS,
				w,
				h,
				d,
				speedX,
				group: grp
			});
		});
	}

	private initGems(): void {
		const gemGeo = new THREE.OctahedronGeometry(0.5, 0);
		const gemMat = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 2.5,
			roughness: 0.1,
			metalness: 0.95
		});

		const laneOffsets = [-3.2, 3.2, 0];

		for (let i = 0; i < 8; i++) {
			const mesh = new THREE.Mesh(gemGeo, gemMat);
			const gemX = laneOffsets[i % laneOffsets.length];
			const gemS = 65 + i * 36;

			getSlopePosition(gemX, gemS, 1.2, this.tempPos);
			mesh.position.copy(this.tempPos);

			this.group.add(mesh);
			this.gems.push({
				x: gemX,
				s: gemS,
				collected: false,
				mesh
			});
		}
	}

	update(dt: number, playerS: number, currentSpeed: number): void {
		// 1. Move sliding obstacles
		for (const obs of this.obstacles) {
			if (obs.type === 'moving' && obs.speedX !== undefined) {
				obs.x += obs.speedX * dt;
				const minX = -HALF_TRACK + 1.2;
				const maxX = HALF_TRACK - 1.2;

				if (obs.x < minX) {
					obs.x = minX;
					obs.speedX = Math.abs(obs.speedX);
				} else if (obs.x > maxX) {
					obs.x = maxX;
					obs.speedX = -Math.abs(obs.speedX);
				}

				getSlopePosition(obs.x, obs.s, 0, this.tempPos);
				obs.group.position.copy(this.tempPos);
			}

			// Recycle obstacle when behind player
			if (obs.s < playerS - 15) {
				const maxS = Math.max(...this.obstacles.map((o) => o.s));
				const spacing = Math.max(18, 30 - (currentSpeed - 26) * 0.25);
				obs.s = maxS + spacing;

				const laneRoll = Math.random();
				if (laneRoll < 0.33) obs.x = -3.2;
				else if (laneRoll < 0.66) obs.x = 0;
				else obs.x = 3.2;

				if (obs.type === 'moving') {
					obs.x = (Math.random() - 0.5) * 4;
					obs.speedX = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 3);
				}

				getSlopePosition(obs.x, obs.s, 0, this.tempPos);
				obs.group.position.copy(this.tempPos);
			}
		}

		// 2. Rotate & recycle gems
		for (const gem of this.gems) {
			if (!gem.collected) {
				gem.mesh.rotation.y += dt * 3.2;
			}

			// Recycle gem when behind player
			if (gem.s < playerS - 15) {
				const maxGemS = Math.max(...this.gems.map((g) => g.s));
				gem.s = maxGemS + 35;
				gem.collected = false;
				gem.mesh.visible = true;

				const laneRoll = Math.random();
				if (laneRoll < 0.33) gem.x = -3.2;
				else if (laneRoll < 0.66) gem.x = 0;
				else gem.x = 3.2;

				getSlopePosition(gem.x, gem.s, 1.2, this.tempPos);
				gem.mesh.position.copy(this.tempPos);
			}
		}
	}

	checkCollision(playerX: number, playerS: number, playerJumpH: number): boolean {
		for (const obs of this.obstacles) {
			const ds = Math.abs(playerS - obs.s);
			const allowedDs = obs.d / 2 + PLAYER_RADIUS * 0.75;

			if (ds < allowedDs) {
				const dx = Math.abs(playerX - obs.x);
				const allowedDx = obs.w / 2 + PLAYER_RADIUS * 0.7;

				if (dx < allowedDx) {
					// Check jump clearance
					const clearance = obs.h - PLAYER_RADIUS * 0.4;
					if (playerJumpH < clearance) {
						return true; // CRASH!
					}
				}
			}
		}
		return false;
	}

	checkGems(playerX: number, playerS: number, onCollect: () => void): void {
		for (const gem of this.gems) {
			if (gem.collected) continue;
			const ds = Math.abs(playerS - gem.s);
			const dx = Math.abs(playerX - gem.x);
			if (ds < PLAYER_RADIUS + 0.8 && dx < PLAYER_RADIUS + 0.8) {
				gem.collected = true;
				gem.mesh.visible = false;
				onCollect();
			}
		}
	}

	reset(): void {
		const laneOffsets = [-3.2, 0, 3.2];
		this.obstacles.forEach((obs, idx) => {
			obs.s = 55 + idx * 28;
			obs.x = laneOffsets[idx % laneOffsets.length];
			if (obs.type === 'moving') {
				obs.speedX = (idx % 2 === 0 ? 1 : -1) * 5.5;
			}
			getSlopePosition(obs.x, obs.s, 0, this.tempPos);
			obs.group.position.copy(this.tempPos);
		});

		this.gems.forEach((gem, idx) => {
			gem.s = 65 + idx * 36;
			gem.x = laneOffsets[idx % laneOffsets.length];
			gem.collected = false;
			gem.mesh.visible = true;
			getSlopePosition(gem.x, gem.s, 1.2, this.tempPos);
			gem.mesh.position.copy(this.tempPos);
		});
	}
}
