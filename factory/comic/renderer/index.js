import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateStoryboard } from '../storyboard/index.js';
import { renderImage } from './render-image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

import { translateJSON, translateStoryboard } from '../../common/translation/translate.js';

const langConfigPath = path.join(__dirname, '../../../config/language.json');
const langConfig = JSON.parse(fs.readFileSync(langConfigPath, 'utf8'));

export async function createComic(projectId, context = {}) {
    console.log(`Starting comic generation for project: ${projectId}`);

    // 1. Generate Metadata (Default Language)
    const title = context.novelMetadata ? `Comic: ${context.novelMetadata.title}` : "The Infinite Canvas";
    const description = context.novelMetadata ? `Adapted from novel: ${context.novelMetadata.description}` : "A journey through a procedurally generated universe.";
    const genre = context.novelMetadata ? context.novelMetadata.genre : "Sci-Fi";

    const metadata = {
        id: projectId,
        title: title,
        author: "AI Artist",
        genre: genre,
        description: description,
        status: "ongoing",
        createdAt: new Date().toISOString(),
        sourceNovelId: context.novelMetadata ? context.novelMetadata.id : null
    };
    console.log("Metadata generated.");

    // 2. Generate Storyboard
    const storyboard = await generateStoryboard(config, metadata);
    console.log("Storyboard generated.");

    // 3. Save Episodes and Render Images (Default Language)
    const outputDir = path.join(process.cwd(), config.output_path, projectId);
    await saveComicData(outputDir, metadata, storyboard, true); // true = render images
    console.log(`Comic generated successfully at ${outputDir} (Default: ${langConfig.default})`);

    // 4. Multilingual Generation
    for (const lang of langConfig.languages) {
        if (lang === langConfig.default) continue; // Skip default

        console.log(`Translating Comic to ${lang}...`);
        const langOutputDir = path.join(process.cwd(), config.output_path, `${projectId}-${lang}`);

        // Translate Metadata
        const langMetadata = await translateJSON(metadata, lang);
        langMetadata.language = lang;

        // Translate Storyboard
        const langStoryboard = await translateStoryboard(storyboard, lang);

        // Save translated data (NO image rendering, reuse images conceptually or just save text)
        // For simplicity, we won't re-render images, just save the text data.
        // The frontend will need to know to look for images in the default folder or we copy them.
        // To keep it simple and robust: we will copy the images or just rely on text for now.
        // Let's just save the text data. The build script can handle image linking if needed,
        // or we can symlink. For now, we just save text.
        await saveComicData(langOutputDir, langMetadata, langStoryboard, false);
        console.log(`Comic translated to ${lang} at ${langOutputDir}`);
    }

    return { metadata, storyboard, episodeCount: storyboard.episodes.length, id: projectId };
}

async function saveComicData(dir, metadata, storyboard, renderImages = false) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(storyboard, null, 2));

    const episodesDir = path.join(dir, 'episodes');
    if (!fs.existsSync(episodesDir)) fs.mkdirSync(episodesDir, { recursive: true });

    const imagesDir = path.join(dir, 'images');
    if (renderImages && !fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    for (const episode of storyboard.episodes) {
        // Save episode JSON
        fs.writeFileSync(path.join(episodesDir, `episode-${episode.id}.json`), JSON.stringify(episode, null, 2));

        // Render images for each panel ONLY if requested
        if (renderImages) {
            for (const scene of episode.scenes) {
                for (const panel of scene.panels) {
                    const imageName = `ep${episode.id}-panel${panel.panelId}.png`;
                    const imagePath = path.join(imagesDir, imageName);
                    await renderImage(panel.prompt, imagePath);
                }
            }
        }
    }
    if (renderImages) console.log("Images generated.");
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const projectId = process.argv[2] || 'sample-comic';
    createComic(projectId);
}
