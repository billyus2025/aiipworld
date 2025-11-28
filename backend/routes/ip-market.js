import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePitches } from '../../factory/ip-market/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKET_DIR = path.join(process.cwd(), 'data/ip-market');

export default {
    // GET /api/ip-market/list
    async list(req, res) {
        if (!fs.existsSync(MARKET_DIR)) return res.json([]);

        const pitches = fs.readdirSync(MARKET_DIR).filter(f => {
            return fs.statSync(path.join(MARKET_DIR, f)).isDirectory();
        }).map(id => {
            try {
                const p = JSON.parse(fs.readFileSync(path.join(MARKET_DIR, id, 'pitch.json'), 'utf8'));
                return {
                    id: p.ipId,
                    title: p.title,
                    genre: p.genre,
                    price: p.recommended_price
                };
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        return res.json(pitches);
    },

    // GET /api/ip-market/get?id={ipId}
    async get(req, res) {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Missing id" });

        const pitchPath = path.join(MARKET_DIR, id, 'pitch.json');
        if (!fs.existsSync(pitchPath)) return res.status(404).json({ error: "Pitch not found" });

        const pitch = JSON.parse(fs.readFileSync(pitchPath, 'utf8'));
        return res.json(pitch);
    },

    // POST /api/ip-market/refresh
    async refresh(req, res) {
        try {
            await generatePitches();
            return res.json({ success: true, message: "Pitches regenerated" });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }
};
