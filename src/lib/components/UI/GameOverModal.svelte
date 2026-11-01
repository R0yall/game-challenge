<script lang="ts">
	import { game } from '../../game/gameStore.svelte';

	let isNewBest = $derived(
		game.score >= game.highScore && game.score > 0
	);

	function handleRestart() {
		game.start();
	}
</script>

<div class="overlay">
	<div class="modal">
		{#if isNewBest}
			<div class="badge new-best">🏆 NEW HIGH SCORE!</div>
		{:else}
			<div class="badge crashed">💥 CRASHED!</div>
		{/if}

		<h2>GAME OVER</h2>

		<div class="score-showcase">
			<span class="score-label">FINAL SCORE</span>
			<span class="score-number">{Math.floor(game.score)}</span>
		</div>

		<div class="details-grid">
			<div class="detail-box">
				<span class="d-label">BEST</span>
				<span class="d-val">{game.highScore}</span>
			</div>
			<div class="detail-box">
				<span class="d-label">DISTANCE</span>
				<span class="d-val">{Math.floor(game.distance)}m</span>
			</div>
			<div class="detail-box">
				<span class="d-label">GEMS</span>
				<span class="d-val">💎 {game.gems}</span>
			</div>
			<div class="detail-box">
				<span class="d-label">TOP SPEED</span>
				<span class="d-val">{Math.floor(game.speed * 2.5)} km/h</span>
			</div>
		</div>

		<button class="restart-btn" onclick={handleRestart}>
			PLAY AGAIN <span class="hint">SPACE / CLICK</span>
		</button>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(10, 0, 15, 0.82);
		backdrop-filter: blur(14px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 60;
		animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
	}

	.modal {
		background: linear-gradient(150deg, rgba(30, 10, 35, 0.96), rgba(12, 6, 20, 0.96));
		border: 1px solid rgba(255, 0, 120, 0.4);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 0, 120, 0.25);
		border-radius: 24px;
		padding: 2.2rem 2.5rem;
		width: 90%;
		max-width: 400px;
		text-align: center;
		color: #ffffff;
	}

	.badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
		margin-bottom: 0.5rem;
	}

	.crashed {
		background: rgba(255, 0, 85, 0.2);
		color: #ff3377;
		border: 1px solid rgba(255, 0, 85, 0.4);
	}

	.new-best {
		background: rgba(255, 215, 0, 0.2);
		color: #ffd700;
		border: 1px solid rgba(255, 215, 0, 0.4);
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
	}

	h2 {
		margin: 0.2rem 0 1.2rem 0;
		font-size: 2.2rem;
		font-weight: 900;
		letter-spacing: 0.05em;
	}

	.score-showcase {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 1.2rem;
		margin-bottom: 1.2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.score-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #a0a5c0;
		letter-spacing: 0.1em;
	}

	.score-number {
		font-size: 3rem;
		font-weight: 900;
		color: #00f0ff;
		text-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
		margin-top: 0.2rem;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
		margin-bottom: 1.6rem;
	}

	.detail-box {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 0.6rem 0.8rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.d-label {
		font-size: 0.65rem;
		color: #8c90b0;
		font-weight: 700;
	}

	.d-val {
		font-size: 1.15rem;
		font-weight: 800;
		color: #ffffff;
	}

	.restart-btn {
		width: 100%;
		padding: 1rem;
		border-radius: 14px;
		border: none;
		background: linear-gradient(135deg, #ff0077, #ff5500);
		color: #ffffff;
		font-size: 1.1rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		box-shadow: 0 8px 24px rgba(255, 0, 119, 0.4);
		transition: all 0.15s ease;
	}

	.restart-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 30px rgba(255, 0, 119, 0.6);
	}

	.hint {
		font-size: 0.65rem;
		opacity: 0.85;
		font-weight: 600;
		letter-spacing: 0.08em;
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
