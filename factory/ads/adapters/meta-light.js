import fs from 'fs';
import path from 'path';

export async function preparePayload(campaign, date) {
    // TODO: Replace with real HTTP calls when ready. Currently mock-only.
    console.log(`[Meta Light] Preparing payload for ${campaign.videoId}`);

    const payload = {
        endpoint: "https://graph.facebook.com/v18.0/act_MOCK_ID/campaigns",
        method: "POST",
        body: {
            name: `IP_Factory_${date}_${campaign.videoId}`,
            daily_budget: campaign.budget_usd * 100, // Cents
            status: "PAUSED",
            special_ad_categories: []
        }
    };

    const outDir = path.join(process.cwd(), 'data/ads/real-payloads/meta');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, `${date}-${campaign.videoId}.json`), JSON.stringify(payload, null, 2));
}
