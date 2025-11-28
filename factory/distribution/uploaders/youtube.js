export async function upload(pkg) {
    console.log(`[YouTube] Uploading ${pkg.videoId}...`);
    console.log(`[YouTube] Title: ${pkg.title}`);
    return { status: 'success', platformId: `yt-${Date.now()}`, url: `https://youtube.com/shorts/${Date.now()}` };
}
