import * as THREE from 'three';

export const SLOPE_ANGLE = 0.22; // ~12.6 degrees downward slope
export const TRACK_WIDTH = 12;
export const HALF_TRACK = 5.2; // playable half-width
export const PLAYER_RADIUS = 0.6;
export const BASE_SPEED = 26;
export const MAX_SPEED = 60;
export const JUMP_VELOCITY = 13.5;
export const GRAVITY = -36;

const cosTheta = Math.cos(SLOPE_ANGLE);
const sinTheta = Math.sin(SLOPE_ANGLE);

/**
 * Calculates the exact 3D world coordinates for any point on or above the slope.
 * @param x Horizontal lane position (-HALF_TRACK to +HALF_TRACK)
 * @param s Distance traveled down the slope (0 to infinity)
 * @param h Height perpendicular above the slope surface (0 = road surface)
 */
export function getSlopePosition(x: number, s: number, h: number, out = new THREE.Vector3()): THREE.Vector3 {
	const y = -sinTheta * s + cosTheta * h;
	const z = cosTheta * s + sinTheta * h;
	out.set(x, y, z);
	return out;
}
