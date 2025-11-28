import fs from 'fs';
import path from 'path';
import { generateStoreMeta } from './store-meta.js';

export async function packageGame(gameId, platform) {
    console.log(`Packaging Game ${gameId} for ${platform}...`);

    const gameDir = path.join(process.cwd(), 'data/game', gameId);
    const exportDir = path.join(gameDir, 'export/html5');

    if (!fs.existsSync(exportDir)) {
        console.error(`HTML5 export not found for ${gameId}`);
        return null;
    }

    const packDir = path.join(process.cwd(), 'data/game-export', gameId, 'pack');
    if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true });

    // Mock ZIP creation
    const zipPath = path.join(packDir, `${platform}.zip`);
    fs.writeFileSync(zipPath, "Mock ZIP Content"); // In real app, use archiver

    // Generate Meta
    const meta = await generateStoreMeta(gameId, platform);
    const metaDir = path.join(process.cwd(), 'data/game-export', gameId, 'meta');
    if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(path.join(metaDir, `${platform}.json`), JSON.stringify(meta, null, 2));

    return { zipPath, metaPath: path.join(metaDir, `${platform}.json`) };
}
