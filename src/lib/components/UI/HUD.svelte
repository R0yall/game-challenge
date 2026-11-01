<script lang="ts">
	import { game } from '../../game/gameStore.svelte';

	function handlePause() {
		game.togglePause();
	}

	function handleSound() {
		game.toggleSound();
	}
</script>

<div class="hud-container">
	<!-- Top Bar -->
	<header class="top-bar">
		<div class="stats-group">
			<div class="stat-card score-card">
				<span class="label">SCORE</span>
				<span class="value score-val">{Math.floor(game.score)}</span>
			</div>

			<div class="stat-card">
				<span class="label">BEST</span>
				<span class="value">{game.highScore}</span>
			</div>

			<div class="stat-card">
				<span class="label">DISTANCE</span>
				<span class="value">{Math.floor(game.distance)}m</span>
			</div>

			<div class="stat-card gem-card">
				<span class="gem-icon">💎</span>
				<span class="value gem-val">{game.gems}</span>
			</div>
		</div>

		<div class="actions-group">
			<button
				class="icon-btn"
				onclick={handleSound}
				title={game.isMuted ? 'Unmute Sound' : 'Mute Sound'}
				aria-label="Toggle Sound"
			>
				{game.isMuted ? '🔇' : '🔊'}
			</button>

			<button
				class="icon-btn pause-btn"
				onclick={handlePause}
				title="Pause (ESC)"
				aria-label="Pause Game"
			>
				⏸ <span class="shortcut">ESC</span>
			</button>
		</div>
	</header>

	<!-- Speed Bar at bottom-left -->
	<div class="speed-indicator">
		<div class="speed-label">SPEED {Math.floor(game.speed * 2.5)} km/h</div>
		<div class="speed-track">
			<div
				class="speed-fill"
				style:width="{Math.min(100, ((game.speed - 24) / (55 - 24)) * 100)}%"
			></div>
		</div>
	</div>
</div>

<style>
	.hud-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1.25rem;
		box-sizing: border-box;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
	}

	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.stats-group {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.stat-card {
		background: rgba(15, 12, 35, 0.75);
		border: 1px solid rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(12px);
		border-radius: 12px;
		padding: 0.5rem 0.9rem;
		display: flex;
		flex-direction: column;
		min-width: 72px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.score-card {
		border-color: rgba(0, 240, 255, 0.4);
		background: rgba(10, 20, 45, 0.85);
	}

	.gem-card {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
		border-color: rgba(0, 255, 200, 0.4);
	}

	.label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #8c90b0;
		text-transform: uppercase;
	}

	.value {
		font-size: 1.25rem;
		font-weight: 800;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.score-val {
		color: #00f0ff;
		text-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
	}

	.gem-val {
		color: #00ffd5;
	}

	.gem-icon {
		font-size: 1.1rem;
	}

	.actions-group {
		display: flex;
		gap: 0.5rem;
		pointer-events: auto;
	}

	.icon-btn {
		background: rgba(25, 20, 50, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(12px);
		border-radius: 12px;
		padding: 0.5rem 0.8rem;
		color: #ffffff;
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		transition: all 0.15s ease;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.icon-btn:hover {
		background: rgba(45, 35, 90, 0.9);
		border-color: #00f0ff;
		transform: translateY(-2px);
	}

	.shortcut {
		font-size: 0.65rem;
		font-weight: 700;
		background: rgba(255, 255, 255, 0.15);
		padding: 0.15rem 0.35rem;
		border-radius: 4px;
		color: #ccc;
	}

	.speed-indicator {
		background: rgba(15, 12, 35, 0.7);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		width: 160px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.speed-label {
		font-size: 0.68rem;
		font-weight: 700;
		color: #ff00aa;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.speed-track {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.speed-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff00aa, #00f0ff);
		transition: width 0.1s linear;
		border-radius: 3px;
	}
</style>
