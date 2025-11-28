import fs from 'fs';
import path from 'path';
import { generateScenes } from './scene-generator.js';
import { mapAssets } from './asset-map.js';

export async function generateVN(gameId, context, lang, config) {
    console.log(`Generating VN Game: ${gameId} (${lang})`);

    // 1. Generate Scenes
    const scenes = await generateScenes(context, lang, config.vn_max_scenes);

    // 2. Map Assets (Backgrounds, Characters)
    const assets = await mapAssets(scenes, context);

    const gameData = {
        gameId,
        mode: 'vn',
        language: lang,
        scenes,
        assets
    };

    return gameData;
}
