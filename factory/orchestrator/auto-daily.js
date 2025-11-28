import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { generatePitches } from '../ip-market/index.js';
import { generateManifest } from '../site-network/index.js';
import { buildVideos } from '../distribution/video-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(process.cwd(), 'data/logs');
const DATA_ROOT = path.join(process.cwd(), 'data');

async function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, { stdio: 'inherit', shell: true });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with code ${code}`));
        });
    });
}

async function autoDaily() {
    console.log("=== Starting Daily Auto Build ===");
    const startTime = new Date();
    const report = {
        date: startTime.toISOString(),
        steps: [],
        status: 'pending'
    };

    try {
        // 1. Regenerate IP Market Pitches
        console.log("\n--- Step 1: IP Market Pitches ---");
        await generatePitches();
        report.steps.push({ name: 'ip-market', status: 'success' });

        // 2. Regenerate Site Network
        console.log("\n--- Step 2: Site Network Manifest ---");
        await generateManifest();
        report.steps.push({ name: 'site-network', status: 'success' });

        // 3. Generate Videos (Mock: scan all IPs and build videos for all supported langs)
        console.log("\n--- Step 3: Video Generation ---");
        const langConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/language.json'), 'utf8'));
        const languages = langConfig.languages;

        // Scan IPs
        const ipDir = path.join(DATA_ROOT, 'ip');
        if (fs.existsSync(ipDir)) {
            const ips = fs.readdirSync(ipDir).filter(f => fs.statSync(path.join(ipDir, f)).isDirectory());
            for (const ipId of ips) {
                // Check if it's a base IP
                // A base IP is one that doesn't end with a supported language suffix (unless it's the default one, but usually base has no suffix or default suffix)
                // Actually, IP Pack generates:
                // base: sample-ip-v5-global (contains ip.json with lang=zh)
                // variants: sample-ip-v5-global-en, etc.

                const isVariant = languages.some(l => ipId.endsWith(`-${l}`) && l !== langConfig.default);

                if (!isVariant) {
                    let baseId = ipId;
                    if (ipId.endsWith(`-${langConfig.default}`)) baseId = ipId.replace(`-${langConfig.default}`, '');

                    // Read IP Data to get sub-project IDs
                    let ipData = {};
                    try {
                        ipData = JSON.parse(fs.readFileSync(path.join(ipDir, ipId, 'ip.json'), 'utf8'));
                    } catch (e) {
                        console.log(`Skipping video build for ${ipId}: No ip.json`);
                        continue;
                    }

                    // Check novel
                    if (ipData.novelId) {
                        // The novelId in ip.json might be the base ID or lang specific.
                        // Usually IP Pack sets it to the specific one for that lang version.
                        // But here we are iterating base IP.
                        // If ipId is base (zh), novelId is likely sample-ip-v5-global-novel.
                        // Video builder expects the ID that forms the folder name.
                        // If we pass 'sample-ip-v5-global-novel', video builder for 'en' will look for 'sample-ip-v5-global-novel-en'.
                        // This matches the directory structure!
                        await buildVideos('novel', ipData.novelId, languages);
                    }
                    // Check drama
                    if (ipData.dramaId) {
                        await buildVideos('drama', ipData.dramaId, languages);
                    }
                    // Check comic
                    if (ipData.comicId) {
                        await buildVideos('comic', ipData.comicId, languages);
                    }
                }
            }
        }
        report.steps.push({ name: 'video-distribution', status: 'success' });

        // 4. Run Frontend Build (includes Subscription updates)
        console.log("\n--- Step 4: Frontend Build ---");
        const buildScript = path.join(process.cwd(), 'frontend/build.js');
        await runCommand('node', [buildScript]);
        report.steps.push({ name: 'frontend-build', status: 'success' });

        // 5. Generate Distribution Manifest
        console.log("\n--- Step 5: Distribution Manifest ---");
        const manifest = {
            novel: {},
            drama: {},
            comic: {},
            priority_languages: languages.slice(0, 4), // Top 4
            generatedAt: new Date().toISOString()
        };

        // Populate manifest by scanning videos dir
        const videosDir = path.join(DATA_ROOT, 'videos');
        if (fs.existsSync(videosDir)) {
            ['novel', 'drama', 'comic'].forEach(type => {
                const typeDir = path.join(videosDir, type);
                if (fs.existsSync(typeDir)) {
                    const projects = fs.readdirSync(typeDir);
                    projects.forEach(pId => {
                        manifest[type][pId] = {};
                        const pDir = path.join(typeDir, pId);
                        const langs = fs.readdirSync(pDir);
                        langs.forEach(l => {
                            const lDir = path.join(pDir, l);
                            const files = fs.readdirSync(lDir);
                            manifest[type][pId][l] = files;
                        });
                    });
                }
            });
        }
        const distManifestPath = path.join(DATA_ROOT, 'distribution');
        if (!fs.existsSync(distManifestPath)) fs.mkdirSync(distManifestPath, { recursive: true });
        fs.writeFileSync(path.join(distManifestPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
        report.steps.push({ name: 'distribution-manifest', status: 'success' });

        report.status = 'success';
        console.log("\n=== Daily Auto Build Complete ===");

    } catch (e) {
        console.error("\nBuild Failed:", e);
        report.status = 'failed';
        report.error = e.message;
    } finally {
        // Save Report
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.writeFileSync(path.join(LOG_DIR, 'daily-report.json'), JSON.stringify(report, null, 2));
    }
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    autoDaily();
}
