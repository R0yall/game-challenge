import * as THREE from 'three';
import {
	HALF_TRACK,
	PLAYER_RADIUS,
	JUMP_VELOCITY,
	GRAVITY
} from './SlopeMath.ts';
import { sounds } from './Audio.ts';

export class Player {
	public group: THREE.Group;
	public sphereMesh: THREE.Mesh;
	public shadowMesh: THREE.Mesh;
	public auraMesh: THREE.Mesh;

	public z = 0; // forward distance
	public x = 0; // horizontal lane position
	public jumpY = 0; // height above road surface (0 = on road)
	public vy = 0; // jump velocity
	public isGrounded = true;
	public rollAngle = 0;

	// Inputs
	public moveLeft = false;
	public moveRight = false;

	constructor() {
		this.group = new THREE.Group();

		// Rolling Ball Mesh
		const sphereGeo = new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32);
		const sphereMat = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x0066aa,
			emissiveIntensity: 0.8,
			metalness: 0.85,
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
		this.shadowMesh.rotation.x = -Math.PI / 2;
		// Exactly 0.02 above the road surface to prevent z-fighting
		this.shadowMesh.position.y = 0.02;
		this.group.add(this.shadowMesh);

		this.updateTransforms();
	}

	triggerJump(): void {
		if (this.isGrounded) {
			this.vy = JUMP_VELOCITY;
			this.isGrounded = false;
			sounds.playJump();
		}
	}

	update(dt: number, speed: number): void {
		// 1. Forward progression
		const moveZ = speed * dt;
		this.z += moveZ;

		// Ball rolling rotation (circumference = 2 * PI * r)
		this.rollAngle += moveZ / PLAYER_RADIUS;

		// 2. Horizontal Steering
		const steerSpeed = 16.5;
		if (this.moveLeft) this.x -= steerSpeed * dt;
		if (this.moveRight) this.x += steerSpeed * dt;

		// Clamp within track boundaries
		if (this.x < -HALF_TRACK) this.x = -HALF_TRACK;
		else if (this.x > HALF_TRACK) this.x = HALF_TRACK;

		// 3. Jump Physics
		if (!this.isGrounded) {
			this.vy += GRAVITY * dt;
			this.jumpY += this.vy * dt;

			if (this.jumpY <= 0) {
				this.jumpY = 0;
				this.vy = 0;
				this.isGrounded = true;
			}
		}

		this.updateTransforms();
	}

	private updateTransforms(): void {
		// Position group at (x, 0, z) on the road surface
		this.group.position.set(this.x, 0, this.z);

		// Ball center sits exactly at PLAYER_RADIUS + jumpY
		const ballY = PLAYER_RADIUS + this.jumpY;
		this.sphereMesh.position.y = ballY;
		this.auraMesh.position.y = ballY;

		// Ball rolling animation (around X) + slight tilt when steering (around Z)
		this.sphereMesh.rotation.x = this.rollAngle;
		const tiltZ = this.moveRight ? -0.22 : this.moveLeft ? 0.22 : 0;
		this.sphereMesh.rotation.z = tiltZ;
		this.auraMesh.rotation.z = tiltZ;

		// Scale shadow down when jumping high
		const shadowScale = Math.max(0.35, 1 - this.jumpY * 0.22);
		this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
	}

	reset(): void {
		this.z = 0;
		this.x = 0;
		this.jumpY = 0;
		this.vy = 0;
		this.isGrounded = true;
		this.rollAngle = 0;
		this.moveLeft = false;
		this.moveRight = false;
		this.updateTransforms();
	}
}
