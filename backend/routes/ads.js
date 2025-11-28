import fs from 'fs';
import path from 'path';

export default {
    // GET /api/ads/config
    async getConfig(req, res) {
        try {
            const config = fs.readFileSync(path.join(process.cwd(), 'config/ads.json'), 'utf8');
            res.json(JSON.parse(config));
        } catch (e) {
            res.status(500).json({ error: "Failed to read config" });
        }
    },

    // GET /api/ads/report?date={date}
    async getReport(req, res) {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date required" });

        const reportPath = path.join(process.cwd(), 'data/logs', `ops-ads-${date}.json`);
        if (fs.existsSync(reportPath)) {
            res.json(JSON.parse(fs.readFileSync(reportPath, 'utf8')));
        } else {
            res.status(404).json({ error: "Report not found" });
        }
    },

    // POST /api/ads/config/update
    async updateConfig(req, res) {
        try {
            const newConfig = req.body;
            // Validate basic fields
            if (!newConfig.mode || !newConfig.platforms) return res.status(400).json({ error: "Invalid config" });

            fs.writeFileSync(path.join(process.cwd(), 'config/ads.json'), JSON.stringify(newConfig, null, 2));
            res.json({ success: true, config: newConfig });
        } catch (e) {
            res.status(500).json({ error: "Failed to update config" });
        }
    }
};
