import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(process.cwd(), 'config/subscription-projects.json');
const DATA_ROOT = path.join(process.cwd(), 'data');
const STATS_FILE = path.join(DATA_ROOT, 'subscription/stats.json');

async function runSubscriptionDaily() {
    console.log("=== Running Subscription Daily Operations ===");

    if (!fs.existsSync(CONFIG_FILE)) {
        console.error("Config file not found:", CONFIG_FILE);
        return;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const activeProjects = config.active || [];

    let totalChapters = 0;
    let totalEpisodes = 0;
    const byLanguage = {};

    // Mock generation / scanning
    for (const project of activeProjects) {
        console.log(`Processing ${project.type}/${project.id}...`);

        // In a real scenario, we would call generators here to add content.
        // For now, we scan existing content to update stats.

        const projectDir = path.join(DATA_ROOT, project.type, project.id);
        if (!fs.existsSync(projectDir)) continue;

        if (project.type === 'novel') {
            const chaptersDir = path.join(projectDir, 'chapters');
            if (fs.existsSync(chaptersDir)) {
                const count = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.json')).length;
                totalChapters += count;
            }
        } else if (project.type === 'drama') {
            const episodesDir = path.join(projectDir, 'episodes');
            if (fs.existsSync(episodesDir)) {
                const count = fs.readdirSync(episodesDir).filter(f => f.endsWith('.json')).length;
                totalEpisodes += count;
            }
        } else if (project.type === 'comic') {
            // Comic structure might be different (storyboard.json)
            const storyboardPath = path.join(projectDir, 'storyboard.json');
            if (fs.existsSync(storyboardPath)) {
                try {
                    const sb = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
                    totalEpisodes += sb.episodes ? sb.episodes.length : 0;
                } catch (e) { }
            }
        }

        // Update language stats
        project.langs.forEach(lang => {
            byLanguage[lang] = (byLanguage[lang] || 0) + 1;
        });
    }

    const stats = {
        date: new Date().toISOString().split('T')[0],
        total_projects: activeProjects.length,
        total_chapters: totalChapters,
        total_episodes: totalEpisodes,
        by_language: byLanguage,
        generatedAt: new Date().toISOString()
    };

    const statsDir = path.dirname(STATS_FILE);
    if (!fs.existsSync(statsDir)) fs.mkdirSync(statsDir, { recursive: true });

    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    console.log("Subscription stats updated:", STATS_FILE);

    return stats;
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runSubscriptionDaily();
}

export { runSubscriptionDaily };
