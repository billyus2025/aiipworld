import fs from 'fs';
import path from 'path';

export async function generateSitemaps() {
    console.log("Generating Sitemaps...");
    const siteDir = path.join(process.cwd(), 'sites');
    if (!fs.existsSync(siteDir)) return;

    // Mock Sitemap Content
    const urls = [
        "https://ipfactory.com/",
        "https://ipfactory.com/admin"
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), xml);
    console.log("Sitemap generated.");
}
