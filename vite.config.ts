import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scoreFile = fileURLToPath(new URL('./src/data/highscore.json', import.meta.url));

export default defineConfig({
	plugins: [{
		name: 'local-high-score',
		configureServer(server) {
			server.watcher.unwatch(scoreFile);
			server.middlewares.use('/__highscore', (req, res) => {
				// Only accept writes from the machine running Vite.
				const address = req.socket.remoteAddress;
				if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address || '')) {
					res.writeHead(403).end();
					return;
				}
				let body = '';
				req.on('data', chunk => {
					body += chunk;
					if (body.length > 4096) req.destroy();
				});
				req.on('end', () => {
					try {
						const candidate = JSON.parse(body);
						if (typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 24 || !Number.isSafeInteger(candidate.score) || candidate.score < 1) throw new Error('Invalid score');
						const current = JSON.parse(readFileSync(scoreFile, 'utf8'));
						if (candidate.score > current.score) {
							writeFileSync(scoreFile, JSON.stringify({ name: candidate.name.trim(), score: candidate.score }, null, 2) + '\n');
						}
						res.writeHead(200).end();
					} catch {
						res.writeHead(400).end();
					}
				});
			});
		} 
	}],
	server: {
		port: 5173,
		host: true
	}
});
