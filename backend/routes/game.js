import fs from 'fs';
import path from 'path';
import { createGame } from '../../factory/game/index.js';

const DATA_ROOT = path.join(process.cwd(), 'data');
const GAME_DIR = path.join(DATA_ROOT, 'game');

export default {
    // GET /api/game/list
    async list(req, res) {
        if (!fs.existsSync(GAME_DIR)) return res.json([]);

        const games = fs.readdirSync(GAME_DIR).filter(f => fs.statSync(path.join(GAME_DIR, f)).isDirectory());
        const list = games.map(id => {
            try {
                return JSON.parse(fs.readFileSync(path.join(GAME_DIR, id, 'metadata.json'), 'utf8'));
            } catch (e) { return null; }
        }).filter(Boolean);

        return res.json(list);
    },

    // GET /api/game/get?id={gameId}
    async get(req, res) {
        const { id } = req.query;
        const gameDir = path.join(GAME_DIR, id);

        if (!fs.existsSync(gameDir)) return res.status(404).json({ error: "Game not found" });

        const metadata = JSON.parse(fs.readFileSync(path.join(gameDir, 'metadata.json'), 'utf8'));
        let gameData = {};

        if (metadata.mode === 'if') {
            gameData = JSON.parse(fs.readFileSync(path.join(gameDir, 'if.json'), 'utf8'));
        } else if (metadata.mode === 'vn') {
            gameData = JSON.parse(fs.readFileSync(path.join(gameDir, 'vn.json'), 'utf8'));
            // assets are usually separate but we can include them or fetch separately
            // For simplicity, let's include assets if needed, but player might load them.
            // Let's just return the main spec.
        }

        return res.json({ metadata, gameData });
    },

    // POST /api/game/create
    async create(req, res) {
        try {
            const { mode, language, ipId, idea } = req.body;
            if (!mode || !language) return res.status(400).json({ error: "Missing mode or language" });

            const metadata = await createGame({ mode, language, ipId, idea });
            return res.json(metadata);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "Failed to create game" });
        }
    },

    // GET /api/game/export?id={gameId}
    async export(req, res) {
        const { id } = req.query;
        try {
            // Dynamically import to avoid circular dep issues if any, or just import at top
            const { exportToHTML5 } = await import('../../factory/game/exporter-html5.js');
            const exportPath = await exportToHTML5(id);

            if (!exportPath) return res.status(404).json({ error: "Game not found" });

            // Return relative path for frontend
            return res.json({ export_path: `sites/game-export/${id}/index.html` });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "Export failed" });
        }
    }
};
