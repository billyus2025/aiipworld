import fs from 'fs';
import path from 'path';

export async function exportNovel(projectId, platform) {
    console.log(`Exporting Novel ${projectId} for ${platform}...`);

    const dataDir = path.join(process.cwd(), 'data/novel', projectId);
    if (!fs.existsSync(dataDir)) return null;

    const exportDir = path.join(process.cwd(), 'data/novel-export', projectId, 'platform', platform);
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    // Mock Export
    fs.writeFileSync(path.join(exportDir, 'manuscript.docx'), "Mock DOCX Content");
    fs.writeFileSync(path.join(exportDir, 'metadata.json'), JSON.stringify({ platform, exportedAt: new Date() }, null, 2));

    return exportDir;
}
