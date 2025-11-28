import { createNovel } from '../../factory/novel/generator/index.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data/novel');

export default {
    // GET /api/novel/list
    async list(req, res) {
        if (!fs.existsSync(DATA_DIR)) {
            return res.json([]);
        }
        // Filter out language-specific folders for the main list?
        // Or return all?
        // Let's return all, or just default.
        // Usually list shows projects.
        // Let's just list directories.
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

    // GET /api/novel/get?id=xxx&lang=en
    async get(req, res) {
        const id = req.query.id;
        const lang = req.query.lang; // Optional lang
        if (!id) return res.status(400).json({ error: "Missing id" });

        let projectId = id;
        if (lang && lang !== 'zh') { // Assuming 'zh' is default, or check config
            // Actually, better to check if id already has suffix?
            // Let's assume client passes base ID and lang.
            projectId = `${id}-${lang}`;
        }

        // Check if specific lang folder exists, if not fall back to ID (maybe ID was already suffixed or default)
        let projectDir = path.join(DATA_DIR, projectId);
        if (!fs.existsSync(projectDir)) {
            // Try base ID if lang was added
            if (projectId !== id) {
                projectDir = path.join(DATA_DIR, id);
            }
        }

        if (!fs.existsSync(projectDir)) {
            return res.status(404).json({ error: "Not found" });
        }

        const metadata = JSON.parse(fs.readFileSync(path.join(projectDir, 'metadata.json'), 'utf8'));
        // Load chapters list (lightweight)
        const chaptersDir = path.join(projectDir, 'chapters');
        let chapters = [];
        if (fs.existsSync(chaptersDir)) {
            chapters = fs.readdirSync(chaptersDir)
                .filter(f => f.endsWith('.json'))
                .map(f => {
                    const ch = JSON.parse(fs.readFileSync(path.join(chaptersDir, f), 'utf8'));
                    return { id: ch.id, title: ch.title }; // Only return minimal info
                })
                .sort((a, b) => a.id - b.id);
        }

        return res.json({ metadata, chapters });
    },

    // GET /api/novel/chapter?id=xxx&num=1&lang=en
    async getChapter(req, res) {
        const { id, num } = req.query;
        const lang = req.query.lang;

        if (!id || !num) return res.status(400).json({ error: "Missing id or num" });

        let projectId = id;
        if (lang && lang !== 'zh') {
            projectId = `${id}-${lang}`;
        }

        let projectDir = path.join(DATA_DIR, projectId);
        if (!fs.existsSync(projectDir)) {
            if (projectId !== id) projectDir = path.join(DATA_DIR, id);
        }

        const chapterPath = path.join(projectDir, 'chapters', `chapter-${num}.json`);
        if (!fs.existsSync(chapterPath)) {
            return res.status(404).json({ error: "Chapter not found" });
        }

        const chapter = JSON.parse(fs.readFileSync(chapterPath, 'utf8'));
        return res.json(chapter);
    },

    // POST /api/novel/create
    async create(req, res) {
        const { idea, genre, language } = req.body; // language here is for the INPUT idea language?
        // Or target language?
        // The factory now generates ALL languages.
        // So we just trigger it.

        const projectId = `novel-${Date.now()}`;
        try {
            const result = await createNovel(projectId, { idea, genre, language });
            return res.json({ success: true, result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }
};
