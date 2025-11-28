const fs = require('fs');
const path = require('path');

// --- Configuration ---
const CONFIG = {
    lang: require('../config/language.json'),
    paths: {
        data: path.join(__dirname, '../data'),
        sites: path.join(__dirname, '../sites'),
        templates: path.join(__dirname, 'templates')
    }
};

// --- Helpers ---
function readFile(p) {
    try {
        return fs.readFileSync(p, 'utf8');
    } catch (e) {
        console.warn(`Warning: File not found: ${p}`);
        return null;
    }
}

function writeFile(p, content) {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, content);
    console.log(`Built: ${p}`);
}

function readJson(p) {
    const content = readFile(p);
    return content ? JSON.parse(content) : null;
}

// Mustache-style renderer
function render(template, data) {
    if (!template) return '';
    let output = template;

    // Arrays: {{#key}}...{{/key}}
    output = output.replace(/\{\{#(\w+)\}\}([\s\S]*?)\\{\\{\/\1\}\}/g, (match, key, content) => {
        const arr = data[key];
        if (Array.isArray(arr)) {
            return arr.map(item => render(content, { ...data, ...item })).join('');
        }
        return arr ? render(content, data) : '';
    });

    // Inverted: {{^key}}...{{/key}}
    output = output.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\\{\\{\/\1\}\}/g, (match, key, content) => {
        return !data[key] ? render(content, data) : '';
    });

    // Variables: {{key}}
    output = output.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : '';
    });

    return output;
}

// Comment-style injector for Landing Page
function inject(template, replacements) {
    let output = template;
    Object.keys(replacements).forEach(key => {
        // Use a function replacement to avoid issues with special characters in replacement string
        // Escape special regex characters in key if necessary (not needed for simple alphanumeric keys)
        const regex = new RegExp(`<!-- DATA:${key} -->`, 'g');
        output = output.replace(regex, () => replacements[key]);
    });
    return output;
}

// --- Builders ---

