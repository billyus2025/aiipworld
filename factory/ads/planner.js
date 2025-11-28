import fs from 'fs';
import path from 'path';

export async function generateAdsPlan(date, config) {
    console.log(`Generating Ads Plan for ${date} (Mode: ${config.mode})...`);

    const plan = {
        date,
        mode: config.mode,
        campaigns: []
    };

    // 1. Scan for recent video packages to promote
    // In a real scenario, we'd scan data/distribution/publish
    // For now, we'll mock finding a few recent videos or use existing ones
    const videoCandidates = [
        { videoId: 'sample-video-1', platform: 'tiktok', genre: 'Drama' },
        { videoId: 'sample-video-2', platform: 'youtube', genre: 'Romance' } // mapped to google
    ];

    // 2. Generate Plan for each platform in config
    for (const platform of config.platforms) {
        // Filter videos suitable for this platform
        // (Simple mapping: tiktok->tiktok, meta->instagram/facebook, google->youtube)

        const budgetPerPlatform = config.daily_budget_usd / config.platforms.length;

        for (const video of videoCandidates) {
            // Skip if platform mismatch (rough logic)
            if (platform === 'tiktok' && video.platform !== 'tiktok') continue;
            if (platform === 'google' && video.platform !== 'youtube') continue;
            // Meta takes everything for demo

            const campaign = {
                videoId: video.videoId,
                platform: platform,
                budget_usd: parseFloat((budgetPerPlatform / videoCandidates.length).toFixed(2)), // Split budget
                countries: ["US", "CA", "UK"],
                age: "18-34",
                interests: [video.genre, "Entertainment", "Stories"],
                expected_ctr: 0.02 + (Math.random() * 0.03), // 2-5%
                expected_cpc: 0.5 + (Math.random() * 0.5),   // $0.50-$1.00
                expected_roas_min: 1.0,
                expected_roas_max: 3.0
            };

            // Adjust budget if too low
            if (campaign.budget_usd < 1) campaign.budget_usd = 1;

            plan.campaigns.push(campaign);
        }
    }

    const planPath = path.join(process.cwd(), 'data/ads/plans', `${date}.json`);
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    console.log(`Ads Plan saved: ${planPath}`);

    return plan;
}
