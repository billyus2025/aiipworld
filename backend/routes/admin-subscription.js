import fs from 'fs';
import path from 'path';

const DATA_ROOT = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(process.cwd(), 'config/subscription-projects.json');
const STATS_FILE = path.join(DATA_ROOT, 'subscription/stats.json');

export default {
    // GET /api/admin/subscription/stats
    async getStats(req, res) {
        if (fs.existsSync(STATS_FILE)) {
            const stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
            return res.json(stats);
        }
        return res.json({ error: "No stats available" });
    },

    // GET /api/admin/subscription/projects
    async getProjects(req, res) {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return res.json(config);
        }
        return res.json({ active: [] });
    },

    // POST /api/admin/subscription/projects/update
    async updateProjects(req, res) {
        const { active } = req.body;
        if (!active) return res.status(400).json({ error: "Missing active projects list" });

        let config = {};
        if (fs.existsSync(CONFIG_FILE)) {
            config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
        config.active = active;

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return res.json({ success: true });
    }
};
