/**
 * Frontend Build Script
 * Autodetects factories and builds the site.
 */

const fs = require('fs');
const path = require('path');

const langConfigPath = path.join(__dirname, '../config/language.json');
const langConfig = JSON.parse(fs.readFileSync(langConfigPath, 'utf8'));

// Helper to read file
function readFile(p) {
    return fs.readFileSync(p, 'utf8');
}

// Helper to write file
function writeFile(p, c) {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, c);
    console.log(`Built: ${p}`);
}

// Simple template engine
function render(template, data) {
    let output = template;

    // Handle arrays (simple loop)
    // {{#key}}...{{/key}}
    // This regex matches {{#key}}content{{/key}}
    output = output.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
        const arr = data[key];
        if (Array.isArray(arr)) {
            return arr.map(item => render(content, { ...data, ...item })).join('');
        }
        // Handle boolean/existence check
        if (arr) {
            return render(content, data);
        }
        return '';
    });

    // Handle inverted sections (simple existence check)
    // {{^key}}...{{/key}}
    output = output.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
        if (!data[key]) {
            return render(content, data);
        }
        return '';
    });

    // Handle variables {{key}}
    output = output.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : '';
    });

    return output;
}

async function buildDrama(projectId) {
    const dataDir = path.join(__dirname, '../data/drama', projectId);
    const siteDir = path.join(__dirname, '../sites/drama-site', projectId);

    if (!fs.existsSync(dataDir)) return;

    const metadata = JSON.parse(readFile(path.join(dataDir, 'metadata.json')));
    const outline = JSON.parse(readFile(path.join(dataDir, 'outline.json')));

    // Read Templates
    const indexTemplate = readFile(path.join(__dirname, 'templates/drama/drama-index.html'));
    const episodeTemplate = readFile(path.join(__dirname, 'templates/drama/drama-episode.html'));

    // 1. Build Index
    // We need to gather episode previews
    const episodesDir = path.join(dataDir, 'episodes');
    const episodeFiles = fs.readdirSync(episodesDir).filter(f => f.endsWith('.json'));

    const episodes = episodeFiles.map(f => {
        const ep = JSON.parse(readFile(path.join(episodesDir, f)));
        return {
            id: ep.id,
            title: ep.title,
            preview: ep.content.substring(0, 100) + '...',
            twist: ep.twist
        };
    }).sort((a, b) => a.id - b.id);

    const indexHtml = render(indexTemplate, {
        ...metadata,
        year: new Date().getFullYear(),
        episodes
    });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);

    // 2. Build Episodes
    episodes.forEach((epMeta, index) => {
        const ep = JSON.parse(readFile(path.join(episodesDir, `episode-${epMeta.id}.json`)));
        const prevEpisode = index > 0 ? episodes[index - 1].id : null;
        const nextEpisode = index < episodes.length - 1 ? episodes[index + 1].id : null;

        const epHtml = render(episodeTemplate, {
            ...ep,
            dramaTitle: metadata.title,
            prevEpisode,
            nextEpisode
        });
        writeFile(path.join(siteDir, `episode-${ep.id}.html`), epHtml);
    });
}

async function buildNovel(projectId) {
    const dataDir = path.join(__dirname, '../data/novel', projectId);
    const siteDir = path.join(__dirname, '../sites/novel-site', projectId);

    if (!fs.existsSync(dataDir)) return;

    const metadata = JSON.parse(readFile(path.join(dataDir, 'metadata.json')));

    // Read Templates
    const indexTemplate = readFile(path.join(__dirname, 'templates/novel/novel-index.html'));
    const chapterTemplate = readFile(path.join(__dirname, 'templates/novel/novel-chapter.html'));

    // 1. Build Index
    const chaptersDir = path.join(dataDir, 'chapters');
    const chapterFiles = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.json'));

    const chapters = chapterFiles.map(f => {
        const ch = JSON.parse(readFile(path.join(chaptersDir, f)));
        return {
            id: ch.id,
            title: ch.title,
            wordCount: ch.wordCount
        };
    }).sort((a, b) => a.id - b.id);

    const indexHtml = render(indexTemplate, {
        ...metadata,
        year: new Date().getFullYear(),
        chapters
    });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);

    // 2. Build Chapters
    chapters.forEach((chMeta, index) => {
        const ch = JSON.parse(readFile(path.join(chaptersDir, `chapter-${chMeta.id}.json`)));
        const prevChapter = index > 0 ? chapters[index - 1].id : null;
        const nextChapter = index < chapters.length - 1 ? chapters[index + 1].id : null;

        // Split content into paragraphs for the template
        const contentParagraphs = ch.content.split('\n').filter(p => p.trim().length > 0);
        if (contentParagraphs.length === 1 && ch.content.length > 500) {
            const sentences = ch.content.match(/[^\.!\?]+[\.!\?]+/g) || [ch.content];
            const paragraphs = [];
            let currentPara = "";
            sentences.forEach((s, i) => {
                currentPara += s;
                if ((i + 1) % 5 === 0) {
                    paragraphs.push(currentPara);
                    currentPara = "";
                }
            });
            if (currentPara) paragraphs.push(currentPara);
            if (paragraphs.length > 0) {
                contentParagraphs.length = 0;
                contentParagraphs.push(...paragraphs);
            }
        }

        const chHtml = render(chapterTemplate, {
            ...ch,
            novelTitle: metadata.title,
            contentParagraphs,
            prevLink: prevChapter ? `chapter-${prevChapter}.html` : '#',
            nextLink: nextChapter ? `chapter-${nextChapter}.html` : '#',
            indexLink: 'index.html',
            year: new Date().getFullYear()
        });
        writeFile(path.join(siteDir, `chapter-${ch.id}.html`), chHtml);
    });
}

