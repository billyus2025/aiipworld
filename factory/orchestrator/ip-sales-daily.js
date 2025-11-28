import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { generatePitches } from '../ip-market/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(process.cwd(), 'config/ip-sales.json');
const DATA_ROOT = path.join(process.cwd(), 'data');
const REPORT_DIR = path.join(DATA_ROOT, 'ip-sales');

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

async function runIpSalesDaily() {
    console.log("=== Running IP Sales Daily Operations ===");

    if (!fs.existsSync(CONFIG_FILE)) {
        console.error("Config file not found:", CONFIG_FILE);
        return;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const newIpCount = config.daily_new_ip_count || 1;
    const createdIps = [];

    // 1. Generate New IPs
    const ipPackScript = path.join(process.cwd(), 'factory/ip-pack/index.js');
    for (let i = 0; i < newIpCount; i++) {
        const timestamp = Date.now();
        const ipName = `daily-ip-${timestamp}`;
        const idea = `A new daily IP concept generated at ${new Date().toISOString()}`;

        try {
            await runCommand('node', [ipPackScript, ipName, `"${idea}"`]);
            createdIps.push(ipName);
        } catch (e) {
            console.error(`Failed to generate IP ${ipName}:`, e);
        }
    }

    // 2. Regenerate Pitches
    await generatePitches();

    // 3. Write Daily Summary
    const ipDir = path.join(DATA_ROOT, 'ip');
    const totalIps = fs.existsSync(ipDir) ? fs.readdirSync(ipDir).filter(f => fs.statSync(path.join(ipDir, f)).isDirectory()).length : 0;

    const report = {
        date: new Date().toISOString().split('T')[0],
        new_ip_created: createdIps,
        total_ip_count: totalIps,
        top_recommended: createdIps, // Simple mock recommendation
        generatedAt: new Date().toISOString()
    };

    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportFile = path.join(REPORT_DIR, `daily-${report.date}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log("IP Sales Daily Report saved:", reportFile);
    return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runIpSalesDaily();
}

export { runIpSalesDaily };
