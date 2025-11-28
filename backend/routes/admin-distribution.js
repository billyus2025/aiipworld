import fs from 'fs';
import path from 'path';

const DATA_ROOT = path.join(process.cwd(), 'data');
const REPORT_DIR = path.join(DATA_ROOT, 'distribution');
const MANIFEST_FILE = path.join(DATA_ROOT, 'distribution/manifest.json');

export default {
    // GET /api/admin/distribution/daily
    async getDailyReports(req, res) {
        if (!fs.existsSync(REPORT_DIR)) return res.json([]);
        const files = fs.readdirSync(REPORT_DIR).filter(f => f.startsWith('daily-') && f.endsWith('.json')).sort().reverse();
        const reports = files.slice(0, 10).map(f => {
            try {
                return JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), 'utf8'));
            } catch (e) { return null; }
        }).filter(Boolean);
        return res.json(reports);
    },

    // GET /api/admin/distribution/manifest
    async getManifest(req, res) {
        if (fs.existsSync(MANIFEST_FILE)) {
            return res.json(JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8')));
        }
        return res.json({});
    }
};
