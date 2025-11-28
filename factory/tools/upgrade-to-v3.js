import fs from 'fs';
import path from 'path';
import { runV3Pipeline } from '../ip-pack/v3-pipeline.js';

const IP_DIR = path.join(process.cwd(), 'data/ip');

async function upgradeAll() {
    if (!fs.existsSync(IP_DIR)) {
        console.log("No IPs found to upgrade.");
        return;
    }

    const ips = fs.readdirSync(IP_DIR).filter(f => fs.statSync(path.join(IP_DIR, f)).isDirectory());

    console.log(`Found ${ips.length} IPs to upgrade to V3...`);

    for (const ipId of ips) {
        try {
            const ipJsonPath = path.join(IP_DIR, ipId, 'ip.json');
            let context = {};
            if (fs.existsSync(ipJsonPath)) {
                const oldData = JSON.parse(fs.readFileSync(ipJsonPath, 'utf8'));
                // Map old data to context
                context = {
                    title: oldData.novelMetadata?.title || oldData.idea,
                    idea: oldData.idea,
                    logline: oldData.idea,
                    synopsis: oldData.novelMetadata?.description || oldData.idea,
                    genre: oldData.genre,
                    language: oldData.language,
                    tags: oldData.novelMetadata?.tags || []
                };
            }

            await runV3Pipeline(ipId, context);
        } catch (e) {
            console.error(`Failed to upgrade ${ipId}:`, e);
        }
    }
}

upgradeAll();
