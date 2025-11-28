import fs from 'fs';
import path from 'path';

const DATA_ROOT = path.join(process.cwd(), 'data');
const REPORT_DIR = path.join(DATA_ROOT, 'ip-sales');
const IP_DIR = path.join(DATA_ROOT, 'ip');
const MARKET_DIR = path.join(DATA_ROOT, 'ip-market');

export default {
    // GET /api/admin/ip/daily
    async getDailyReports(req, res) {
        if (!fs.existsSync(REPORT_DIR)) return res.json([]);
        const files = fs.readdirSync(REPORT_DIR).filter(f => f.endsWith('.json')).sort().reverse();
        const reports = files.slice(0, 10).map(f => {
            try {
                return JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), 'utf8'));
            } catch (e) { return null; }
        }).filter(Boolean);
        return res.json(reports);
    },

    // GET /api/admin/ip/list
    async getList(req, res) {
        if (!fs.existsSync(IP_DIR)) return res.json([]);
        const ips = fs.readdirSync(IP_DIR).filter(f => fs.statSync(path.join(IP_DIR, f)).isDirectory());

        const list = ips.map(id => {
            let meta = {};
            let pitch = {};
            try {
                meta = JSON.parse(fs.readFileSync(path.join(IP_DIR, id, 'ip.json'), 'utf8'));
            } catch (e) { }
            try {
                pitch = JSON.parse(fs.readFileSync(path.join(MARKET_DIR, id, 'pitch.json'), 'utf8'));
            } catch (e) { }

            return {
                id,
                title: meta.title || id,
                genre: meta.genre,
                price: pitch.recommended_price,
                languages: pitch.languages || ['zh']
            };
        });

        return res.json(list);
    },

    // GET /api/admin/ip/detail?id={ipId}
    async getDetail(req, res) {
        const { id } = req.query;
        const pitchPath = path.join(MARKET_DIR, id, 'pitch.json');
        if (fs.existsSync(pitchPath)) {
            return res.json(JSON.parse(fs.readFileSync(pitchPath, 'utf8')));
        }
        return res.status(404).json({ error: "Pitch not found" });
    }
};