// --- Comic Build ---
async function buildComic(projectId, lang = langConfig.default) {
    const suffix = lang === langConfig.default ? '' : `-${lang}`;
    const dataDir = path.join(__dirname, `../data/comic/${projectId}${suffix}`);
    const siteDir = path.join(__dirname, `../sites/comic-site${suffix}/${projectId}${suffix}`);

    if (!fs.existsSync(dataDir)) return;

    const metadata = JSON.parse(readFile(path.join(dataDir, 'metadata.json')));
    const storyboard = JSON.parse(readFile(path.join(dataDir, 'storyboard.json')));

    // Read Templates
    const indexTemplate = readFile(path.join(__dirname, 'templates/comic/comic-index.html'));
    const episodeTemplate = readFile(path.join(__dirname, 'templates/comic/comic-episode.html'));

    // 1. Build Index
    const episodes = storyboard.episodes.map(ep => {
        let panelCount = 0;
        ep.scenes.forEach(s => panelCount += s.panels.length);
        return {
            id: ep.id,
            title: ep.title,
            panelCount
        };
    });

    const indexHtml = render(indexTemplate, {
        ...metadata,
        year: new Date().getFullYear(),
        episodes
    });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);

    // 2. Build Episodes
    const imagesDir = path.join(dataDir, 'images');
    const siteImagesDir = path.join(siteDir, 'images');
    if (!fs.existsSync(siteImagesDir)) fs.mkdirSync(siteImagesDir, { recursive: true });

    if (fs.existsSync(imagesDir)) {
        fs.readdirSync(imagesDir).forEach(file => {
            fs.copyFileSync(path.join(imagesDir, file), path.join(siteImagesDir, file));
        });
    }

    storyboard.episodes.forEach((ep, index) => {
        const prevEpisode = index > 0 ? storyboard.episodes[index - 1].id : null;
        const nextEpisode = index < storyboard.episodes.length - 1 ? storyboard.episodes[index + 1].id : null;

        const images = [];
        ep.scenes.forEach(scene => {
            scene.panels.forEach(panel => {
                images.push({
                    id: panel.panelId,
                    src: `images/ep${ep.id}-panel${panel.panelId}.png`
                });
            });
        });

        const epHtml = render(episodeTemplate, {
            ...ep,
            comicTitle: metadata.title,
            images,
            prevLink: prevEpisode ? `episode-${prevEpisode}.html` : '#',
            nextLink: nextEpisode ? `episode-${nextEpisode}.html` : '#',
            indexLink: 'index.html',
            year: new Date().getFullYear()
        });
        writeFile(path.join(siteDir, `episode-${ep.id}.html`), epHtml);
    });
}

// --- IP Pack Build ---
async function buildIpPack(ipId, lang = langConfig.default) {
    const suffix = lang === langConfig.default ? '' : `-${lang}`;
    const dataDir = path.join(__dirname, `../data/ip/${ipId}${suffix}`);
    const siteDir = path.join(__dirname, `../sites/ip-site${suffix}/${ipId}${suffix}`);

    if (!fs.existsSync(dataDir)) return;

    const ipData = JSON.parse(readFile(path.join(dataDir, 'ip.json')));

    const detailTemplate = readFile(path.join(__dirname, 'templates/site/ip-detail.html'));

    let templateContent = detailTemplate;
    if (lang !== langConfig.default) {
        templateContent = templateContent.replace(/novel-site/g, `novel-site-${lang}`);
        templateContent = templateContent.replace(/drama-site/g, `drama-site-${lang}`);
        templateContent = templateContent.replace(/comic-site/g, `comic-site-${lang}`);
    }

    const detailHtml = render(templateContent, {
        ...ipData,
        year: new Date().getFullYear()
    });
    writeFile(path.join(siteDir, 'index.html'), detailHtml);
}

async function buildIpIndex(lang = langConfig.default) {
    const suffix = lang === langConfig.default ? '' : `-${lang}`;
    const dataDir = path.join(__dirname, '../data/ip');
    const siteDir = path.join(__dirname, `../sites/ip-site${suffix}`);

    if (!fs.existsSync(dataDir)) return;

    const projects = fs.readdirSync(dataDir).filter(f => {
        const isDir = fs.statSync(path.join(dataDir, f)).isDirectory();
        if (!isDir) return false;

        const isLangSpecific = langConfig.languages.some(l => f.endsWith(`-${l}`) && l !== langConfig.default);
        if (lang === langConfig.default) {
            return !isLangSpecific;
        } else {
            return f.endsWith(`-${lang}`);
        }
    });

    const ips = projects.map(id => {
        try {
            const ipData = JSON.parse(readFile(path.join(dataDir, id, 'ip.json')));
            return {
                ...ipData,
                idea_preview: ipData.idea.length > 50 ? ipData.idea.substring(0, 50) + '...' : ipData.idea
            };
        } catch (e) {
            return { ipId: id, idea: "Error loading data" };
        }
    });

    const indexTemplate = readFile(path.join(__dirname, 'templates/site/ip-index.html'));

    const indexHtml = render(indexTemplate, {
        ips,
        year: new Date().getFullYear()
    });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);
}

