import { createIpPack } from '../../factory/ip-pack/index.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data/ip');

export default {
    // GET /api/ip/list
    async list(req, res) {
        if (!fs.existsSync(DATA_DIR)) {
            return res.json([]);
        }
        const projects = fs.readdirSync(DATA_DIR).filter(f => {
            return fs.statSync(path.join(DATA_DIR, f)).isDirectory();
        });

        const list = projects.map(id => {
            try {
                const metaPath = path.join(DATA_DIR, id, 'ip.json');
                if (fs.existsSync(metaPath)) {
                    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                }
            } catch (e) { }
            return { ipId: id };
        });

        return res.json(list);
    },

    // GET /api/ip/get?id=xxx&lang=en
    async get(req, res) {
        const id = req.query.id;
        const lang = req.query.lang;
        if (!id) return res.status(400).json({ error: "Missing id" });

        let projectId = id;
        if (lang && lang !== 'zh') {
            projectId = `${id}-${lang}`;
        }

        let projectDir = path.join(DATA_DIR, projectId);
        if (!fs.existsSync(projectDir)) {
            if (projectId !== id) projectDir = path.join(DATA_DIR, id);
        }

        if (!fs.existsSync(projectDir)) {
            return res.status(404).json({ error: "Not found" });
        }

        const ipData = JSON.parse(fs.readFileSync(path.join(projectDir, 'ip.json'), 'utf8'));
        return res.json(ipData);
    },

    // POST /api/ip/create
    async create(req, res) {
        const { idea, genre, language } = req.body;
        if (!idea) return res.status(400).json({ error: "Missing idea" });

        // Generate a simple ID from timestamp
        const ipId = `ip-${Date.now()}`;

        try {
            const result = await createIpPack(ipId, { idea, genre, language });
            return res.json({ success: true, result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }
};
