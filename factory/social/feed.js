import fs from 'fs';
import path from 'path';

export async function generateFeed(lang) {
    console.log(`Generating Social Feed for ${lang}...`);

    // Mock Feed
    const feed = [
        { id: 1, type: 'video', content: 'New TikTok video out!' },
        { id: 2, type: 'image', content: 'Check out this character art.' }
    ];

    const feedDir = path.join(process.cwd(), 'data/social');
    if (!fs.existsSync(feedDir)) fs.mkdirSync(feedDir, { recursive: true });

    fs.writeFileSync(path.join(feedDir, `feed-${lang}.json`), JSON.stringify(feed, null, 2));
    return feed;
}
