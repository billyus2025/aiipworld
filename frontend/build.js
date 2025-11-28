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
        const regex = new RegExp(`<!-- DATA:${key} -->`, 'g');
        output = output.replace(regex, replacements[key]);
    });
    return output;
}

// --- Builders ---

async function buildLanding() {
    console.log('Building Cinematic Landing Page...');
    const template = readFile(path.join(CONFIG.paths.templates, 'ip-landing/index.html'));
    if (!template) return;

    // Load Data
    const flagshipId = 'sample-ip-v5-global';
    const ipData = readJson(path.join(CONFIG.paths.data, `ip/${flagshipId}/ip.json`)) || {};

    // Load Partials
    const comicThumbTemplate = readFile(path.join(CONFIG.paths.templates, 'partials/landing-comic-thumb.html'));
    const dramaEpTemplate = readFile(path.join(CONFIG.paths.templates, 'partials/landing-drama-episode.html'));

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

    // Replacements
    const replacements = {
        'ip.title': ipData.novelMetadata?.title || "Global Empire",
        'ip.logline': ipData.idea || "A story about a global trade empire connecting cultures.",
        'ip.heroVideo': '<video autoplay loop muted playsinline class="w-full h-full object-cover opacity-60"><source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4" type="video/mp4"></video>',
        'ip.stats.languages': "10",
        'ip.stats.readers': "1M+",
        'ip.stats.adaptations': "3",
        'novel.cover': '<img src="https://via.placeholder.com/600x900/111/333?text=Novel+Cover" class="w-full h-full object-cover" alt="Novel Cover">',
        'comic.thumbnails': comicHtml,
        'drama.episodes': dramaHtml,
        'game.iframe': '<div class="absolute inset-0 flex items-center justify-center"><span class="text-gray-600 uppercase tracking-widest text-sm">Game Preview Loading...</span></div>',
        'subscription.price': '$9.99'
    };

    const html = inject(template, replacements);
    writeFile(path.join(CONFIG.paths.sites, 'index.html'), html);
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
                const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'novel/novel-index.html'));
                if (indexTemplate) {
                    writeFile(path.join(siteDir, 'index.html'), render(indexTemplate, { ...data, year: 2025 }));
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
                                indexLink: 'index.html'
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
                const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'comic/comic-index.html'));
                if (indexTemplate) {
                    writeFile(path.join(siteDir, 'index.html'), render(indexTemplate, { ...data, year: 2025 }));
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
                            indexLink: 'index.html'
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
                const indexTemplate = readFile(path.join(CONFIG.paths.templates, 'drama/drama-index.html'));

                // Episodes
                const epDir = path.join(dramaDir, id, 'episodes');
                let episodes = [];
                if (fs.existsSync(epDir)) {
                    episodes = fs.readdirSync(epDir).map(f => readJson(path.join(epDir, f))).filter(Boolean).sort((a, b) => a.id - b.id);
                }

                if (indexTemplate) {
                    writeFile(path.join(siteDir, 'index.html'), render(indexTemplate, { ...data, episodes, year: 2025 }));
                }

                const epTemplate = readFile(path.join(CONFIG.paths.templates, 'drama/drama-episode.html'));
                if (epTemplate) {
                    episodes.forEach(ep => {
                        writeFile(path.join(siteDir, `episode-${ep.id}.html`), render(epTemplate, {
                            ...ep,
                            dramaTitle: data.title
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
        html = html.replace('{{title}}', game.title).replace('{{language}}', game.language);
        writeFile(path.join(CONFIG.paths.sites, 'game-site', game.gameId, 'index.html'), html);
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
    await buildLanding();
    await buildStandardSites();
    await buildGameSite();
    await buildAdmin();
    console.log('Build Complete.');
}

build();
