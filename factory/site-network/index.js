import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(process.cwd(), 'data');
const MANIFEST_DIR = path.join(DATA_ROOT, 'site-network');
const MANIFEST_FILE = path.join(MANIFEST_DIR, 'manifest.json');

const LANG_CONFIG = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/language.json'), 'utf8'));

export async function generateManifest() {
    console.log("Generating Site Network Manifest...");

    const manifest = {
        novel: {},
        drama: {},
        comic: {},
        ip: {}
    };

    // Initialize language keys
    LANG_CONFIG.languages.forEach(lang => {
        manifest.novel[lang] = [];
        manifest.drama[lang] = [];
        manifest.comic[lang] = [];
        manifest.ip[lang] = [];
    });

    // Scan Novel
    scanType('novel', manifest.novel);
    // Scan Drama
    scanType('drama', manifest.drama);
    // Scan Comic
    scanType('comic', manifest.comic);
    // Scan IP
    scanType('ip', manifest.ip);

    if (!fs.existsSync(MANIFEST_DIR)) {
        fs.mkdirSync(MANIFEST_DIR, { recursive: true });
    }

    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
    console.log(`Manifest generated at ${MANIFEST_FILE}`);
    return manifest;
}

function scanType(type, typeManifest) {
    const typeDir = path.join(DATA_ROOT, type);
    if (!fs.existsSync(typeDir)) return;

    const projects = fs.readdirSync(typeDir).filter(f => {
        return fs.statSync(path.join(typeDir, f)).isDirectory();
    });

    projects.forEach(projectId => {
        // Determine language
        let lang = LANG_CONFIG.default;
        let baseId = projectId;

        // Check if ends with -lang
        for (const l of LANG_CONFIG.languages) {
            if (projectId.endsWith(`-${l}`) && l !== LANG_CONFIG.default) {
                lang = l;
                // baseId = projectId.slice(0, -(l.length + 1)); // Not strictly needed for manifest lists
                break;
            }
        }

        if (typeManifest[lang]) {
            // Read metadata for title
            let title = projectId;
            try {
                const metaPath = path.join(typeDir, projectId, type === 'ip' ? 'ip.json' : 'metadata.json');
                if (fs.existsSync(metaPath)) {
                    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    title = meta.title || meta.ipId || projectId;
                }
            } catch (e) { }

            typeManifest[lang].push({
                id: projectId,
                title: title
            });
        }
    });
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generateManifest();
}
