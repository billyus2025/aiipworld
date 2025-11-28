import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(process.cwd(), 'data');
const VIDEOS_DIR = path.join(DATA_ROOT, 'videos');
const CONFIG_FILE = path.join(process.cwd(), 'config/distribution.json');

import { generateSubtitles } from './subtitle-generator.js';

// Mock TTS Provider
async function generateTTS(text, outputFile) {
    // In real app, call ElevenLabs API
    // Here, just write a dummy file
    fs.writeFileSync(outputFile, `[TTS Audio for: "${text.substring(0, 20)}..."]`);
    return outputFile;
}

export async function buildVideos(type, id, languages = ['en']) {
    console.log(`Building videos for ${type}/${id} [${languages.join(',')}]...`);

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    // We iterate over languages here
    for (const lang of languages) {
        const outputDir = path.join(VIDEOS_DIR, type, id, lang);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // Resolve Source Directory
        let sourceDir = path.join(DATA_ROOT, type, id);
        if (lang !== 'zh' && !id.endsWith(`-${lang}`)) {
            // Try to find lang specific folder
            const langId = `${id}-${lang}`;
            if (fs.existsSync(path.join(DATA_ROOT, type, langId))) {
                sourceDir = path.join(DATA_ROOT, type, langId);
            } else if (lang !== 'zh') {
                // If no specific folder, maybe we use default? 
                // But for translation we need text. 
                // Assuming if we are building for 'en', the source MUST exist.
                console.log(`Source data not found for ${lang}: ${langId}`);
                continue;
            }
        } else if (id.endsWith(`-${lang}`)) {
            sourceDir = path.join(DATA_ROOT, type, id);
        }

        if (!fs.existsSync(sourceDir)) {
            console.log(`Source data not found: ${sourceDir}`);
            continue;
        }

        if (type === 'drama') {
            await buildDramaVideos(sourceDir, outputDir, config, lang);
        } else if (type === 'novel') {
            await buildNovelVideos(sourceDir, outputDir, config, lang);
        } else if (type === 'comic') {
            await buildComicVideos(sourceDir, outputDir, config, lang);
        }
    }
}

async function buildDramaVideos(sourceDir, outputDir, config, lang) {
    const episodesDir = path.join(sourceDir, 'episodes');
    if (!fs.existsSync(episodesDir)) return;

    const episodes = fs.readdirSync(episodesDir).filter(f => f.endsWith('.json'));
    for (const epFile of episodes) {
        const ep = JSON.parse(fs.readFileSync(path.join(episodesDir, epFile), 'utf8'));
        const videoFile = path.join(outputDir, `episode-${ep.id}.mp4`);
        const coverFile = path.join(outputDir, `cover-${ep.id}.png`);

        // Mock Video
        const content = `Video for Drama Episode ${ep.id} (${lang})\nTitle: ${ep.title}\nTemplate: drama-narration`;
        fs.writeFileSync(videoFile, content);

        // Mock Cover
        fs.writeFileSync(coverFile, `[Cover Image for ${ep.title}]`);

        // Subtitles
        generateSubtitles(ep.content || "No content", outputDir, lang);

        console.log(`Generated assets for Drama Ep ${ep.id} (${lang})`);
    }
}

async function buildNovelVideos(sourceDir, outputDir, config, lang) {
    const chaptersDir = path.join(sourceDir, 'chapters');
    if (!fs.existsSync(chaptersDir)) return;

    const chapters = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.json'));
    for (const chFile of chapters) {
        const ch = JSON.parse(fs.readFileSync(path.join(chaptersDir, chFile), 'utf8'));
        const videoFile = path.join(outputDir, `chapter-${ch.id}.mp4`);
        const coverFile = path.join(outputDir, `cover-${ch.id}.png`);

        const content = `Scroll Video for Novel Chapter ${ch.id} (${lang})\nTitle: ${ch.title}\nTemplate: novel-scroll`;
        fs.writeFileSync(videoFile, content);
        fs.writeFileSync(coverFile, `[Cover Image for ${ch.title}]`);

        generateSubtitles(ch.content || "No content", outputDir, lang);

        console.log(`Generated assets for Novel Ch ${ch.id} (${lang})`);
    }
}

async function buildComicVideos(sourceDir, outputDir, config, lang) {
    const storyboardPath = path.join(sourceDir, 'storyboard.json');
    if (!fs.existsSync(storyboardPath)) return;

    const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
    for (const ep of storyboard.episodes) {
        const videoFile = path.join(outputDir, `episode-${ep.id}.mp4`);
        const coverFile = path.join(outputDir, `cover-${ep.id}.png`);

        const content = `Slideshow Video for Comic Episode ${ep.id} (${lang})\nTitle: ${ep.title}\nTemplate: comic-slideshow`;
        fs.writeFileSync(videoFile, content);
        fs.writeFileSync(coverFile, `[Cover Image for ${ep.title}]`);

        // Comic might not have text content easily accessible here for subtitles without parsing panels
        // Mocking it
        generateSubtitles(`Comic Episode ${ep.id} content...`, outputDir, lang);

        console.log(`Generated assets for Comic Ep ${ep.id} (${lang})`);
    }
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // Usage: node video-builder.js type id [lang1,lang2,...]
    const args = process.argv.slice(2);
    if (args.length >= 3) {
        buildVideos(args[0], args[1], args[2]);
    }
}
