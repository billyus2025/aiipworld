import fs from 'fs';
import path from 'path';
import { generateAdsPlan } from '../ads/planner.js';
import { simulateAdsResults } from '../ads/simulator.js';
import { scaleAds } from '../ads/scaler.js';

export async function runAdsDaily() {
    console.log("=== Running Ads Daily Operations ===");
    const today = new Date().toISOString().split('T')[0];

    // 1. Read Config
    const configPath = path.join(process.cwd(), 'config/ads.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 2. Generate Plan
    const plan = await generateAdsPlan(today, config);

    // 3. Prepare Real Payloads (Light/Scale Mode)
    if (config.mode === 'light' || config.mode === 'scale') {
        const adapters = {
            tiktok: await import('../ads/adapters/tiktok-light.js'),
            meta: await import('../ads/adapters/meta-light.js'),
            google: await import('../ads/adapters/google-light.js')
        };

        for (const campaign of plan.campaigns) {
            // Check if API key exists (mock check)
            if (config.api_keys[campaign.platform]) {
                // In real app, we'd use the adapter
                // For now, we just call the light adapter if it matches
                if (adapters[campaign.platform]) {
                    await adapters[campaign.platform].preparePayload(campaign, today);
                }
            } else {
                console.log(`[${campaign.platform}] No API key, skipping real payload gen.`);
            }
        }
    }

    // 4. Simulate Results (All Modes)
    const results = await simulateAdsResults(plan);

    // 5. Scale Decisions (Scale Mode)
    let decisions = null;
    if (config.mode === 'scale') {
        decisions = await scaleAds(results, config);
    }

    // 6. Save Report
    const report = {
        date: today,
        config: config,
        plan: plan,
        results: results,
        decisions: decisions,
        generatedAt: new Date().toISOString()
    };

    const reportPath = path.join(process.cwd(), 'data/logs', `ops-ads-${today}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Ads Daily Report saved: ${reportPath}`);

    return report;
}

// Allow standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runAdsDaily();
}
