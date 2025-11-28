import fs from 'fs';
import path from 'path';

export async function generatePromo(ipId, lang) {
    console.log(`Generating Social Promo for ${ipId} (${lang})...`);

    const promoDir = path.join(process.cwd(), 'data/social', ipId, lang);
    if (!fs.existsSync(promoDir)) fs.mkdirSync(promoDir, { recursive: true });

    const promoData = {
        ipId,
        lang,
        copy: {
            twitter: `Check out ${ipId}! #mustread`,
            instagram: `New drop! ${ipId} is live. Link in bio.`,
            tiktok: `You won't believe this story... ${ipId}`
        },
        images: [
            "promo-1.png",
            "promo-2.png"
        ],
        generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(path.join(promoDir, 'promo.json'), JSON.stringify(promoData, null, 2));
    return promoData;
}
