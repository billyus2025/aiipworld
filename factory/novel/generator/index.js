import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMetadata } from './metadata.js';
import { generateOutline } from './outline-generator.js';
import { generateChapters } from './chapter-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

import { translateJSON, translateChapter } from '../../common/translation/translate.js';

const langConfigPath = path.join(__dirname, '../../../config/language.json');
const langConfig = JSON.parse(fs.readFileSync(langConfigPath, 'utf8'));

export async function createNovel(projectId, context = {}) {
    console.log(`Starting novel generation for project: ${projectId}`);

    // 1. Generate Metadata (Default Language)
    const metadata = generateMetadata(projectId, context);
    console.log("Metadata generated.");

    // 2. Generate Outline
    const outline = await generateOutline(config, context);
    console.log("Outline generated.");

    // 3. Generate Chapters
    const chapters = await generateChapters(config, outline);
    console.log("Chapters generated.");

    // 4. Save Data (Default Language)
    const outputDir = path.join(process.cwd(), config.output_path, projectId);
    saveNovelData(outputDir, metadata, outline, chapters);
    console.log(`Novel generated successfully at ${outputDir} (Default: ${langConfig.default})`);

    // 5. Multilingual Generation
    for (const lang of langConfig.languages) {
        if (lang === langConfig.default) continue; // Skip default

        console.log(`Translating Novel to ${lang}...`);
        const langOutputDir = path.join(process.cwd(), config.output_path, `${projectId}-${lang}`);

        // Translate Metadata
        const langMetadata = await translateJSON(metadata, lang);
        langMetadata.language = lang;

        // Translate Outline
        const langOutline = await translateJSON(outline, lang);

        // Translate Chapters
        const langChapters = await Promise.all(chapters.map(ch => translateChapter(ch, lang)));

        saveNovelData(langOutputDir, langMetadata, langOutline, langChapters);
        console.log(`Novel translated to ${lang} at ${langOutputDir}`);
    }

    return { metadata, outline, chapterCount: chapters.length, id: projectId };
}

function saveNovelData(dir, metadata, outline, chapters) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(path.join(dir, 'outline.json'), JSON.stringify(outline, null, 2));

    const chaptersDir = path.join(dir, 'chapters');
    if (!fs.existsSync(chaptersDir)) {
        fs.mkdirSync(chaptersDir, { recursive: true });
    }

    chapters.forEach(ch => {
        fs.writeFileSync(path.join(chaptersDir, `chapter-${ch.id}.json`), JSON.stringify(ch, null, 2));
    });
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const projectId = process.argv[2] || 'sample-novel';
    createNovel(projectId);
}
