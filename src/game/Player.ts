import * as THREE from 'three';
import { HALF_TRACK, PLAYER_RADIUS, JUMP_VELOCITY, GRAVITY } from './SlopeMath.ts';
import { sounds } from './Audio.ts';

const TRAIL_COLORS = [0xff334f, 0xff9933, 0xffed55, 0x51e66c, 0x35bfff, 0xa56aff];
const TRAIL_LENGTH = 36;
const TRAIL_SPACING = 0.55;

export class Player {
	public group = new THREE.Group();
	private cat = new THREE.Group();
	private shadowMesh: THREE.Mesh;
	private trail: THREE.InstancedMesh;
	private trailPoints: THREE.Vector3[] = [];
	private trailDistance = 0;
	private trailMatrix = new THREE.Matrix4();
	private trailPosition = new THREE.Vector3();
	private trailScale = new THREE.Vector3();
	private trailRotation = new THREE.Quaternion();

	public z = 0;
	public x = 0;
	public jumpY = 0;
	public vy = 0;
	public isGrounded = true;
	public rollAngle = 0;
	public moveLeft = false;
	public moveRight = false;

	constructor() {
		// Pixel-like box shapes keep the cat readable from the chase camera.
		const materials = new Map<number, THREE.MeshStandardMaterial>();
		const box = (color: number, w: number, h: number, d: number, x: number, y: number, z: number) => {
			let material = materials.get(color);
			if (!material) {
				material = new THREE.MeshStandardMaterial({ color, roughness: 0.85, emissive: color, emissiveIntensity: 0.12 });
				materials.set(color, material);
			}
			const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
			mesh.position.set(x, y, z);
			this.cat.add(mesh);
		};
		// Toast body and pink frosting, with the face toward the camera.
		box(0x613d35, 1.72, 1.02, 1.35, 0, 0, 0.12);
		box(0xf2c68b, 1.58, 0.90, 1.4, 0, 0.02, 0.1);
		box(0xff92c9, 1.35, 0.70, 0.08, 0, 0.06, -0.63);
		box(0xff72b9, 1.35, 0.07, 1.13, 0, 0.49, 0.08);
		for (const [x, y] of [[-0.51, 0.30], [0.43, 0.31], [-0.54, -0.23], [0.53, -0.22]]) {
			box(0xeb4e9c, 0.12, 0.08, 0.09, x, y, -0.68);
		}
		// Tall, stepped ears rise above the toast silhouette from the chase camera.
		for (const x of [-0.53, 0.53]) {
			box(0x515462, 0.38, 0.38, 0.34, x, 0.65, 0.35);
			box(0x515462, 0.22, 0.18, 0.30, x, 0.92, 0.35);
			box(0xf68faf, 0.19, 0.24, 0.035, x, 0.69, 0.16);
			box(0xf68faf, 0.17, 0.035, 0.18, x, 0.84, 0.35);
		}
		// Head, ears, eyes and cheeks form a familiar pixel cat face.
		box(0x515462, 0.93, 0.63, 0.28, 0, 0.05, -0.79);
		box(0x9da3ad, 0.84, 0.54, 0.30, 0, 0.06, -0.84);
		box(0x515462, 0.23, 0.35, 0.24, -0.35, 0.43, -0.81);
		box(0x515462, 0.23, 0.35, 0.24, 0.35, 0.43, -0.81);
		box(0xf68faf, 0.11, 0.17, 0.05, -0.35, 0.44, -0.96);
		box(0xf68faf, 0.11, 0.17, 0.05, 0.35, 0.44, -0.96);
		box(0x161621, 0.10, 0.12, 0.04, -0.22, 0.11, -1.01);
		box(0x161621, 0.10, 0.12, 0.04, 0.22, 0.11, -1.01);
		box(0xf57eae, 0.14, 0.08, 0.04, -0.34, -0.05, -1.01);
		box(0xf57eae, 0.14, 0.08, 0.04, 0.34, -0.05, -1.01);
		box(0x161621, 0.10, 0.08, 0.04, 0, -0.06, -1.01);
		for (const x of [-0.55, 0.55]) for (const z of [-0.35, 0.55]) box(0x777e8c, 0.24, 0.30, 0.26, x, -0.55, z);
		this.group.add(this.cat);

		this.shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(PLAYER_RADIUS * 1.1, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 }));
		this.shadowMesh.rotation.x = -Math.PI / 2;
		this.shadowMesh.position.y = 0.02;
		this.group.add(this.shadowMesh);

		this.trail = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85 }), TRAIL_LENGTH * TRAIL_COLORS.length);
		this.trail.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.trail.frustumCulled = false;
		for (let i = 0; i < TRAIL_LENGTH; i++) {
			for (let color = 0; color < TRAIL_COLORS.length; color++) this.trail.setColorAt(i * TRAIL_COLORS.length + color, new THREE.Color(TRAIL_COLORS[color]));
		}
		this.group.add(this.trail);
		this.updateTransforms();
		this.updateTrail();
	}

	setPowerFlash(active: boolean, time: number): void {
		this.cat.visible = !active || Math.floor(time * 10) % 2 === 0;
	}

	triggerJump(): void {
		if (this.isGrounded) {
			this.vy = JUMP_VELOCITY;
			this.isGrounded = false;
			sounds.playJump();
		}
	}

	update(dt: number, speed: number): void {
		const oldX = this.x;
		const oldZ = this.z;
		const oldY = this.jumpY;
		const moveZ = speed * dt;
		this.z += moveZ;
		this.rollAngle += moveZ / PLAYER_RADIUS;
		const steerSpeed = 16.5;
		if (this.moveLeft) this.x += steerSpeed * dt;
		if (this.moveRight) this.x -= steerSpeed * dt;
		this.x = THREE.MathUtils.clamp(this.x, -HALF_TRACK, HALF_TRACK);
		if (!this.isGrounded) {
			this.vy += GRAVITY * dt;
			this.jumpY += this.vy * dt;
			if (this.jumpY <= 0) { this.jumpY = 0; this.vy = 0; this.isGrounded = true; }
		}
		// Interpolate samples so the trail stays continuous even at low frame rates.
		let next = TRAIL_SPACING - this.trailDistance;
		while (next <= moveZ) {
			const t = next / moveZ;
			this.trailPoints.unshift(new THREE.Vector3(THREE.MathUtils.lerp(oldX, this.x, t), PLAYER_RADIUS + THREE.MathUtils.lerp(oldY, this.jumpY, t), THREE.MathUtils.lerp(oldZ, this.z, t)));
			if (this.trailPoints.length > TRAIL_LENGTH) this.trailPoints.pop();
			next += TRAIL_SPACING;
		}
		this.trailDistance = (this.trailDistance + moveZ) % TRAIL_SPACING;
		this.updateTransforms();
		this.updateTrail();
	}

	private updateTransforms(): void {
		this.group.position.set(this.x, 0, this.z);
		this.cat.position.y = PLAYER_RADIUS + this.jumpY + Math.sin(this.rollAngle * 0.8) * 0.04;
		this.cat.rotation.z = this.moveLeft ? -0.16 : this.moveRight ? 0.16 : 0;
		const shadowScale = Math.max(0.35, 1 - this.jumpY * 0.22);
		this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
	}

	private updateTrail(): void {
		for (let i = 0; i < TRAIL_LENGTH; i++) {
			const point = this.trailPoints[i];
			for (let color = 0; color < TRAIL_COLORS.length; color++) {
				if (point) {
					this.trailPosition.set(point.x - this.x, point.y + (2.5 - color) * 0.15, point.z - this.z - 0.85);
					const fade = 1 - i / TRAIL_LENGTH;
					this.trailScale.set(1.2 * fade, 0.15 * fade, TRAIL_SPACING * 1.15);
				} else {
					this.trailPosition.set(0, 0, 0);
					this.trailScale.set(0, 0, 0);
				}
				this.trailMatrix.compose(this.trailPosition, this.trailRotation, this.trailScale);
				this.trail.setMatrixAt(i * TRAIL_COLORS.length + color, this.trailMatrix);
			}
		}
		this.trail.instanceMatrix.needsUpdate = true;
	}

	reset(): void {
		this.z = 0; this.x = 0; this.jumpY = 0; this.vy = 0;
		this.isGrounded = true; this.rollAngle = 0;
		this.moveLeft = false; this.moveRight = false;
		this.cat.visible = true;
		this.trailPoints = [];
		this.trailDistance = 0;
		this.updateTransforms();
		this.updateTrail();
	}
}
