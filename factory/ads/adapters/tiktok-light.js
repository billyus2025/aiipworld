import fs from 'fs';
import path from 'path';

export async function preparePayload(campaign, date) {
    // TODO: Replace with real HTTP calls when ready. Currently mock-only.
    console.log(`[TikTok Light] Preparing payload for ${campaign.videoId}`);

    const payload = {
        endpoint: "https://business-api.tiktok.com/open_api/v1.3/campaign/create/",
        method: "POST",
        body: {
            advertiser_id: "MOCK_ADVERTISER_ID",
            campaign_name: `IP_Factory_${date}_${campaign.videoId}`,
            budget: campaign.budget_usd,
            budget_mode: "BUDGET_MODE_DAY"
        }
    };

    const outDir = path.join(process.cwd(), 'data/ads/real-payloads/tiktok');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, `${date}-${campaign.videoId}.json`), JSON.stringify(payload, null, 2));
}
