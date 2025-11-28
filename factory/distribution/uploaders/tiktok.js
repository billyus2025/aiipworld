export async function upload(pkg) {
    console.log(`[TikTok] Uploading ${pkg.videoId}...`);
    console.log(`[TikTok] Title: ${pkg.title}`);
    console.log(`[TikTok] Tags: ${pkg.hashtags.join(' ')}`);
    return { status: 'success', platformId: `tt-${Date.now()}`, url: `https://tiktok.com/@ipfactory/video/${Date.now()}` };
}
