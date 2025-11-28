import fs from 'fs';
import path from 'path';

export async function simulateAdsResults(plan) {
    console.log(`Simulating Ads Results for ${plan.date}...`);

    const results = {
        date: plan.date,
        campaigns: []
    };

    for (const campaign of plan.campaigns) {
        // Simulate performance based on expectations
        const actual_cpc = campaign.expected_cpc * (0.9 + Math.random() * 0.2); // +/- 10%
        const clicks = Math.floor(campaign.budget_usd / actual_cpc);
        const impressions = Math.floor(clicks / campaign.expected_ctr);

        // Simulate ROAS (Randomized around expected range)
        const roas = campaign.expected_roas_min + (Math.random() * (campaign.expected_roas_max - campaign.expected_roas_min));
        const revenue = campaign.budget_usd * roas;

        results.campaigns.push({
            videoId: campaign.videoId,
            platform: campaign.platform,
            spend_usd: campaign.budget_usd,
            revenue_usd: parseFloat(revenue.toFixed(2)),
            roas: parseFloat(roas.toFixed(2)),
            clicks,
            impressions,
            cpc: parseFloat(actual_cpc.toFixed(2))
        });
    }

    const resultPath = path.join(process.cwd(), 'data/ads/results', `${plan.date}.json`);
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`Ads Results saved: ${resultPath}`);

    return results;
}
