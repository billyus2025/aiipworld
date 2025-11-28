import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMetadata } from './metadata.js';
import { generateOutline } from './outline-generator.js';
import { generateEpisodes } from './episode-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

import { translateJSON, translateEpisode } from '../../common/translation/translate.js';

const langConfigPath = path.join(__dirname, '../../../config/language.json');
const langConfig = JSON.parse(fs.readFileSync(langConfigPath, 'utf8'));

export async function createDrama(projectId, context = {}) {
  console.log(`Starting drama generation for project: ${projectId}`);

  // 1. Generate Metadata (Default Language)
  const metadata = generateMetadata(projectId, context);
  console.log("Metadata generated.");

  // 2. Generate Outline
  const outline = await generateOutline(config);
  console.log("Outline generated.");

  // 3. Generate Episodes
  const episodes = await generateEpisodes(config, outline);
  console.log("Episodes generated.");

  // 4. Save Data (Default Language)
  const outputDir = path.join(process.cwd(), config.output_path, projectId);
  saveDramaData(outputDir, metadata, outline, episodes);
  console.log(`Drama generated successfully at ${outputDir} (Default: ${langConfig.default})`);

  // 5. Multilingual Generation
  for (const lang of langConfig.languages) {
    if (lang === langConfig.default) continue; // Skip default

    console.log(`Translating Drama to ${lang}...`);
    const langOutputDir = path.join(process.cwd(), config.output_path, `${projectId}-${lang}`);

    // Translate Metadata
    const langMetadata = await translateJSON(metadata, lang);
    langMetadata.language = lang;

    // Translate Outline
    const langOutline = await translateJSON(outline, lang);

    // Translate Episodes
    const langEpisodes = await Promise.all(episodes.map(ep => translateEpisode(ep, lang)));

    saveDramaData(langOutputDir, langMetadata, langOutline, langEpisodes);
    console.log(`Drama translated to ${lang} at ${langOutputDir}`);
  }

  return { metadata, outline, episodesCount: episodes.length, id: projectId };
}

function saveDramaData(dir, metadata, outline, episodes) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  fs.writeFileSync(path.join(dir, 'outline.json'), JSON.stringify(outline, null, 2));

  const episodesDir = path.join(dir, 'episodes');
  if (!fs.existsSync(episodesDir)) {
    fs.mkdirSync(episodesDir, { recursive: true });
  }

  episodes.forEach(ep => {
    fs.writeFileSync(path.join(episodesDir, `episode-${ep.id}.json`), JSON.stringify(ep, null, 2));
  });
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const projectId = process.argv[2] || 'sample-drama';
  createDrama(projectId);
}
