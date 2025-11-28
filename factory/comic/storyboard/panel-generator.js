export function generatePanelPrompt(scene, panelIndex) {
    // In a real scenario, this would use AI to generate a detailed prompt based on the scene description.
    // For now, we return a structured prompt object.
    return {
        panelId: panelIndex,
        description: `Panel ${panelIndex} of scene: ${scene.description}`,
        prompt: `comic book style, webtoon format, ${scene.description}, panel ${panelIndex}, detailed background, expressive characters, dynamic angle --ar 2:3`,
        camera: "Medium Shot",
        action: "Characters talking",
        emotion: "Neutral"
    };
}
