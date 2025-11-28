import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createNovel } from '../novel/generator/index.js';
import { createDrama } from '../drama/generator/index.js';
import { createComic } from '../comic/renderer/index.js';
import { createGame } from '../game/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

import { translateJSON } from '../common/translation/translate.js';

const langConfigPath = path.join(__dirname, '../../config/language.json');
const langConfig = JSON.parse(fs.readFileSync(langConfigPath, 'utf8'));

export async function createIpPack(ipId, context = {}) {
    console.log(`Starting IP Pack generation for: ${ipId}`);

    // 1. Generate Novel (Handles its own multilingual generation)
    console.log("--- Generating Novel ---");
    const novelId = `${ipId}-novel`;
    const novelResult = await createNovel(novelId, context);

    // 2. Generate Drama (Handles its own multilingual generation)
    console.log("--- Generating Drama ---");
    const dramaId = `${ipId}-drama`;
    const dramaResult = await createDrama(dramaId, {
        ...context,
        novelMetadata: novelResult.metadata,
        novelOutline: novelResult.outline
    });

    // 3. Generate Comic (Handles its own multilingual generation)
    console.log("--- Generating Comic ---");
    const comicId = `${ipId}-comic`;
    const comicResult = await createComic(comicId, {
        ...context,
        novelMetadata: novelResult.metadata
    });

    // 4. Create IP Metadata (Default Language)
    const outputDir = path.join(process.cwd(), config.output_path, ipId);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const ipMetadata = {
        ipId: ipId,
        idea: context.idea || "No idea provided",
        genre: context.genre || config.default_genre,
        language: context.language || config.language,
        novelId: novelId,
        dramaId: dramaId,
        comicId: comicId,
        createdAt: new Date().toISOString(),
        novelMetadata: novelResult.metadata,
        dramaMetadata: dramaResult.metadata,
        comicMetadata: comicResult.metadata,
        games: []
    };

    fs.writeFileSync(path.join(outputDir, 'ip.json'), JSON.stringify(ipMetadata, null, 2));

    // 4.5 Generate Games (Default Language)
    console.log("--- Generating Games ---");
    const gameModes = ['if', 'vn']; // Could come from config
    for (const mode of gameModes) {
        try {
            const gameMeta = await createGame({
                mode,
                language: langConfig.default,
                ipId: ipId
            });
            ipMetadata.games.push({
                gameId: gameMeta.gameId,
                mode: gameMeta.mode,
                language: gameMeta.language
            });
        } catch (e) {
            console.error(`Failed to generate ${mode} game:`, e);
        }
    }
    // Update ip.json with games
    fs.writeFileSync(path.join(outputDir, 'ip.json'), JSON.stringify(ipMetadata, null, 2));

    console.log(`IP Pack generated successfully at ${outputDir} (Default: ${langConfig.default})`);

    // 5. Multilingual IP Metadata
    for (const lang of langConfig.languages) {
        if (lang === langConfig.default) continue; // Skip default

        console.log(`Translating IP Pack Metadata to ${lang}...`);
        const langOutputDir = path.join(process.cwd(), config.output_path, `${ipId}-${lang}`);
        if (!fs.existsSync(langOutputDir)) {
            fs.mkdirSync(langOutputDir, { recursive: true });
        }

        const langIpMetadata = await translateJSON(ipMetadata, lang);
        langIpMetadata.language = lang;
        // Update IDs to point to translated versions
        langIpMetadata.novelId = `${novelId}-${lang}`;
        langIpMetadata.dramaId = `${dramaId}-${lang}`;
        langIpMetadata.comicId = `${comicId}-${lang}`;
        langIpMetadata.games = []; // Reset games for this lang

        // Write first so createGame can find it
        fs.writeFileSync(path.join(langOutputDir, 'ip.json'), JSON.stringify(langIpMetadata, null, 2));

        // Generate Games for this language
        for (const mode of gameModes) {
            try {
                const gameMeta = await createGame({
                    mode,
                    language: lang,
                    ipId: `${ipId}-${lang}`
                });
                langIpMetadata.games.push({
                    gameId: gameMeta.gameId,
                    mode: gameMeta.mode,
                    language: gameMeta.language
                });
            } catch (e) {
                console.error(`Failed to generate ${mode} game for ${lang}:`, e);
            }
        }
        // Update ip.json with games
        fs.writeFileSync(path.join(langOutputDir, 'ip.json'), JSON.stringify(langIpMetadata, null, 2));

        console.log(`IP Pack Metadata translated to ${lang} at ${langOutputDir}`);
    }

    return ipMetadata;
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const ipId = process.argv[2] || 'sample-ip';
    const idea = process.argv[3] || "A poor girl time-travels and becomes the CEO's wife, planning revenge.";
    createIpPack(ipId, { idea, genre: 'romance_revenge', language: 'zh' });
}
