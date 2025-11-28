import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateManifest } from '../site-network/index.js';
import { generatePitches } from '../ip-market/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function buildAll() {
    console.log("=== Starting Global Build (V5.0) ===");

    try {
        // We can just reuse the auto-daily script logic or call it.
        // For simplicity, let's call the auto-daily script as a child process 
        // or import it if we refactored. 
        // But since I just created it as a standalone module that runs on execution if main,
        // I can just spawn it.

        const autoDailyScript = path.join(__dirname, 'auto-daily.js');
        await runCommand('node', [autoDailyScript]);

        console.log("\n=== Global Build Complete ===");
    } catch (e) {
        console.error("\nBuild Failed:", e);
        process.exit(1);
    }
}

buildAll();
