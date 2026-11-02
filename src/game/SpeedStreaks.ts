import * as THREE from 'three';

/** Fast-moving particles stretched into streaks around the player. */
export class SpeedStreaks {
	public readonly group = new THREE.Group();
	private readonly positions: Float32Array;
	private readonly attribute: THREE.BufferAttribute;
	private readonly particles: { x: number; y: number; z: number; length: number; speed: number }[] = [];

	constructor(count = 100) {
		this.positions = new Float32Array(count * 6);
		const colors = new Float32Array(count * 6);
		const palette = [0xffffff, 0x77edff, 0xff87d8, 0xffef85].map(color => new THREE.Color(color));
		for (let i = 0; i < count; i++) {
			const side = i % 2 === 0 ? -1 : 1;
			this.particles.push({ x: side * (3.2 + Math.random() * 9), y: 0.5 + Math.random() * 9, z: Math.random() * 55 - 12, length: 1.2 + Math.random() * 3, speed: 0.7 + Math.random() * 0.6 });
			const color = palette[i % palette.length];
			for (let vertex = 0; vertex < 2; vertex++) color.toArray(colors, i * 6 + vertex * 3);
		}
		const geometry = new THREE.BufferGeometry();
		this.attribute = new THREE.BufferAttribute(this.positions, 3);
		this.attribute.setUsage(THREE.DynamicDrawUsage);
		geometry.setAttribute('position', this.attribute);
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
		const streaks = new THREE.LineSegments(geometry, material);
		streaks.frustumCulled = false;
		this.group.add(streaks);
		this.group.visible = false;
	}

	update(active: boolean, dt: number, x: number, z: number, speed: number): void {
		this.group.visible = active;
		if (!active) return;
		this.group.position.set(x, 0, z);
		this.particles.forEach((particle, i) => {
			particle.z -= speed * particle.speed * dt;
			if (particle.z < -16) particle.z += 60;
			const offset = i * 6;
			this.positions.set([particle.x, particle.y, particle.z, particle.x, particle.y, particle.z + particle.length], offset);
		});
		this.attribute.needsUpdate = true;
	}
}
