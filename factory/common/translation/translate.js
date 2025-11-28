import fs from 'fs';
import path from 'path';

// Mock translation for now to avoid API costs during development/testing
// In a real scenario, this would call OpenAI or another translation service
const MOCK_TRANSLATIONS = {
    "zh": { "Novel": "小说", "Drama": "短剧", "Comic": "漫画", "Chapter": "章节", "Episode": "集" },
    "en": { "Novel": "Novel", "Drama": "Drama", "Comic": "Comic", "Chapter": "Chapter", "Episode": "Episode" },
    "jp": { "Novel": "小説", "Drama": "ドラマ", "Comic": "漫画", "Chapter": "章", "Episode": "話" },
    "kr": { "Novel": "소설", "Drama": "드라마", "Comic": "만화", "Chapter": "장", "Episode": "화" },
    "es": { "Novel": "Novela", "Drama": "Drama", "Comic": "Cómic", "Chapter": "Capítulo", "Episode": "Episodio" },
    "fr": { "Novel": "Roman", "Drama": "Drame", "Comic": "Bande Dessinée", "Chapter": "Chapitre", "Episode": "Épisode" },
    "de": { "Novel": "Roman", "Drama": "Drama", "Comic": "Comic", "Chapter": "Kapitel", "Episode": "Episode" },
    "it": { "Novel": "Romanzo", "Drama": "Dramma", "Comic": "Fumetto", "Chapter": "Capitolo", "Episode": "Episodio" },
    "hi": { "Novel": "उपन्यास", "Drama": "नाटक", "Comic": "कॉमिक", "Chapter": "अध्याय", "Episode": "कड़ी" },
    "ar": { "Novel": "رواية", "Drama": "دراما", "Comic": "قصة مصورة", "Chapter": "فصل", "Episode": "حلقة" }
};

export async function translateText(text, targetLang) {
    if (!text) return text;
    // Simple mock: append language code if not in dictionary
    // Check dictionary for keywords
    let translated = text;
    for (const [key, value] of Object.entries(MOCK_TRANSLATIONS[targetLang] || {})) {
        if (text.includes(key)) {
            translated = translated.replace(key, value);
        }
    }

    if (translated === text && targetLang !== 'en') {
        return `[${targetLang}] ${text}`;
    }
    return translated;
}

export async function translateJSON(obj, targetLang) {
    if (typeof obj === 'string') {
        return translateText(obj, targetLang);
    } else if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => translateJSON(item, targetLang)));
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            if (key === 'id' || key === 'createdAt' || key === 'novelId' || key === 'dramaId' || key === 'comicId' || key === 'ipId') {
                newObj[key] = obj[key]; // Don't translate IDs and dates
            } else {
                newObj[key] = await translateJSON(obj[key], targetLang);
            }
        }
        return newObj;
    }
    return obj;
}

export async function translateChapter(chapter, targetLang) {
    return {
        ...chapter,
        title: await translateText(chapter.title, targetLang),
        content: await translateText(chapter.content, targetLang)
    };
}

export async function translateEpisode(episode, targetLang) {
    const newEpisode = { ...episode };
    newEpisode.title = await translateText(episode.title, targetLang);

    if (episode.content) {
        newEpisode.content = await translateText(episode.content, targetLang);
    }

    if (episode.twist) {
        newEpisode.twist = await translateText(episode.twist, targetLang);
    }

    if (episode.scenes && Array.isArray(episode.scenes)) {
        newEpisode.scenes = await Promise.all(episode.scenes.map(async scene => {
            return {
                ...scene,
                description: await translateText(scene.description, targetLang),
                dialogue: await translateText(scene.dialogue, targetLang)
            };
        }));
    }
    return newEpisode;
}

export async function translateStoryboard(storyboard, targetLang) {
    const newStoryboard = { ...storyboard };
    newStoryboard.title = await translateText(storyboard.title, targetLang);
    newStoryboard.episodes = await Promise.all(storyboard.episodes.map(async ep => {
        const newEp = { ...ep };
        newEp.title = await translateText(ep.title, targetLang);
        newEp.scenes = await Promise.all(ep.scenes.map(async scene => {
            return {
                ...scene,
                description: await translateText(scene.description, targetLang)
            };
        }));
        return newEp;
    }));
    return newStoryboard;
}
