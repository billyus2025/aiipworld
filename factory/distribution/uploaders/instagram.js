export async function upload(pkg) {
    console.log(`[Instagram] Uploading ${pkg.videoId}...`);
    console.log(`[Instagram] Caption: ${pkg.description}`);
    return { status: 'success', platformId: `ig-${Date.now()}`, url: `https://instagram.com/reel/${Date.now()}` };
}
