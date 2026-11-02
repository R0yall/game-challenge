import shared from './data/highscore.json';

export interface ScoreEntry {
	id: string;
	name: string;
	score: number;
}

const storageKey = 'viberunner_leaderboard';
const DREAMLO_PRIVATE = 'LsXVDQxkL0a7Rg-PmZmMhQGBwZD7hc00qbpSkkuX2seA';
const DREAMLO_PUBLIC = '6ae892238f40bc2014bf3b22';

// In Vite dev server, /api/dreamlo proxies to http://dreamlo.com
const DREAMLO_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
	? '/api/dreamlo/lb'
	: 'http://dreamlo.com/lb';

let sharedScores = (shared.scores as ScoreEntry[]) || [];
let cloudScores: ScoreEntry[] = [];
let localScores: ScoreEntry[] = [];

// Load cached local scores
try {
	const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
	if (Array.isArray(saved)) {
		localScores = saved.filter(
			(entry) => typeof entry.name === 'string' && Number.isSafeInteger(entry.score) && entry.score > 0
		);
	}
} catch {
	/* Browser storage optional */
}

export function getLeaderboard(): ScoreEntry[] {
	const map = new Map<string, ScoreEntry>();
	// Cloud scores take priority, then shared file fallback, then localStorage
	for (const entry of [...cloudScores, ...sharedScores, ...localScores]) {
		const existing = map.get(entry.name);
		if (!existing || entry.score > existing.score) {
			map.set(entry.name, entry);
		}
	}
	return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 20);
}

export async function fetchLeaderboard(): Promise<ScoreEntry[]> {
	const endpoints = [
		`${DREAMLO_BASE}/${DREAMLO_PUBLIC}/json`,
		`http://dreamlo.com/lb/${DREAMLO_PUBLIC}/json`
	];

	for (const url of endpoints) {
		try {
			const res = await fetch(url);
			if (!res.ok) continue;
			const data = await res.json();
			const raw = data?.dreamlo?.leaderboard?.entry;
			if (raw) {
				const list = Array.isArray(raw) ? raw : [raw];
				cloudScores = list
					.map((item: any, idx: number) => ({
						id: `dreamlo-${item.name}-${idx}`,
						name: String(item.name || 'Unknown'),
						score: parseInt(item.score, 10) || 0
					}))
					.filter((e: ScoreEntry) => e.score > 0);

				try {
					localStorage.setItem(storageKey, JSON.stringify(cloudScores));
				} catch {}
				break;
			}
		} catch {
			// Try next endpoint or fallback
		}
	}

	return getLeaderboard();
}

export async function recordScore(name: string, score: number): Promise<boolean> {
	const cleanName = name.trim().slice(0, 24) || 'Player';
	const safeScore = Math.floor(score);
	const entry: ScoreEntry = {
		id: `local-${Date.now()}`,
		name: cleanName,
		score: safeScore
	};

	// Save to local cache immediately
	localScores = [...localScores, entry].sort((a, b) => b.score - a.score).slice(0, 20);
	try {
		localStorage.setItem(storageKey, JSON.stringify(localScores));
	} catch {}

	let submitted = false;
	const endpoints = [
		`${DREAMLO_BASE}/${DREAMLO_PRIVATE}/add/${encodeURIComponent(cleanName)}/${safeScore}`,
		`http://dreamlo.com/lb/${DREAMLO_PRIVATE}/add/${encodeURIComponent(cleanName)}/${safeScore}`
	];

	for (const url of endpoints) {
		try {
			const res = await fetch(url);
			if (res.ok) {
				submitted = true;
				break;
			}
		} catch {
			// Continue to next endpoint
		}
	}

	// Refresh leaderboard cache from cloud
	if (submitted) {
		await fetchLeaderboard();
	}

	return submitted;
}
