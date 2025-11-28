export async function generateScenes(context, lang, maxScenes) {
    // Mock Scene Generation
    const scenes = [];
    const count = Math.min(maxScenes, 5); // Mock limit

    for (let i = 1; i <= count; i++) {
        scenes.push({
            id: `scene-${i}`,
            background: `bg_location_${i}`,
            characters: ["Protagonist", "Rival"],
            dialogues: [
                { speaker: "Protagonist", text: `[${lang}] Scene ${i} begins. We are in the ${context.genre} world.` },
                { speaker: "Rival", text: `[${lang}] Indeed. The plot thickens.` },
                { speaker: "Protagonist", text: `[${lang}] Let's move on.` }
            ]
        });
    }

    return scenes;
}
