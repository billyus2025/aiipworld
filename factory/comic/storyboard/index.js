import { generatePanelPrompt } from './panel-generator.js';

export async function generateStoryboard(config, metadata) {
    const storyboard = {
        id: metadata.id,
        title: metadata.title,
        episodes: []
    };

    for (let i = 1; i <= config.episodes; i++) {
        const episode = {
            id: i,
            title: `Episode ${i}`,
            scenes: []
        };

        // Mock scenes - usually 1 scene per episode for this simple factory
        const scene = {
            id: 1,
            description: `Scene for Episode ${i}: The plot advances.`
        };

        const panels = [];
        for (let j = 1; j <= config.panels_per_episode; j++) {
            panels.push(generatePanelPrompt(scene, j));
        }

        episode.scenes.push({
            ...scene,
            panels
        });

        storyboard.episodes.push(episode);
    }

    return storyboard;
}
