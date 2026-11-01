import * as THREE from 'three';
import {
	SLOPE_ANGLE,
	HALF_TRACK,
	PLAYER_RADIUS,
	JUMP_VELOCITY,
	GRAVITY,
	getSlopePosition
} from './SlopeMath.ts';
import { sounds } from './Audio.ts';

export class Player {
	public group: THREE.Group;
	public sphereMesh: THREE.Mesh;
	public shadowMesh: THREE.Mesh;
	public auraMesh: THREE.Mesh;

	public s = 0; // distance down the slope
	public x = 0; // horizontal position
	public jumpH = 0; // height above track
	public vy = 0; // jump velocity along surface normal
	public isGrounded = true;
	public rollAngle = 0;

	// Inputs
	public moveLeft = false;
	public moveRight = false;

	private tempPos = new THREE.Vector3();

	constructor() {
		this.group = new THREE.Group();

		// Rolling Ball Mesh
		const sphereGeo = new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32);
		const sphereMat = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x0066aa,
			emissiveIntensity: 0.8,
			metalness: 0.8,
			roughness: 0.15
		});
		this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
		this.group.add(this.sphereMesh);

		// Glowing Aura Ring around ball
		const auraGeo = new THREE.TorusGeometry(PLAYER_RADIUS * 1.15, 0.04, 16, 32);
		const auraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
		this.auraMesh.rotation.x = Math.PI / 2;
		this.group.add(this.auraMesh);

		// Dynamic Contact Shadow on track surface
		const shadowGeo = new THREE.CircleGeometry(PLAYER_RADIUS * 1.1, 24);
		const shadowMat = new THREE.MeshBasicMaterial({
			color: 0x000000,
			transparent: true,
			opacity: 0.55
		});
		this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
		this.shadowMesh.rotation.x = -Math.PI / 2 - SLOPE_ANGLE;
		// Position shadow slightly above road surface to prevent z-fighting
		this.shadowMesh.position.y = 0.02;

		this.updateMeshTransforms();
	}

	triggerJump(): void {
		if (this.isGrounded) {
			this.vy = JUMP_VELOCITY;
			this.isGrounded = false;
			sounds.playJump();
		}
	}

	update(dt: number, speed: number): void {
		// 1. Forward progression down slope
		const moveS = speed * dt;
		this.s += moveS;

		// Ball rolling rotation (circumference = 2 * PI * r)
		this.rollAngle += moveS / PLAYER_RADIUS;

		// 2. Horizontal Steering
		const steerSpeed = 16.5;
		if (this.moveLeft) this.x -= steerSpeed * dt;
		if (this.moveRight) this.x += steerSpeed * dt;

		// Clamp within track boundaries
		if (this.x < -HALF_TRACK) this.x = -HALF_TRACK;
		else if (this.x > HALF_TRACK) this.x = HALF_TRACK;

		// 3. Jump Physics along surface normal
		if (!this.isGrounded) {
			this.vy += GRAVITY * dt;
			this.jumpH += this.vy * dt;

			if (this.jumpH <= 0) {
				this.jumpH = 0;
				this.vy = 0;
				this.isGrounded = true;
			}
		}

		this.updateMeshTransforms();
	}

	private updateMeshTransforms(): void {
		// Player center is at height: PLAYER_RADIUS + jumpH above track
		getSlopePosition(this.x, this.s, PLAYER_RADIUS + this.jumpH, this.tempPos);
		this.group.position.copy(this.tempPos);

		// Roll ball downhill (pitch around X) + tilt horizontally when steering
		this.sphereMesh.rotation.x = this.rollAngle;
		const tiltZ = this.moveRight ? -0.22 : this.moveLeft ? 0.22 : 0;
		this.sphereMesh.rotation.z = tiltZ;

		// Update shadow position on track surface directly below player
		getSlopePosition(this.x, this.s, 0.03, this.tempPos);
		this.shadowMesh.position.copy(this.tempPos);

		// Scale shadow down when jumping high
		const shadowScale = Math.max(0.35, 1 - this.jumpH * 0.22);
		this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
	}

	reset(): void {
		this.s = 0;
		this.x = 0;
		this.jumpH = 0;
		this.vy = 0;
		this.isGrounded = true;
		this.rollAngle = 0;
		this.moveLeft = false;
		this.moveRight = false;
		this.updateMeshTransforms();
	}
}
