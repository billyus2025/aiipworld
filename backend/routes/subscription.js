import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data/subscription');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const CONFIG_FILE = path.join(process.cwd(), 'config/subscription.json');

// Helper to read JSON
function readJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return [];
    }
}

// Helper to write JSON
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Helper to get config
function getConfig() {
    if (!fs.existsSync(CONFIG_FILE)) return { default_free_chapters: 5 };
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

export default {
    // POST /api/subscription/register
    async register(req, res) {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Missing username or password" });

        const users = readJSON(USERS_FILE);
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUser = {
            id: `user-${Date.now()}`,
            username,
            password, // In real app, hash this!
            isVip: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeJSON(USERS_FILE, users);

        return res.json({ success: true, token: newUser.id, user: { username: newUser.username, isVip: newUser.isVip } });
    },

    // POST /api/subscription/login
    async login(req, res) {
        const { username, password } = req.body;
        const users = readJSON(USERS_FILE);
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        return res.json({ success: true, token: user.id, user: { username: user.username, isVip: user.isVip } });
    },

    // GET /api/subscription/profile
    async profile(req, res) {
        const token = req.headers.authorization; // Simple token = user.id
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const users = readJSON(USERS_FILE);
        const user = users.find(u => u.id === token);

        if (!user) return res.status(401).json({ error: "Invalid token" });

        return res.json({ username: user.username, isVip: user.isVip });
    },

    // POST /api/subscription/purchase-vip
    async purchaseVip(req, res) {
        const token = req.headers.authorization;
        const { plan } = req.body; // 'monthly' or 'yearly'

        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const users = readJSON(USERS_FILE);
        const userIndex = users.findIndex(u => u.id === token);

        if (userIndex === -1) return res.status(401).json({ error: "Invalid token" });

        // Mock payment success
        users[userIndex].isVip = true;
        users[userIndex].vipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days mock

        writeJSON(USERS_FILE, users);

        // Record purchase
        const purchases = readJSON(PURCHASES_FILE);
        purchases.push({
            userId: token,
            plan,
            date: new Date().toISOString(),
            amount: getConfig().vip_price[plan] || 9.99
        });
        writeJSON(PURCHASES_FILE, purchases);

        return res.json({ success: true, isVip: true });
    },

    // GET /api/subscription/access?type={novel|drama|comic}&id={projectId}&lang={lang}&num={chapterNum}
    async checkAccess(req, res) {
        const { type, id, lang, num } = req.query;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        // Default config
        let freeChapters = 5;
        try {
            const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/subscription.json'), 'utf8'));
            freeChapters = config.default_free_chapters || 5;
        } catch (e) { }

        const chapterNum = parseInt(num);

        // 1. Free Tier Check
        if (!isNaN(chapterNum) && chapterNum <= freeChapters) {
            return res.json({ access: true, reason: 'free_tier' });
        }

        // 2. VIP Check
        if (!token) {
            return res.json({ access: false, reason: 'login_required' });
        }

        const users = readJSON(USERS_FILE);
        const user = users.find(u => u.id === token); // Mock token = id

        if (!user) {
            return res.json({ access: false, reason: 'invalid_token' });
        }

        if (user.vip || user.isVip) { // Handle both flags for compatibility
            return res.json({ access: true, reason: 'vip_pass' });
        }

        // 3. Individual Purchase Check (Mock)
        const purchases = readJSON(PURCHASES_FILE);
        const hasPurchased = purchases.some(p => p.userId === user.id && p.itemId === `${type}-${id}-${num}`);

        if (hasPurchased) {
            return res.json({ access: true, reason: 'purchased' });
        }

        return res.json({ access: false, reason: 'paywall' });
    },

    // GET /api/subscription/game-access?id={gameId}
    async checkGameAccess(req, res) {
        const { id } = req.query;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        const gameDir = path.join(process.cwd(), 'data/game', id);
        if (!fs.existsSync(gameDir)) return res.json({ access: false, reason: "not-found" });

        let metadata = {};
        try {
            metadata = JSON.parse(fs.readFileSync(path.join(gameDir, 'metadata.json'), 'utf8'));
        } catch (e) { return res.json({ access: false, reason: "error" }); }

        // If no restrictions
        if (!metadata.subscription_required && !metadata.vip_only) {
            return res.json({ access: true, reason: "ok" });
        }

        // Check User
        const user = users.find(u => u.token === token);
        if (!user) {
            return res.json({ access: false, reason: "login-required" });
        }

        // Check VIP
        if (metadata.vip_only && !user.vip) {
            return res.json({ access: false, reason: "vip-required" });
        }

        return res.json({ access: true, reason: "ok" });
    }
};
