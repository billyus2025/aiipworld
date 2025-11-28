const fs = require('fs');
const path = require('path');

function readFile(p) {
    return fs.readFileSync(p, 'utf8');
}

function writeFile(p, c) {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, c);
    console.log(`Built: ${p}`);
}

async function buildLanding() {
    console.log('Building Cinematic Landing Page...');
    const templatePath = path.join(__dirname, 'templates/ip-landing/index.html');
    if (!fs.existsSync(templatePath)) {
        console.log("Template not found: " + templatePath);
        return;
    }

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
        const rawIp = JSON.parse(readFile(path.join(__dirname, `../data/ip/${flagshipId}/ip.json`)));
        ipData.title = rawIp.novelMetadata.title || ipData.title;
        ipData.logline = rawIp.idea || ipData.logline;
    } catch (e) {
        console.log("Failed to load IP data, using mock.");
    }

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

buildLanding();
