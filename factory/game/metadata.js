import fs from 'fs';
import path from 'path';

export function generateMetadata(gameId, context, mode, lang) {
    return {
        gameId,
        ipId: context.ipId || null,
        mode,
        title: `${context.title} - ${mode.toUpperCase()} Game`,
        logline: context.idea || context.logline || "An immersive game experience.",
        genre: context.genre || "General",
        language: lang,
        estimated_playtime_minutes: mode === 'vn' ? 30 : 60,
        subscription_required: true,
        vip_only: true,
        createdAt: new Date().toISOString()
    };
}
