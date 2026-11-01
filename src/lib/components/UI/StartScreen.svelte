<script lang="ts">
	import { game } from '../../game/gameStore.svelte';

	function handleStart() {
		game.start();
	}
</script>

<div class="start-overlay">
	<div class="card">
		<div class="badge">AI VIBE CODING CHALLENGE</div>
		<h1 class="game-title">CYBER<span class="highlight">SLOPE</span></h1>
		<p class="tagline">Glide down the infinite neon abyss. Dodge blocks, jump barriers, survive.</p>

		<div class="instructions">
			<div class="inst-item">
				<div class="key-badge">⬅️ ➡️ or A / D</div>
				<span>Steer Ball</span>
			</div>
			<div class="inst-item">
				<div class="key-badge">SPACE or ⬆️</div>
				<span>Jump Barrier</span>
			</div>
			<div class="inst-item">
				<div class="key-badge">ESC</div>
				<span>Pause Menu</span>
			</div>
		</div>

		<button class="start-button" onclick={handleStart}>
			<span class="btn-text">START RUN</span>
			<span class="btn-subtext">PRESS SPACE OR CLICK</span>
		</button>

		{#if game.highScore > 0}
			<div class="high-score-banner">
				🏆 Current Best: <strong>{game.highScore}</strong>
			</div>
		{/if}
	</div>
</div>

<style>
	.start-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 50%, rgba(15, 5, 30, 0.75) 0%, rgba(3, 1, 8, 0.95) 100%);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 40;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
	}

	.card {
		background: linear-gradient(160deg, rgba(30, 20, 60, 0.85), rgba(10, 5, 20, 0.95));
		border: 1px solid rgba(0, 240, 255, 0.35);
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(0, 240, 255, 0.2);
		border-radius: 28px;
		padding: 2.5rem 3rem;
		width: 90%;
		max-width: 440px;
		text-align: center;
		color: #ffffff;
	}

	.badge {
		display: inline-block;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: #ff00aa;
		background: rgba(255, 0, 170, 0.15);
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		margin-bottom: 0.8rem;
		border: 1px solid rgba(255, 0, 170, 0.3);
	}

	.game-title {
		font-size: 3rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		margin: 0 0 0.5rem 0;
		text-shadow: 0 0 24px rgba(0, 240, 255, 0.6);
	}

	.highlight {
		background: linear-gradient(135deg, #00f0ff, #ff00aa);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.tagline {
		color: #a0a6cc;
		font-size: 0.95rem;
		line-height: 1.5;
		margin: 0 0 1.8rem 0;
	}

	.instructions {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.8rem;
	}

	.inst-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: #c0c6e0;
	}

	.key-badge {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 700;
		color: #ffffff;
	}

	.start-button {
		width: 100%;
		padding: 1.1rem;
		border-radius: 16px;
		border: none;
		background: linear-gradient(135deg, #00f0ff, #0088ff);
		color: #030818;
		font-size: 1.15rem;
		font-weight: 900;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		box-shadow: 0 8px 30px rgba(0, 240, 255, 0.45);
		transition: all 0.15s ease;
	}

	.start-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 35px rgba(0, 240, 255, 0.65);
	}

	.btn-text {
		letter-spacing: 0.08em;
	}

	.btn-subtext {
		font-size: 0.65rem;
		font-weight: 700;
		opacity: 0.75;
		letter-spacing: 0.08em;
	}

	.high-score-banner {
		margin-top: 1.25rem;
		font-size: 0.85rem;
		color: #ffd700;
	}
</style>