async function build() {
    console.log('Starting build...');

    for (const lang of langConfig.languages) {
        console.log(`--- Building for Language: ${lang} ---`);

        // Drama Build
        const dramaDataDir = path.join(__dirname, '../data/drama');
        if (fs.existsSync(dramaDataDir)) {
            const projects = fs.readdirSync(dramaDataDir).filter(f => {
                const isDir = fs.statSync(path.join(dramaDataDir, f)).isDirectory();
                if (!isDir) return false;
                const isLangSpecific = langConfig.languages.some(l => f.endsWith(`-${l}`) && l !== langConfig.default);
                if (lang === langConfig.default) return !isLangSpecific;
                return f.endsWith(`-${lang}`);
            });

            for (const projectId of projects) {
                let baseId = projectId;
                if (lang !== langConfig.default) {
                    baseId = projectId.replace(`-${lang}`, '');
                }

                console.log(`Building Drama: ${baseId} (${lang})`);
                await buildDrama(baseId, lang);
            }
        }

        // Novel Build
        const novelDataDir = path.join(__dirname, '../data/novel');
        if (fs.existsSync(novelDataDir)) {
            const projects = fs.readdirSync(novelDataDir).filter(f => {
                const isDir = fs.statSync(path.join(novelDataDir, f)).isDirectory();
                if (!isDir) return false;
                const isLangSpecific = langConfig.languages.some(l => f.endsWith(`-${l}`) && l !== langConfig.default);
                if (lang === langConfig.default) return !isLangSpecific;
                return f.endsWith(`-${lang}`);
            });
            for (const projectId of projects) {
                let baseId = projectId;
                if (lang !== langConfig.default) {
                    baseId = projectId.replace(`-${lang}`, '');
                }
                console.log(`Building Novel: ${baseId} (${lang})`);
                await buildNovel(baseId, lang);
            }
        }

        // Comic Build
        const comicDataDir = path.join(__dirname, '../data/comic');
        if (fs.existsSync(comicDataDir)) {
            const projects = fs.readdirSync(comicDataDir).filter(f => {
                const isDir = fs.statSync(path.join(comicDataDir, f)).isDirectory();
                if (!isDir) return false;
                const isLangSpecific = langConfig.languages.some(l => f.endsWith(`-${l}`) && l !== langConfig.default);
                if (lang === langConfig.default) return !isLangSpecific;
                return f.endsWith(`-${lang}`);
            });
            for (const projectId of projects) {
                let baseId = projectId;
                if (lang !== langConfig.default) {
                    baseId = projectId.replace(`-${lang}`, '');
                }
                console.log(`Building Comic: ${baseId} (${lang})`);
                await buildComic(baseId, lang);
            }
        }

        // IP Pack Build
        const ipDataDir = path.join(__dirname, '../data/ip');
        if (fs.existsSync(ipDataDir)) {
            const projects = fs.readdirSync(ipDataDir).filter(f => {
                const isDir = fs.statSync(path.join(ipDataDir, f)).isDirectory();
                if (!isDir) return false;
                const isLangSpecific = langConfig.languages.some(l => f.endsWith(`-${l}`) && l !== langConfig.default);
                if (lang === langConfig.default) return !isLangSpecific;
                return f.endsWith(`-${lang}`);
            });
            for (const ipId of projects) {
                let baseId = ipId;
                if (lang !== langConfig.default) {
                    baseId = ipId.replace(`-${lang}`, '');
                }
                console.log(`Building IP Pack: ${baseId} (${lang})`);
                await buildIpPack(baseId, lang);
            }
            await buildIpIndex(lang);
        }

        // Subscription Build
        console.log(`Building Subscription Site (${lang})...`);
        await buildSubscription(lang);

        // Build Subscription Content
        if (fs.existsSync(path.join(__dirname, '../data/novel'))) {
            const projects = fs.readdirSync(path.join(__dirname, '../data/novel')).filter(f => f.endsWith(lang === langConfig.default ? '' : `-${lang}`) || (lang === langConfig.default && !f.includes('-')));
            for (const p of projects) {
                let baseId = p;
                if (lang !== langConfig.default && p.endsWith(`-${lang}`)) baseId = p.replace(`-${lang}`, '');
                // Actually, the logic above in main loop is a bit complex with baseId.
                // Let's just pass the directory name as projectId for simplicity if my helper handles it?
                // My helper expects projectId and lang.
                // If I pass baseId and lang, it constructs path: ../data/novel/${projectId}${suffix}
                // So I should pass baseId.
                await buildSubscriptionNovel(baseId, lang);
            }
        }
        if (fs.existsSync(path.join(__dirname, '../data/drama'))) {
            const projects = fs.readdirSync(path.join(__dirname, '../data/drama')).filter(f => f.endsWith(lang === langConfig.default ? '' : `-${lang}`) || (lang === langConfig.default && !f.includes('-')));
            for (const p of projects) {
                let baseId = p;
                if (lang !== langConfig.default && p.endsWith(`-${lang}`)) baseId = p.replace(`-${lang}`, '');
                await buildSubscriptionDrama(baseId, lang);
            }
        }
        if (fs.existsSync(path.join(__dirname, '../data/comic'))) {
            const projects = fs.readdirSync(path.join(__dirname, '../data/comic')).filter(f => f.endsWith(lang === langConfig.default ? '' : `-${lang}`) || (lang === langConfig.default && !f.includes('-')));
            for (const p of projects) {
                let baseId = p;
                if (lang !== langConfig.default && p.endsWith(`-${lang}`)) baseId = p.replace(`-${lang}`, '');
                await buildSubscriptionComic(baseId, lang);
            }
        }
    }

    await buildNetwork();
    await buildIpMarket();
    await buildAdmin();
    await buildGameSite();

    console.log('Build complete.');
}

