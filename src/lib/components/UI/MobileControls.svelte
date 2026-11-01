<script lang="ts">
	import { game } from '../../game/gameStore.svelte';

	function startLeft(e: Event) {
		e.preventDefault();
		game.moveLeft = true;
	}

	function endLeft(e: Event) {
		e.preventDefault();
		game.moveLeft = false;
	}

	function startRight(e: Event) {
		e.preventDefault();
		game.moveRight = true;
	}

	function endRight(e: Event) {
		e.preventDefault();
		game.moveRight = false;
	}

	function handleJump(e: Event) {
		e.preventDefault();
		game.triggerJump();
	}
</script>

<div class="touch-controls">
	<div class="steer-buttons">
		<button
			class="touch-btn steer-btn"
			ontouchstart={startLeft}
			ontouchend={endLeft}
			onmousedown={startLeft}
			onmouseup={endLeft}
			aria-label="Steer Left"
		>
			◀
		</button>
		<button
			class="touch-btn steer-btn"
			ontouchstart={startRight}
			ontouchend={endRight}
			onmousedown={startRight}
			onmouseup={endRight}
			aria-label="Steer Right"
		>
			▶
		</button>
	</div>

	<button
		class="touch-btn jump-btn"
		ontouchstart={handleJump}
		onmousedown={handleJump}
		aria-label="Jump"
	>
		▲ JUMP
	</button>
</div>

<style>
	.touch-controls {
		position: absolute;
		bottom: 1.5rem;
		left: 1.5rem;
		right: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		pointer-events: none;
		z-index: 30;
		user-select: none;
		-webkit-user-select: none;
	}

	/* Show on touch devices or smaller screens */
	@media (min-width: 1024px) {
		.touch-controls {
			display: none;
		}
	}

	.steer-buttons {
		display: flex;
		gap: 0.75rem;
		pointer-events: auto;
	}

	.touch-btn {
		background: rgba(20, 15, 40, 0.75);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #ffffff;
		border-radius: 18px;
		font-weight: 800;
		font-size: 1.25rem;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
		touch-action: manipulation;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.1s;
	}

	.touch-btn:active {
		background: rgba(0, 240, 255, 0.4);
		border-color: #00f0ff;
	}

	.steer-btn {
		width: 60px;
		height: 60px;
	}

	.jump-btn {
		pointer-events: auto;
		width: 100px;
		height: 60px;
		background: linear-gradient(135deg, rgba(255, 0, 119, 0.7), rgba(255, 85, 0, 0.7));
		border-color: rgba(255, 120, 180, 0.5);
		font-size: 0.95rem;
		letter-spacing: 0.05em;
	}

	.jump-btn:active {
		background: linear-gradient(135deg, rgba(255, 0, 119, 0.95), rgba(255, 85, 0, 0.95));
	}
</style>
