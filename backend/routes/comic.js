import { createComic } from '../../factory/comic/renderer/index.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data/comic');

export default {
    // GET /api/comic/list
    async list(req, res) {
        if (!fs.existsSync(DATA_DIR)) {
            return res.json([]);
        }
        const projects = fs.readdirSync(DATA_DIR).filter(f => {
            return fs.statSync(path.join(DATA_DIR, f)).isDirectory();
        });

        const list = projects.map(id => {
            try {
                const metaPath = path.join(DATA_DIR, id, 'metadata.json');
                if (fs.existsSync(metaPath)) {
                    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                }
            } catch (e) { }
            return { id };
        });

        return res.json(list);
    },

    // GET /api/comic/get?id=xxx&lang=en
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

        const metadata = JSON.parse(fs.readFileSync(path.join(projectDir, 'metadata.json'), 'utf8'));
        const episodesDir = path.join(projectDir, 'episodes');
        const episodes = fs.readdirSync(episodesDir)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const ep = JSON.parse(fs.readFileSync(path.join(episodesDir, f), 'utf8'));
                return { id: ep.id, title: ep.title };
            })
            .sort((a, b) => a.id - b.id);

        return res.json({ metadata, episodes });
    },

    // GET /api/comic/episode?id=xxx&num=1&lang=en
    async getEpisode(req, res) {
        const { id, num, lang } = req.query;
        if (!id || !num) return res.status(400).json({ error: "Missing id or num" });

        let projectId = id;
        if (lang && lang !== 'zh') {
            projectId = `${id}-${lang}`;
        }

        let projectDir = path.join(DATA_DIR, projectId);
        if (!fs.existsSync(projectDir)) {
            if (projectId !== id) projectDir = path.join(DATA_DIR, id);
        }

        const episodePath = path.join(projectDir, 'episodes', `episode-${num}.json`);

        if (!fs.existsSync(episodePath)) {
            return res.status(404).json({ error: "Episode not found" });
        }

        const episode = JSON.parse(fs.readFileSync(episodePath, 'utf8'));
        return res.json(episode);
    },

    // POST /api/comic/create
    async create(req, res) {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "Missing id" });

        try {
            const result = await createComic(id);
            return res.json({ success: true, result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }
};
