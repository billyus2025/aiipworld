import fs from 'fs';
import path from 'path';

export async function scaleAds(results, config) {
    console.log(`Analyzing Ads for Scaling (Target ROAS: ${config.scale_roas_target})...`);

    const decisions = {
        date: results.date,
        actions: []
    };

    for (const campaign of results.campaigns) {
        let action = "maintain";
        let reason = "stable performance";
        let new_budget = campaign.spend_usd;

        if (campaign.roas >= config.scale_roas_target) {
            action = "scale_up";
            reason = `High ROAS (${campaign.roas})`;
            new_budget = campaign.spend_usd * 1.5;
        } else if (campaign.roas < 1.0) {
            action = "scale_down";
            reason = `Low ROAS (${campaign.roas})`;
            new_budget = campaign.spend_usd * 0.5;
        }

        decisions.actions.push({
            videoId: campaign.videoId,
            platform: campaign.platform,
            current_roas: campaign.roas,
            action,
            reason,
            proposed_budget: parseFloat(new_budget.toFixed(2))
        });
    }

    const decisionPath = path.join(process.cwd(), 'data/ads/decisions', `${results.date}.json`);
    fs.writeFileSync(decisionPath, JSON.stringify(decisions, null, 2));
    console.log(`Ads Decisions saved: ${decisionPath}`);

    return decisions;
}
