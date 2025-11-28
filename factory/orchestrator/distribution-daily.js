import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildVideos } from '../distribution/video-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(process.cwd(), 'data');
const MANIFEST_FILE = path.join(DATA_ROOT, 'distribution/manifest.json');
const REPORT_DIR = path.join(DATA_ROOT, 'distribution');

async function runDistributionDaily() {
    console.log("=== Running Distribution Daily Operations ===");

    // Read manifest to see what we have
    let manifest = { novel: {}, drama: {}, comic: {} };
    if (fs.existsSync(MANIFEST_FILE)) {
        try {
            manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
        } catch (e) { }
    }

    // For this daily op, we'll just ensure videos exist for active projects
    // We can reuse the logic from auto-daily to scan IPs and build videos
    // But let's be more targeted if possible. 
    // For simplicity, we'll scan all IPs and ensure 'en' videos exist.

    const ipDir = path.join(DATA_ROOT, 'ip');
    const generatedVideos = [];

    if (fs.existsSync(ipDir)) {
        const ips = fs.readdirSync(ipDir).filter(f => fs.statSync(path.join(ipDir, f)).isDirectory());

        // Limit to a few for performance in this demo
        const targetIps = ips.slice(0, 5);

        for (const ipId of targetIps) {
            // Check if it's a base IP
            if (!ipId.includes('-') || ipId.endsWith('-zh')) { // Assuming zh is default
                let ipData = {};
                try {
                    ipData = JSON.parse(fs.readFileSync(path.join(ipDir, ipId, 'ip.json'), 'utf8'));
                } catch (e) { continue; }

                const langs = ['en']; // Daily target: English

                if (ipData.novelId) {
                    await buildVideos('novel', ipData.novelId, langs);
                    generatedVideos.push(`${ipData.novelId}-en`);
                }
                if (ipData.dramaId) {
                    await buildVideos('drama', ipData.dramaId, langs);
                    generatedVideos.push(`${ipData.dramaId}-en`);
                }
                if (ipData.comicId) {
                    await buildVideos('comic', ipData.comicId, langs);
                    generatedVideos.push(`${ipData.comicId}-en`);
                }
            }
        }
    }

    const report = {
        date: new Date().toISOString().split('T')[0],
        videos_generated_count: generatedVideos.length,
        generated_projects: generatedVideos,
        generatedAt: new Date().toISOString()
    };

    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportFile = path.join(REPORT_DIR, `daily-${report.date}.json`);
    // 3. Multi-Platform Distribution
    console.log("--- Multi-Platform Distribution ---");
    const { packageVideo } = await import('../distribution/platform-packager.js');
    const platforms = ['tiktok', 'youtube', 'instagram'];
    const uploaders = {
        tiktok: await import('../distribution/uploaders/tiktok.js'),
        youtube: await import('../distribution/uploaders/youtube.js'),
        instagram: await import('../distribution/uploaders/instagram.js')
    };

    const distributionLog = [];

    // Mock: Iterate over generated videos (in real app, scan data/videos)
    // For now, we assume we generated some or use existing
    const videoDir = path.join(process.cwd(), 'data/videos');
    // Simple scan
    if (fs.existsSync(videoDir)) {
        // This is a deep scan, let's just mock one video for demonstration if none found, or scan properly
        // We'll just assume we have a list of "new" videos from step 2 if we were tracking them.
        // Since step 2 is mocked to return 0 videos if already exists, let's just force one "sample" video package

        const sampleVideo = {
            videoId: 'sample-video-1',
            title: 'Sample Video',
            genre: 'Drama',
            link: 'https://example.com'
        };

        for (const platform of platforms) {
            const pkg = await packageVideo('path/to/video.mp4', sampleVideo, platform);
            const result = await uploaders[platform].upload(pkg);
            distributionLog.push({
                platform,
                ...result,
                timestamp: new Date().toISOString()
            });
        }
    }

    report.platform_distribution = distributionLog;

    const today = report.date; // Define 'today' based on report.date
    fs.writeFileSync(
        path.join(process.cwd(), `data/distribution/daily-${today}.json`),
        JSON.stringify(report, null, 2)
    );
    console.log(`Distribution Daily Report saved: ${path.join(process.cwd(), `data/distribution/daily-${today}.json`)}`);
    return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runDistributionDaily();
}

export { runDistributionDaily };