async function buildIpSites() {
    console.log('Building IP Landing Pages...');
    const ipDir = path.join(CONFIG.paths.data, 'ip');
    if (!fs.existsSync(ipDir)) {
        console.log('No IP data found.');
        return;
    }

    const template = readFile(path.join(CONFIG.paths.templates, 'ip-landing/index.html'));
    if (!template) return;

    // Load Partials
    const comicThumbTemplate = readFile(path.join(CONFIG.paths.templates, 'partials/landing-comic-thumb.html'));
    const dramaEpTemplate = readFile(path.join(CONFIG.paths.templates, 'partials/landing-drama-episode.html'));

    const ips = fs.readdirSync(ipDir).filter(f => fs.statSync(path.join(ipDir, f)).isDirectory());

    // Collect IPs for the main index
    const generatedIps = [];

    for (const ipId of ips) {
        const ipDataPath = path.join(ipDir, ipId, 'ip.json');
        const ipData = readJson(ipDataPath);
        if (!ipData) continue;

        console.log(`Processing IP: ${ipId}`);

        // Determine language suffix for links
        const lang = ipData.language || 'en'; // Default to en if missing, though init script sets it
        const suffix = lang === CONFIG.lang.default ? '' : `-${lang}`;

        // Generate Dynamic Content
        const comicHtml = [1, 2, 3].map(i => render(comicThumbTemplate, {
            id: i,
            src: `https://via.placeholder.com/400x600/222/444?text=Panel+${i}`
        })).join('');

        const dramaHtml = [
            { title: "Episode 1: The Beginning", duration: "24 min" },
            { title: "Episode 2: The Conflict", duration: "22 min" },
            { title: "Episode 3: The Climax", duration: "25 min" }
        ].map(ep => render(dramaEpTemplate, ep)).join('');

        // Construct Links (Absolute Paths)
        const novelUrl = ipData.novelId ? `/novel-site${suffix}/${ipData.novelId}/index.html` : '#';
        const comicUrl = ipData.comicId ? `/comic-site${suffix}/${ipData.comicId}/index.html` : '#';
        const dramaUrl = ipData.dramaId ? `/drama-site${suffix}/${ipData.dramaId}/index.html` : '#';
        // Game link: pick the first game if available, or generic game site
        let gameUrl = '#';
        if (ipData.games && ipData.games.length > 0) {
            const g = ipData.games[0];
            // Game site structure: sites/game-site/{gameId}/index.html
            gameUrl = `/game-site/${g.gameId}/index.html`;
        }

        // Replacements
        const replacements = {
            'ip.title': ipData.novelMetadata?.title || ipData.idea || "Untitled IP",
            'ip.logline': ipData.idea || "A story about a global trade empire connecting cultures.",
            'ip.heroVideo': `<video autoplay loop muted playsinline class="w-full h-full object-cover opacity-60"><source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4" type="video/mp4"></video>`,
            'ip.stats.languages': "10",
            'ip.stats.readers': "1M+",
            'ip.stats.adaptations': "3",
            'novel.cover': `<img src="https://via.placeholder.com/600x900/111/333?text=Novel+Cover" class="w-full h-full object-cover" alt="Novel Cover">`,
            'comic.thumbnails': comicHtml,
            'drama.episodes': dramaHtml,
            'game.iframe': `<div class="absolute inset-0 flex items-center justify-center"><span class="text-gray-600 uppercase tracking-widest text-sm">Game Preview Loading...</span></div>`,
            'subscription.price': '$9.99',
            'novel.url': novelUrl,
            'comic.url': comicUrl,
            'drama.url': dramaUrl,
            'game.url': gameUrl
        };

        const html = inject(template, replacements);

        // Write to sites/ip-site/{ipId}/index.html
        writeFile(path.join(CONFIG.paths.sites, 'ip-site', ipId, 'index.html'), html);

        generatedIps.push({ id: ipId, title: replacements['ip.title'], lang });
    }

    // Build Main Index (sites/index.html)
    // Simple list of all IPs
    const mainIndexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>IP Mother Factory - Global Universe</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen p-10">
    <h1 class="text-4xl font-bold mb-8 text-center text-cyan-400">IP Mother Factory Universe</h1>
    <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        ${generatedIps.map(ip => `
            <a href="/ip-site/${ip.id}/index.html" class="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 transition">
                <h2 class="text-xl font-bold mb-2">${ip.title}</h2>
                <span class="text-xs uppercase tracking-widest text-gray-500">${ip.lang}</span>
                <span class="text-xs text-cyan-500 float-right">View IP &rarr;</span>
            </a>
        `).join('')}
    </div>
    <footer class="mt-12 text-center text-gray-600 text-sm">
        Generated by IP Mother Factory V3.0
    </footer>
</body>
</html>`;
    writeFile(path.join(CONFIG.paths.sites, 'index.html'), mainIndexContent);
}

async function buildStandardSites() {
    console.log('Building Standard Sites...');

    for (const lang of CONFIG.lang.languages) {
        const suffix = lang === CONFIG.lang.default ? '' : `-${lang}`;

        // 1. Novels
        const novelDir = path.join(CONFIG.paths.data, 'novel');
        if (fs.existsSync(novelDir)) {
            const novels = fs.readdirSync(novelDir).filter(f => f.endsWith(suffix) || (!suffix && !f.includes('-')));
            for (const id of novels) {
                const data = readJson(path.join(novelDir, id, 'metadata.json'));
                if (!data) continue;

                const siteDir = path.join(CONFIG.paths.sites, `novel-site${suffix}`, id);
                const homeUrl = `/novel-site${suffix}/${id}/index.html`;
                const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'novel/novel-index.html'));
                if (indexTemplate) {
                    writeFile(path.join(siteDir, 'index.html'), render(indexTemplate, { ...data, year: 2025, homeUrl }));
                }

                // Chapters
                const chapterTemplate = readFile(path.join(CONFIG.paths.templates, 'novel/novel-chapter.html'));
                const chaptersDir = path.join(novelDir, id, 'chapters');
                if (chapterTemplate && fs.existsSync(chaptersDir)) {
                    fs.readdirSync(chaptersDir).forEach(chFile => {
                        const chData = readJson(path.join(chaptersDir, chFile));
                        if (chData) {
                            writeFile(path.join(siteDir, `chapter-${chData.id}.html`), render(chapterTemplate, {
                                ...chData,
                                novelTitle: data.title,
                                contentParagraphs: chData.content.split('\n'),
                                indexLink: homeUrl,
                                homeUrl: homeUrl
                            }));
                        }
                    });
                }
            }
        }

        // 2. Comics
        const comicDir = path.join(CONFIG.paths.data, 'comic');
        if (fs.existsSync(comicDir)) {
            const comics = fs.readdirSync(comicDir).filter(f => f.endsWith(suffix) || (!suffix && !f.includes('-')));
            for (const id of comics) {
                const data = readJson(path.join(comicDir, id, 'metadata.json'));
                if (!data) continue;

                const siteDir = path.join(CONFIG.paths.sites, `comic-site${suffix}`, id);
                const homeUrl = `/comic-site${suffix}/${id}/index.html`;
                const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'comic/comic-index.html'));
                if (indexTemplate) {
                    writeFile(path.join(siteDir, 'index.html'), render(indexTemplate, { ...data, year: 2025, homeUrl }));
                }

                // Episodes
                const epTemplate = readFile(path.join(CONFIG.paths.templates, 'comic/comic-episode.html'));
                const sbData = readJson(path.join(comicDir, id, 'storyboard.json'));
                if (epTemplate && sbData) {
                    sbData.episodes.forEach(ep => {
                        writeFile(path.join(siteDir, `episode-${ep.id}.html`), render(epTemplate, {
                            ...ep,
                            comicTitle: data.title,
                            images: (ep.panels || []).map(p => ({ src: `images/ep${ep.id}-panel${p.panelId}.png` })),
                            indexLink: homeUrl,
                            homeUrl: homeUrl
                        }));
                    });
                }
            }
        }

        // 3. Dramas
        const dramaDir = path.join(CONFIG.paths.data, 'drama');
        if (fs.existsSync(dramaDir)) {
            const dramas = fs.readdirSync(dramaDir).filter(f => f.endsWith(suffix) || (!suffix && !f.includes('-')));
            for (const id of dramas) {
                const data = readJson(path.join(dramaDir, id, 'metadata.json'));
                if (!data) continue;

                const siteDir = path.join(CONFIG.paths.sites, `drama-site${suffix}`, id);
                const homeUrl = `/drama-site${suffix}/${id}/index.html`;
                const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'drama/drama-index.html'));

                // Episodes
                const epDir = path.join(dramaDir, id, 'episodes');
                let episodes = [];
                if (fs.existsSync(epDir)) {
                    episodes = fs.readdirSync(epDir).map(f => readJson(path.join(epDir, f))).filter(Boolean).sort((a, b) => a.id - b.id);
                }

                if (indexTemplate) {
                    writeFile(path.join(siteDir, 'index.html'), render(indexTemplate, { ...data, episodes, year: 2025, homeUrl }));
                }

                const epTemplate = readFile(path.join(CONFIG.paths.templates, 'drama/drama-episode.html'));
                if (epTemplate) {
                    episodes.forEach(ep => {
                        writeFile(path.join(siteDir, `episode-${ep.id}.html`), render(epTemplate, {
                            ...ep,
                            dramaTitle: data.title,
                            indexLink: homeUrl,
                            homeUrl: homeUrl
                        }));
                    });
                }
            }
        }
    }
}

async function buildGameSite() {
    console.log('Building Game Site...');
    const gameDir = path.join(CONFIG.paths.data, 'game');
    if (!fs.existsSync(gameDir)) return;

    const games = fs.readdirSync(gameDir).map(id => readJson(path.join(gameDir, id, 'metadata.json'))).filter(Boolean);
    const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'game/game-index.html'));

    if (indexTemplate) {
        writeFile(path.join(CONFIG.paths.sites, 'game-site/index.html'), render(indexTemplate, { games }));
    }

    // Players
    const ifTemplate = readFile(path.join(CONFIG.paths.templates, 'game/if-player.html'));
    const vnTemplate = readFile(path.join(CONFIG.paths.templates, 'game/vn-player.html'));

    games.forEach(game => {
        const gDir = path.join(gameDir, game.gameId);
        let html = '';
        if (game.mode === 'if' && ifTemplate) {
            const data = readJson(path.join(gDir, 'if.json'));
            html = ifTemplate.replace('{{{gameDataJson}}}', JSON.stringify(data));
        } else if (game.mode === 'vn' && vnTemplate) {
            const data = readJson(path.join(gDir, 'vn.json'));
            const assets = readJson(path.join(gDir, 'assets.json'));
            html = vnTemplate.replace('{{{gameDataJson}}}', JSON.stringify(data)).replace('{{{assetsJson}}}', JSON.stringify(assets));
        }

        // Basic replacements for title/lang
        if (html) {
            html = html.replace('{{title}}', game.title).replace('{{language}}', game.language);
            writeFile(path.join(CONFIG.paths.sites, 'game-site', game.gameId, 'index.html'), html);
        }
    });
}

async function buildAdmin() {
    console.log('Building Admin...');
    const adminDir = path.join(CONFIG.paths.sites, 'admin');

    // Ads Dashboard
    const adsTemplate = readFile(path.join(CONFIG.paths.templates, 'admin/ads-dashboard.html'));
    if (adsTemplate) {
        // Find latest report
        const logsDir = path.join(CONFIG.paths.data, 'logs');
        let adsReport = { config: {}, results: { campaigns: [] } };
        if (fs.existsSync(logsDir)) {
            const logs = fs.readdirSync(logsDir).filter(f => f.startsWith('ops-ads-')).sort().reverse();
            if (logs.length > 0) adsReport = readJson(path.join(logsDir, logs[0])) || adsReport;
        }

        // Calculate stats
        let totalSpend = 0, totalRevenue = 0;
        adsReport.results?.campaigns?.forEach(c => { totalSpend += c.spend_usd; totalRevenue += c.revenue_usd; });
        const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";

        const html = render(adsTemplate, {
            config: adsReport.config,
            results: adsReport.results,
            decisions: adsReport.decisions,
            totalSpend: totalSpend.toFixed(2),
            totalRevenue: totalRevenue.toFixed(2),
            avgRoas,
            highRoas: parseFloat(avgRoas) >= (adsReport.config?.scale_roas_target || 1.5),
            campaignCount: adsReport.results?.campaigns?.length || 0
        });
        writeFile(path.join(adminDir, 'ads/index.html'), html);
    }

    // Global Distribution Dashboard
    const distTemplate = readFile(path.join(CONFIG.paths.templates, 'admin/distribution-global.html'));
    if (distTemplate) {
        writeFile(path.join(adminDir, 'distribution-global/index.html'), render(distTemplate, {
            generatedAt: new Date().toISOString(),
            videoCount: 10, // Mock
            gameCount: 5,
            contentCount: 20,
            logs: "Logs available in data/logs/"
        }));
    }
}

async function build() {
    await buildIpSites();
    await buildStandardSites();
    await buildGameSite();
    await buildAdmin();
    console.log('Build Complete.');
}

build();
