import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSubscriptionDaily } from './subscription-daily.js';
import { runIpSalesDaily } from './ip-sales-daily.js';
import { runDistributionDaily } from './distribution-daily.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(process.cwd(), 'data/logs');

async function runOpsDaily() {
    console.log("=== STARTING GLOBAL OPERATIONS ENGINE (V6.0) ===");
    const startTime = Date.now();

    try {
        const subReport = await runSubscriptionDaily();
        const ipReport = await runIpSalesDaily();
        const distReport = await runDistributionDaily();

        const today = new Date().toISOString().split('T')[0];

        // 4. Game Operations (HTML5 Export)
        console.log("\n=== Running Game Daily Operations ===");
        const gameReport = {
            date: today,
            exported_games: [],
            generatedAt: new Date().toISOString()
        };

        // Scan for active games and export them
        const { exportToHTML5 } = await import('../game/exporter-html5.js');
        const gameDir = path.join(process.cwd(), 'data/game');
        if (fs.existsSync(gameDir)) {
            const games = fs.readdirSync(gameDir).filter(f => fs.statSync(path.join(gameDir, f)).isDirectory());
            for (const gid of games) {
                // In a real scenario, we might filter by "active" or "updated today"
                // For now, we export all to ensure latest version
                try {
                    const exportPath = await exportToHTML5(gid);
                    if (exportPath) {
                        gameReport.exported_games.push(gid);

                        // 4.1 Platform Packaging
                        const { packageGame } = await import('../game/exporter-platform.js');
                        const platforms = ['itch', 'crazygames', 'yandex'];
                        for (const p of platforms) {
                            await packageGame(gid, p);
                        }
                    }
                } catch (e) {
                    console.error(`Failed to export game ${gid}:`, e);
                }
            }
        }

        fs.writeFileSync(
            path.join(process.cwd(), 'data/logs', `ops-game-${today}.json`),
            JSON.stringify(gameReport, null, 2)
        );
        console.log(`Game Daily Report saved: ${path.join(process.cwd(), 'data/logs', `ops-game-${today}.json`)}`);

        // 5. Content Distribution (Novel/Comic)
        console.log("\n=== Running Content Distribution Operations ===");
        const contentReport = { date: today, novels: [], comics: [] };

        const { exportNovel } = await import('../novel/exporter-platform.js');
        const { exportComic } = await import('../comic/exporter-platform.js');

        const novelPlatforms = ['webnovel', 'wattpad', 'royalroad'];
        const comicPlatforms = ['webtoon', 'tapas', 'bilibili'];

        // Scan Novels
        const novelDir = path.join(process.cwd(), 'data/novel');
        if (fs.existsSync(novelDir)) {
            const novels = fs.readdirSync(novelDir).filter(f => fs.statSync(path.join(novelDir, f)).isDirectory());
            for (const nid of novels) {
                for (const p of novelPlatforms) {
                    await exportNovel(nid, p);
                }
                contentReport.novels.push(nid);
            }
        }

        // Scan Comics
        const comicDir = path.join(process.cwd(), 'data/comic');
        if (fs.existsSync(comicDir)) {
            const comics = fs.readdirSync(comicDir).filter(f => fs.statSync(path.join(comicDir, f)).isDirectory());
            for (const cid of comics) {
                for (const p of comicPlatforms) {
                    await exportComic(cid, p);
                }
                contentReport.comics.push(cid);
            }
        }

        fs.writeFileSync(
            path.join(process.cwd(), 'data/logs', `ops-content-distribution-${today}.json`),
            JSON.stringify(contentReport, null, 2)
        );

        // 6. SEO & Social Operations
        console.log("\n=== Running SEO & Social Operations ===");
        const { generateSitemaps } = await import('../seo/sitemap.js');
        await generateSitemaps();

        const { generateFeed } = await import('../social/feed.js');
        // Mock Langs
        await generateFeed('en');
        await generateFeed('zh');

        // 7. Auto Ads & Traffic
        console.log("\n=== Running Auto Ads & Traffic Operations ===");
        const { runAdsDaily } = await import('./ads-daily.js');
        const adsReport = await runAdsDaily();

        // Combine Reports
        const combinedReport = {
            date: today,
            subscription: subReport,
            ip_sales: ipReport,
            distribution: distReport,
            game: gameReport,
            content: contentReport,
            ads: {
                mode: adsReport.config.mode,
                platforms: adsReport.config.platforms,
                total_planned_spend_usd: adsReport.plan.campaigns.reduce((sum, c) => sum + c.budget_usd, 0),
                simulated_roas: adsReport.results.campaigns.length > 0
                    ? (adsReport.results.campaigns.reduce((sum, c) => sum + c.revenue_usd, 0) / adsReport.results.campaigns.reduce((sum, c) => sum + c.spend_usd, 0)).toFixed(2)
                    : 0
            },
            duration_ms: Date.now() - startTime,
            generatedAt: new Date().toISOString()
        };

        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
        const reportFile = path.join(LOG_DIR, `ops-daily-${combinedReport.date}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(combinedReport, null, 2));

        console.log("\n=== GLOBAL OPERATIONS COMPLETE ===");
        console.log(`Report saved to: ${reportFile}`);

    } catch (e) {
        console.error("Global Operations Failed:", e);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runOpsDaily();
}
