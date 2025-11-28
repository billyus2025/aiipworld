import fs from 'fs';
import path from 'path';

export async function preparePayload(campaign, date) {
    // TODO: Replace with real HTTP calls when ready. Currently mock-only.
    console.log(`[Google Light] Preparing payload for ${campaign.videoId}`);

    const payload = {
        endpoint: "https://googleads.googleapis.com/v14/customers/MOCK_ID/campaigns:mutate",
        method: "POST",
        body: {
            operations: [{
                create: {
                    name: `IP_Factory_${date}_${campaign.videoId}`,
                    status: "PAUSED",
                    advertising_channel_type: "VIDEO",
                    campaign_budget: `customers/MOCK_ID/campaignBudgets/${campaign.budget_usd}`
                }
            }]
        }
    };

    const outDir = path.join(process.cwd(), 'data/ads/real-payloads/google');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, `${date}-${campaign.videoId}.json`), JSON.stringify(payload, null, 2));
}
