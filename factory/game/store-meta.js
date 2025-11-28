import fs from 'fs';
import path from 'path';

export async function generateStoreMeta(gameId, platform) {
    const gameDir = path.join(process.cwd(), 'data/game', gameId);
    const metadata = JSON.parse(fs.readFileSync(path.join(gameDir, 'metadata.json'), 'utf8'));

    return {
        title: metadata.title,
        description: `Experience the ${metadata.mode.toUpperCase()} version of ${metadata.title}.`,
        features: [
            "Interactive Storytelling",
            "Multiple Endings",
            "Immersive Audio"
        ],
        tags: [metadata.genre, "Visual Novel", "Interactive Fiction"],
        platform: platform,
        generatedAt: new Date().toISOString()
    };
}