// --- Game Site Build ---
async function buildGameSite() {
    console.log('Building Game Site...');
    const gameDir = path.join(__dirname, '../data/game');
    const siteDir = path.join(__dirname, '../sites/game-site');
    const templateDir = path.join(__dirname, 'templates/game');

    if (!fs.existsSync(gameDir)) return;
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // 1. Game Index
    const games = fs.readdirSync(gameDir).filter(f => fs.statSync(path.join(gameDir, f)).isDirectory()).map(id => {
        try {
            return JSON.parse(readFile(path.join(gameDir, id, 'metadata.json')));
        } catch (e) { return null; }
    }).filter(Boolean);

    const indexTemplate = readFile(path.join(templateDir, 'game-index.html'));
    const indexHtml = render(indexTemplate, { games });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);

    // 2. Game Players
    const ifTemplate = readFile(path.join(templateDir, 'if-player.html'));
    const vnTemplate = readFile(path.join(templateDir, 'vn-player.html'));

    for (const game of games) {
        const pDir = path.join(siteDir, game.gameId);
        if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

        const gDir = path.join(gameDir, game.gameId);
        let playerHtml = "";

        if (game.mode === 'if') {
            const gameData = JSON.parse(readFile(path.join(gDir, 'if.json')));
            // Inject JSON directly into template
            playerHtml = ifTemplate
                .replace('{{title}}', game.title)
                .replace('{{language}}', game.language)
                .replace('{{{gameDataJson}}}', JSON.stringify(gameData));
        } else if (game.mode === 'vn') {
            const gameData = JSON.parse(readFile(path.join(gDir, 'vn.json')));
            const assets = JSON.parse(readFile(path.join(gDir, 'assets.json')));
            playerHtml = vnTemplate
                .replace('{{title}}', game.title)
                .replace('{{language}}', game.language)
                .replace('{{{gameDataJson}}}', JSON.stringify(gameData))
                .replace('{{{assetsJson}}}', JSON.stringify(assets));
        }

        writeFile(path.join(pDir, 'index.html'), playerHtml);
    }

    // 3. Game Exports (HTML5)
    console.log('Building Game Exports (HTML5)...');
    // We can reuse the exporter logic or just copy if already exported by ops-daily.
    // But per instructions "Modify frontend/build.js to Export HTML5 versions".
    // Let's import the exporter and run it.
    const { exportToHTML5 } = await import('../factory/game/exporter-html5.js');

    for (const game of games) {
        const exportDir = await exportToHTML5(game.gameId);
        if (exportDir) {
            const siteExportDir = path.join(__dirname, '../sites/game-export', game.gameId);
            if (!fs.existsSync(siteExportDir)) fs.mkdirSync(siteExportDir, { recursive: true });

            // Copy index.html
            fs.copyFileSync(path.join(exportDir, 'index.html'), path.join(siteExportDir, 'index.html'));

            // Copy assets if any
            const assetsDir = path.join(exportDir, 'assets');
            if (fs.existsSync(assetsDir)) {
                const siteAssetsDir = path.join(siteExportDir, 'assets');
                if (!fs.existsSync(siteAssetsDir)) fs.mkdirSync(siteAssetsDir, { recursive: true });
                fs.readdirSync(assetsDir).forEach(f => {
                    fs.copyFileSync(path.join(assetsDir, f), path.join(siteAssetsDir, f));
                });
            }
        }
    }
}

