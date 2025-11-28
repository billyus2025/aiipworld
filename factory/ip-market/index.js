import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(process.cwd(), 'data');
const IP_DIR = path.join(DATA_ROOT, 'ip');
const MARKET_DIR = path.join(DATA_ROOT, 'ip-market');

export async function generatePitches() {
    console.log("Generating IP Market Pitches...");

    if (!fs.existsSync(MARKET_DIR)) {
        fs.mkdirSync(MARKET_DIR, { recursive: true });
    }

    if (!fs.existsSync(IP_DIR)) return;

    const ips = fs.readdirSync(IP_DIR).filter(f => {
        return fs.statSync(path.join(IP_DIR, f)).isDirectory();
    });

    for (const ipId of ips) {
        await generatePitch(ipId);
    }
}

async function generatePitch(ipId) {
    const ipPath = path.join(IP_DIR, ipId, 'ip.json');
    if (!fs.existsSync(ipPath)) return;

    const ipData = JSON.parse(fs.readFileSync(ipPath, 'utf8'));

    // Heuristic Price Calculation
    // Base price + (languages * 1000) + (novel chapters * 10) + (drama episodes * 100) + (comic panels * 5)
    // This is just a mock heuristic.

    // We need to find related content to count stats.
    // Assuming standard naming convention or reading from ipData if it has links.
    // ipData usually has novelId, dramaId, comicId.

    let novelCount = 0;
    let dramaCount = 0;
    let comicCount = 0;
    let langCount = 1; // Default to 1 (source)

    // Check languages
    // We can check if there are other folders like ipId-en, ipId-jp etc.
    // Or we can just check the config.
    // Let's check actual folders.
    const siblings = fs.readdirSync(IP_DIR).filter(f => f.startsWith(ipId.split('-')[0])); // Rough check
    // Better: check if ipId is the base, and find variants.
    // Actually, ipId might BE a variant (e.g. sample-ip-en).
    // The market pitch should probably be for the "Core IP" and list available languages.
    // But the prompt says "For each IP in data/ip/ ... Generate a pitch".
    // So if we have sample-ip-en, we generate a pitch for it?
    // Usually you sell the IP as a whole.
    // Let's assume we generate a pitch for every folder for now, or maybe just the base ones?
    // The prompt says "including sample-ip, sample-ip-global".

    // Let's just generate for whatever is there.

    // Calculate Price Score
    let score = 1000;
    // Add logic to increase score based on counts if available
    score += (novelCount * 10) + (dramaCount * 100) + (comicCount * 5);

    // Check for games
    const gameDir = path.join(process.cwd(), 'data/game');
    const games = [];
    if (fs.existsSync(gameDir)) {
        const allGames = fs.readdirSync(gameDir).filter(f => fs.statSync(path.join(gameDir, f)).isDirectory());
        allGames.forEach(gid => {
            try {
                const meta = JSON.parse(fs.readFileSync(path.join(gameDir, gid, 'metadata.json'), 'utf8'));
                if (meta.ipId === ipId || (meta.ipId && meta.ipId.startsWith(ipId))) {
                    games.push({
                        gameId: meta.gameId,
                        mode: meta.mode,
                        language: meta.language,
                        demo_url: `/game-site/${meta.gameId}/index.html`
                    });
                }
            } catch (e) { }
        });
    }

    // V5 Pitch Data Structure
    const pitch = {
        ipId: ipId,
        title: ipData.title || "Untitled IP",
        logline: ipData.idea || "No logline available.",
        genre: ipData.genre || "General",
        score: score,
        analysis: {
            market_potential: "High",
            audience_fit: "Young Adult / General",
            comparables: ["Example A", "Example B"]
        },
        assets: {
            novel_chapters: novelCount,
            drama_episodes: dramaCount,
            comic_panels: comicCount,
            games: games
        },
        recommended_price: {
            domestic: `¥${(score * 10).toLocaleString()}`,
            global: `$${(score * 5).toLocaleString()}`,
            exclusive: `¥${(score * 50).toLocaleString()}`
        },
        assets: {
            novel: ipData.novelId,
            drama: ipData.dramaId,
            comic: ipData.comicId
        },
        generatedAt: new Date().toISOString()
    };

    const pitchDir = path.join(MARKET_DIR, ipId);
    if (!fs.existsSync(pitchDir)) fs.mkdirSync(pitchDir, { recursive: true });

    // Save JSON
    fs.writeFileSync(path.join(pitchDir, 'pitch.json'), JSON.stringify(pitch, null, 2));

    // Mock PDF Generation
    const pdfPath = path.join(pitchDir, 'pitch.pdf');
    fs.writeFileSync(pdfPath, `%PDF-1.4\n%Mock PDF for ${ipId}\n1 0 obj\n<< /Title (${ipData.title}) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`);

    console.log(`Pitch generated for ${ipId} (JSON + PDF)`);
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generatePitches();
}
