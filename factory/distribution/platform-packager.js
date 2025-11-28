import fs from 'fs';
import path from 'path';

export async function packageVideo(videoPath, metadata, platform) {
    // Mock packaging logic
    // In real app: generate title/desc/tags using LLM based on platform constraints

    const packageDir = path.join(process.cwd(), 'data/distribution/publish', platform, new Date().toISOString().split('T')[0], metadata.videoId);
    if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

    const pkg = {
        platform,
        videoId: metadata.videoId,
        title: generateTitle(metadata, platform),
        description: generateDescription(metadata, platform),
        hashtags: generateHashtags(metadata, platform),
        videoPath: videoPath, // In real app, might copy or re-encode
        coverPath: "cover.png", // Mock
        scheduledTime: new Date(Date.now() + 3600000).toISOString() // +1 hour
    };

    fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(pkg, null, 2));
    return pkg;
}

function generateTitle(meta, platform) {
    if (platform === 'tiktok') return `🔥 ${meta.title} #shorts`;
    if (platform === 'youtube') return `${meta.title} - Official Short`;
    return meta.title;
}

function generateDescription(meta, platform) {
    return `Watch the full story on our site! ${meta.link || 'Link in bio'}`;
}

function generateHashtags(meta, platform) {
    return ["#fyp", "#story", "#" + meta.genre];
}