// --- Admin Build ---
async function buildAdmin() {
    console.log('Building Admin Dashboard...');
    const siteDir = path.join(__dirname, '../sites/admin');
    const templateDir = path.join(__dirname, 'templates/admin');
    const dataRoot = path.join(__dirname, '../data');

    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // 1. Admin Home
    const homeTemplate = readFile(path.join(templateDir, 'home.html'));

    // Gather stats for home
    let subStats = { total_projects: 0 };
    try { subStats = JSON.parse(readFile(path.join(dataRoot, 'subscription/stats.json'))); } catch (e) { }

    let ipStats = { total_ip_count: 0 };
    try {
        const reports = fs.readdirSync(path.join(dataRoot, 'ip-sales')).filter(f => f.endsWith('.json')).sort().reverse();
        if (reports.length > 0) ipStats = JSON.parse(readFile(path.join(dataRoot, 'ip-sales', reports[0])));
    } catch (e) { }

    let distStats = { videos_generated_count: 0 };
    try {
        const reports = fs.readdirSync(path.join(dataRoot, 'distribution')).filter(f => f.startsWith('daily-')).sort().reverse();
        if (reports.length > 0) distStats = JSON.parse(readFile(path.join(dataRoot, 'distribution', reports[0])));
    } catch (e) { }

    const homeHtml = render(homeTemplate, {
        stats: subStats,
        ipStats,
        distStats,
        generatedAt: new Date().toISOString()
    });
    writeFile(path.join(siteDir, 'index.html'), homeHtml);

    // 2. Subscription Dashboard
    const subTemplate = readFile(path.join(templateDir, 'subscription-dashboard.html'));
    const subDir = path.join(siteDir, 'subscription');
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

    let subProjects = [];
    try {
        const config = JSON.parse(readFile(path.join(__dirname, '../config/subscription-projects.json')));
        subProjects = config.active;
    } catch (e) { }

    const subHtml = render(subTemplate, {
        stats: {
            ...subStats,
            by_language_keys: subStats.by_language ? Object.keys(subStats.by_language) : []
        },
        projects: subProjects
    });
    writeFile(path.join(subDir, 'index.html'), subHtml);

    // 3. IP Sales Dashboard
    const ipTemplate = readFile(path.join(templateDir, 'ip-dashboard.html'));
    const ipDir = path.join(siteDir, 'ip');
    if (!fs.existsSync(ipDir)) fs.mkdirSync(ipDir, { recursive: true });

    let ips = [];
    try {
        const ipRoot = path.join(dataRoot, 'ip');
        const marketRoot = path.join(dataRoot, 'ip-market');
        if (fs.existsSync(ipRoot)) {
            ips = fs.readdirSync(ipRoot).filter(f => fs.statSync(path.join(ipRoot, f)).isDirectory()).map(id => {
                try {
                    const meta = JSON.parse(readFile(path.join(ipRoot, id, 'ip.json')));
                    const pitch = JSON.parse(readFile(path.join(marketRoot, id, 'pitch.json')));
                    return {
                        id,
                        title: meta.title,
                        genre: meta.genre,
                        price: pitch.recommended_price
                    };
                } catch (e) { return null; }
            }).filter(Boolean);
        }
    } catch (e) { }

    const ipHtml = render(ipTemplate, {
        latestReport: ipStats,
        ips
    });
    writeFile(path.join(ipDir, 'index.html'), ipHtml);

    // 4. Distribution Dashboard
    const distTemplate = readFile(path.join(templateDir, 'distribution-dashboard.html'));
    const distDir = path.join(siteDir, 'distribution');
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    let manifestCounts = { novel: 0, drama: 0, comic: 0 };
    try {
        const manifest = JSON.parse(readFile(path.join(dataRoot, 'distribution/manifest.json')));
        manifestCounts.novel = Object.keys(manifest.novel || {}).length;
        manifestCounts.drama = Object.keys(manifest.drama || {}).length;
        manifestCounts.comic = Object.keys(manifest.comic || {}).length;
    } catch (e) { }

    const distHtml = render(distTemplate, {
        latestReport: distStats,
        manifestCounts
    });
    writeFile(path.join(distDir, 'index.html'), distHtml);

    // 5. Game Dashboard
    const gameTemplate = readFile(path.join(templateDir, 'game-dashboard.html'));
    const gameDir = path.join(siteDir, 'game');
    if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

    let gameStats = { exported_games: [] };
    try {
        const reports = fs.readdirSync(path.join(dataRoot, 'logs')).filter(f => f.startsWith('ops-game-')).sort().reverse();
        if (reports.length > 0) gameStats = JSON.parse(readFile(path.join(dataRoot, 'logs', reports[0])));
    } catch (e) { }

    let allGames = [];
    let vipCount = 0;
    let html5Count = 0;

    try {
        const gDir = path.join(dataRoot, 'game');
        if (fs.existsSync(gDir)) {
            allGames = fs.readdirSync(gDir).filter(f => fs.statSync(path.join(gDir, f)).isDirectory()).map(id => {
                try {
                    const meta = JSON.parse(readFile(path.join(gDir, id, 'metadata.json')));
                    if (meta.vip_only) vipCount++;
                    // Check if export exists
                    if (fs.existsSync(path.join(gDir, id, 'export/html5/index.html'))) html5Count++;
                    return meta;
                } catch (e) { return null; }
            }).filter(Boolean);
        }
    } catch (e) { }

    const gameHtml = render(gameTemplate, {
        latestReport: gameStats,
        games: allGames,
        vipCount,
        html5Count
    });
    writeFile(path.join(gameDir, 'index.html'), gameHtml);

    // 6. Global Distribution Dashboard
    const distGlobalTemplate = readFile(path.join(templateDir, 'distribution-global.html'));
    const distGlobalDir = path.join(siteDir, 'distribution-global');
    if (!fs.existsSync(distGlobalDir)) fs.mkdirSync(distGlobalDir, { recursive: true });

    let videoCount = 0;
    try {
        const distReport = JSON.parse(readFile(path.join(dataRoot, 'distribution', `daily-${new Date().toISOString().split('T')[0]}.json`)));
        videoCount = distReport.platform_distribution ? distReport.platform_distribution.length : 0;
    } catch (e) { }

    let contentCount = 0;
    try {
        const contentReport = JSON.parse(readFile(path.join(dataRoot, 'logs', `ops-content-distribution-${new Date().toISOString().split('T')[0]}.json`)));
        contentCount = (contentReport.novels ? contentReport.novels.length : 0) + (contentReport.comics ? contentReport.comics.length : 0);
    } catch (e) { }

    const distGlobalHtml = render(distGlobalTemplate, {
        generatedAt: new Date().toISOString(),
        videoCount,
        gameCount: html5Count, // Reusing from game dashboard logic
        contentCount,
        logs: "Logs available in data/logs/"
    });
    writeFile(path.join(distGlobalDir, 'index.html'), distGlobalHtml);

    // 7. Ads Dashboard
    const adsTemplate = readFile(path.join(templateDir, 'ads-dashboard.html'));
    const adsDir = path.join(siteDir, 'ads');
    if (!fs.existsSync(adsDir)) fs.mkdirSync(adsDir, { recursive: true });
    ```
        campaignCount: adsReport.results.campaigns ? adsReport.results.campaigns.length : 0
    });
    writeFile(path.join(adsDir, 'index.html'), adsHtml);
}

// --- Landing Page Build ---
// --- Landing Page Build ---
async function buildLanding() {
    console.log('Building Cinematic Landing Page...');
    const templatePath = path.join(__dirname, 'templates/ip-landing/index.html');
    if (!fs.existsSync(templatePath)) return;

    let template = readFile(templatePath);
    const siteDir = path.join(__dirname, '../sites');
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // Mock Data or Load from Flagship IP
    const flagshipId = 'sample-ip-v5-global';
    let ipData = {
        title: "Global Empire",
        logline: "A story about a global trade empire connecting cultures.",
        stats: { languages: "10", readers: "1M+", adaptations: "3" }
    };

    try {
        const rawIp = JSON.parse(readFile(path.join(__dirname, "../data/ip/" + flagshipId + "/ip.json")));
    ipData.title = rawIp.novelMetadata.title || ipData.title;
    ipData.logline = rawIp.idea || ipData.logline;
} catch (e) { }

// Replacements
const replacements = {
    'ip.title': ipData.title,
    'ip.logline': ipData.logline,
    'ip.heroVideo': '<video autoplay loop muted playsinline class="w-full h-full object-cover opacity-60"><source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4" type="video/mp4"></video>',
    'ip.stats.languages': ipData.stats.languages,
    'ip.stats.readers': ipData.stats.readers,
    'ip.stats.adaptations': ipData.stats.adaptations,
    'novel.cover': '<img src="https://via.placeholder.com/600x900/111/333?text=Novel+Cover" class="w-full h-full object-cover" alt="Novel Cover">',
    'comic.thumbnails': `
            <div class="flex-none w-64 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden snap-center border border-gray-700 hover:border-fuchsia-500 transition"><img src="https://via.placeholder.com/400x600/222/444?text=Panel+1" class="w-full h-full object-cover"></div>
            <div class="flex-none w-64 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden snap-center border border-gray-700 hover:border-fuchsia-500 transition"><img src="https://via.placeholder.com/400x600/222/444?text=Panel+2" class="w-full h-full object-cover"></div>
            <div class="flex-none w-64 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden snap-center border border-gray-700 hover:border-fuchsia-500 transition"><img src="https://via.placeholder.com/400x600/222/444?text=Panel+3" class="w-full h-full object-cover"></div>
        `,
    'drama.episodes': `
            <div class="flex items-center p-4 hover:bg-white/5 transition cursor-pointer group"><div class="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-red-600 transition">▶</div><div class="ml-4"><div class="text-white font-bold group-hover:text-red-400">Episode 1: The Beginning</div><div class="text-xs text-gray-500">24 min</div></div></div>
            <div class="flex items-center p-4 hover:bg-white/5 transition cursor-pointer group"><div class="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-red-600 transition">▶</div><div class="ml-4"><div class="text-white font-bold group-hover:text-red-400">Episode 2: The Conflict</div><div class="text-xs text-gray-500">22 min</div></div></div>
        `,
    'game.iframe': '<div class="absolute inset-0 flex items-center justify-center"><span class="text-gray-600 uppercase tracking-widest text-sm">Game Preview Loading...</span></div>',
    'subscription.price': '$9.99'
};

// Apply replacements
Object.keys(replacements).forEach(key => {
    const regex = new RegExp(`<!-- DATA:${key} -->`, 'g');
    template = template.replace(regex, replacements[key]);
});

writeFile(path.join(siteDir, 'index.html'), template);
}

// --- SEO Build ---
// (Mock implementation as templates were not fully integrated in previous steps)
// In a real scenario, we would iterate data/seo and build pages.

build();
buildLanding();
async function buildSubscription(lang) {
    const siteDir = path.join(__dirname, `../sites/subscription-${lang}`);
    const templateDir = path.join(__dirname, 'templates/subscription');

    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // Build Auth Pages
    ['login.html', 'register.html', 'profile.html', 'vip.html'].forEach(file => {
        if (fs.existsSync(path.join(templateDir, file))) {
            const content = readFile(path.join(templateDir, file));
            writeFile(path.join(siteDir, file), content);
        }
    });

    // Build Homepage
    await buildSubscriptionHome(lang, siteDir);
}

async function buildSubscriptionHome(lang, siteDir) {
    const templatePath = path.join(__dirname, 'templates/subscription/home.html');
    if (!fs.existsSync(templatePath)) return;

    const template = readFile(templatePath);

    // Gather data for homepage
    // Featured: just pick first 3 novels/dramas
    const featured = [];
    const updates = [];
    const popular = [];

    // Helper to scan
    const scan = (type) => {
        const dir = path.join(__dirname, `../data/${type}`);
        if (fs.existsSync(dir)) {
            const projects = fs.readdirSync(dir).filter(f => {
                const isDir = fs.statSync(path.join(dir, f)).isDirectory();
                if (!isDir) return false;
                // Filter by lang if needed, or just take base and assume available
                // For simplicity, we take base projects and check if they have lang variant or if lang is default
                return !f.includes('-'); // Just take base IDs for featured list
            });

            projects.slice(0, 3).forEach(id => {
                try {
                    const meta = JSON.parse(readFile(path.join(dir, id, 'metadata.json')));
                    featured.push({
                        id,
                        title: meta.title,
                        genre: meta.genre,
                        hasNovel: type === 'novel',
                        hasDrama: type === 'drama',
                        hasComic: type === 'comic'
                    });

                    updates.push({
                        type: type,
                        title: meta.title,
                        link: `../${type}/${id}/index.html`, // Simplified link
                        chapter: "New Content",
                        date: new Date().toISOString().split('T')[0]
                    });

                    popular.push({
                        title: meta.title,
                        views: Math.floor(Math.random() * 10000)
                    });
                } catch (e) { }
            });
        }
    };

    scan('novel');
    scan('drama');
    scan('comic');

    const homeDir = path.join(siteDir, 'home');
    if (!fs.existsSync(homeDir)) fs.mkdirSync(homeDir, { recursive: true });

    const html = render(template, {
        lang,
        featured: featured.slice(0, 3),
        updates: updates.slice(0, 5),
        popular: popular.slice(0, 4)
    });

    writeFile(path.join(homeDir, 'index.html'), html);
}

async function buildSubscriptionNovel(projectId, lang) {
    const suffix = lang === langConfig.default ? '' : `-${lang}`;
    const dataDir = path.join(__dirname, `../data/novel/${projectId}${suffix}`);
    const siteDir = path.join(__dirname, `../sites/subscription-${lang}/novel/${projectId}${suffix}`);
    const templateDir = path.join(__dirname, 'templates/subscription');

    if (!fs.existsSync(dataDir)) return;

    const metadata = JSON.parse(readFile(path.join(dataDir, 'metadata.json')));

    // We reuse the main index template for now, or we should have a subscription index?
    // The prompt didn't specify a subscription index, but we need one to navigate.
    // Let's assume we use the main novel index but link to subscription chapters?
    // Or just skip index for now and focus on reader.
    // Actually, let's just build the chapters using novel-reader.html

    const chaptersDir = path.join(dataDir, 'chapters');
    const chapterFiles = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.json'));

    const chapters = chapterFiles.map(f => JSON.parse(readFile(path.join(chaptersDir, f)))).sort((a, b) => a.id - b.id);

    const chapterTemplate = readFile(path.join(templateDir, 'novel-reader.html'));

    chapters.forEach((ch, index) => {
        const prevChapter = index > 0 ? chapters[index - 1].id : null;
        const nextChapter = index < chapters.length - 1 ? chapters[index + 1].id : null;

        // Split content
        const contentParagraphs = ch.content.split('\n').filter(p => p.trim().length > 0);

        const chHtml = render(chapterTemplate, {
            ...ch,
            novelTitle: metadata.title,
            contentParagraphs,
            prevLink: prevChapter ? `chapter-${prevChapter}.html` : '#',
            nextLink: nextChapter ? `chapter-${nextChapter}.html` : '#',
            indexLink: '../../profile.html', // Point back to profile or something
            year: new Date().getFullYear()
        });
        writeFile(path.join(siteDir, `chapter-${ch.id}.html`), chHtml);
    });
}

async function buildSubscriptionDrama(projectId, lang) {
    const suffix = lang === langConfig.default ? '' : `-${lang}`;
    const dataDir = path.join(__dirname, `../data/drama/${projectId}${suffix}`);
    const siteDir = path.join(__dirname, `../sites/subscription-${lang}/drama/${projectId}${suffix}`);
    const templateDir = path.join(__dirname, 'templates/subscription');

    if (!fs.existsSync(dataDir)) return;

    const metadata = JSON.parse(readFile(path.join(dataDir, 'metadata.json')));
    const episodesDir = path.join(dataDir, 'episodes');
    const episodeFiles = fs.readdirSync(episodesDir).filter(f => f.endsWith('.json'));
    const episodes = episodeFiles.map(f => JSON.parse(readFile(path.join(episodesDir, f)))).sort((a, b) => a.id - b.id);

    const episodeTemplate = readFile(path.join(templateDir, 'drama-reader.html'));

    episodes.forEach((ep, index) => {
        const prevEpisode = index > 0 ? episodes[index - 1].id : null;
        const nextEpisode = index < episodes.length - 1 ? episodes[index + 1].id : null;

        const epHtml = render(episodeTemplate, {
            ...ep,
            dramaTitle: metadata.title,
            prevLink: prevEpisode ? `episode-${prevEpisode}.html` : '#',
            nextLink: nextEpisode ? `episode-${nextEpisode}.html` : '#',
            indexLink: '../../profile.html'
        });
        writeFile(path.join(siteDir, `episode-${ep.id}.html`), epHtml);
    });
}

async function buildSubscriptionComic(projectId, lang) {
    const suffix = lang === langConfig.default ? '' : `-${lang}`;
    const dataDir = path.join(__dirname, `../data/comic/${projectId}${suffix}`);
    const siteDir = path.join(__dirname, `../sites/subscription-${lang}/comic/${projectId}${suffix}`);
    const templateDir = path.join(__dirname, 'templates/subscription');

    if (!fs.existsSync(dataDir)) return;

    const metadata = JSON.parse(readFile(path.join(dataDir, 'metadata.json')));
    const storyboard = JSON.parse(readFile(path.join(dataDir, 'storyboard.json')));

    // Copy images?
    // We can link to the main site images to save space, or copy.
    // Linking is better: ../../../../comic-site-{lang}/{projectId}/images/
    // But that depends on relative paths.
    // Let's copy for safety as per "data is source of truth".
    const imagesDir = path.join(dataDir, 'images');
    const siteImagesDir = path.join(siteDir, 'images');
    if (!fs.existsSync(siteImagesDir)) fs.mkdirSync(siteImagesDir, { recursive: true });
    if (fs.existsSync(imagesDir)) {
        fs.readdirSync(imagesDir).forEach(file => {
            fs.copyFileSync(path.join(imagesDir, file), path.join(siteImagesDir, file));
        });
    }

    const episodeTemplate = readFile(path.join(templateDir, 'comic-reader.html'));

    storyboard.episodes.forEach((ep, index) => {
        const prevEpisode = index > 0 ? storyboard.episodes[index - 1].id : null;
        const nextEpisode = index < storyboard.episodes.length - 1 ? storyboard.episodes[index + 1].id : null;

        const images = [];
        ep.scenes.forEach(scene => {
            scene.panels.forEach(panel => {
                images.push({
                    id: panel.panelId,
                    src: `images/ep${ep.id}-panel${panel.panelId}.png`
                });
            });
        });

        const epHtml = render(episodeTemplate, {
            ...ep,
            comicTitle: metadata.title,
            images,
            prevLink: prevEpisode ? `episode-${prevEpisode}.html` : '#',
            nextLink: nextEpisode ? `episode-${nextEpisode}.html` : '#',
            indexLink: '../../profile.html'
        });
        writeFile(path.join(siteDir, `episode-${ep.id}.html`), epHtml);
    });
}

// --- Site Network Build ---
async function buildNetwork() {
    console.log('Building Site Network...');
    const manifestPath = path.join(__dirname, '../data/site-network/manifest.json');
    if (!fs.existsSync(manifestPath)) return;

    const manifest = JSON.parse(readFile(manifestPath));
    const siteDir = path.join(__dirname, '../sites/network');
    const templateDir = path.join(__dirname, 'templates/network');

    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // Global Index
    const indexTemplate = readFile(path.join(templateDir, 'index.html'));
    const novelLangs = Object.keys(manifest.novel).map(l => ({ lang: l, count: manifest.novel[l].length }));
    const dramaLangs = Object.keys(manifest.drama).map(l => ({ lang: l, count: manifest.drama[l].length }));
    const comicLangs = Object.keys(manifest.comic).map(l => ({ lang: l, count: manifest.comic[l].length }));

    const indexHtml = render(indexTemplate, { novelLangs, dramaLangs, comicLangs });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);

    // Type Lists & Details
    const types = ['novel', 'drama', 'comic'];
    const typeTemplate = readFile(path.join(templateDir, 'type-list.html'));
    const detailTemplate = readFile(path.join(templateDir, 'project-detail.html'));

    for (const type of types) {
        for (const lang in manifest[type]) {
            const projects = manifest[type][lang];
            const typeDir = path.join(siteDir, `${type}-${lang}`);
            if (!fs.existsSync(typeDir)) fs.mkdirSync(typeDir, { recursive: true });

            // Type List
            const typeHtml = render(typeTemplate, { type, lang, projects });
            writeFile(path.join(typeDir, 'index.html'), typeHtml);

            // Project Details
            for (const p of projects) {
                const pDir = path.join(typeDir, p.id);
                if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

                // Link to main site
                const siteUrl = `../../${type}-site-${lang}/${p.id}/index.html`;

                const detailHtml = render(detailTemplate, {
                    title: p.title,
                    type,
                    lang,
                    siteUrl
                });
                writeFile(path.join(pDir, 'index.html'), detailHtml);
            }
        }
    }
}

// --- IP Market Build ---
async function buildIpMarket() {
    console.log('Building IP Market...');
    const marketDir = path.join(__dirname, '../data/ip-market');
    const siteDir = path.join(__dirname, '../sites/ip-market');
    const templateDir = path.join(__dirname, 'templates/ip-market');

    if (!fs.existsSync(marketDir)) return;
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    const pitches = fs.readdirSync(marketDir).map(id => {
        try {
            return JSON.parse(readFile(path.join(marketDir, id, 'pitch.json')));
        } catch (e) { return null; }
    }).filter(Boolean);

    // Index (Home)
    const homeTemplate = readFile(path.join(templateDir, 'home.html'));
    const previewTemplate = readFile(path.join(templateDir, 'pitch-preview.html'));

    // Render previews
    const pitchesWithHtml = pitches.map(p => ({
        ...p,
        html: render(previewTemplate, p)
    }));

    const indexHtml = render(homeTemplate, { pitches: pitchesWithHtml });
    writeFile(path.join(siteDir, 'index.html'), indexHtml);

    // Details
    const detailTemplate = readFile(path.join(templateDir, 'pitch-detail.html'));
    pitches.forEach(p => {
        const pDir = path.join(siteDir, p.ipId);
        if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

        const detailHtml = render(detailTemplate, p);
        writeFile(path.join(pDir, 'index.html'), detailHtml);
    });
}
