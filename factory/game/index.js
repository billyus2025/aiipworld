import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateIF } from './if-generator/index.js';
import { generateVN } from './vn-generator/index.js';
import { generateMetadata } from './metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(process.cwd(), 'data');
const GAME_DIR = path.join(DATA_ROOT, 'game');
const CONFIG_FILE = path.join(process.cwd(), 'config/factory.json');

export async function createGame({ mode, language, ipId, idea }) {
    console.log(`Creating Game: Mode=${mode}, Lang=${language}, IP=${ipId || 'None'}`);

    // 1. Load Context
    let context = { title: "New Game Idea", idea: idea || "A generic adventure." };
    if (ipId) {
        const ipPath = path.join(DATA_ROOT, 'ip', ipId, 'ip.json');
        if (fs.existsSync(ipPath)) {
            const ipData = JSON.parse(fs.readFileSync(ipPath, 'utf8'));
            context = { ...ipData, ipId };
        }
    }

    // 2. Load Config
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')).game;

    // 3. Generate Game ID
    const timestamp = Date.now();
    const gameId = ipId ? `${ipId}-${mode}-${language}` : `game-${timestamp}-${mode}-${language}`;
    const gameDir = path.join(GAME_DIR, gameId);

    if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

    // 4. Call Generator
    let gameData = null;
    if (mode === 'if') {
        gameData = await generateIF(gameId, context, language, config);
        fs.writeFileSync(path.join(gameDir, 'if.json'), JSON.stringify(gameData, null, 2));
    } else if (mode === 'vn') {
        gameData = await generateVN(gameId, context, language, config);
        fs.writeFileSync(path.join(gameDir, 'vn.json'), JSON.stringify(gameData, null, 2));
        fs.writeFileSync(path.join(gameDir, 'assets.json'), JSON.stringify(gameData.assets, null, 2));
    }

    // 5. Write Metadata
    const metadata = generateMetadata(gameId, context, mode, language);
    fs.writeFileSync(path.join(gameDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    console.log(`Game Created: ${gameId}`);
    return metadata;
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    if (args.length >= 2) {
        // node index.js mode lang [ipId] [idea]
        createGame({
            mode: args[0],
            language: args[1],
            ipId: args[2],
            idea: args[3]
        });
    }
}
