export async function generateOutline(config) {
    // Mock outline generation
    const outline = [];
    for (let i = 1; i <= config.outline_items; i++) {
        outline.push({
            id: i,
            title: `Outline Item ${i}`,
            summary: `This is the summary for outline item ${i}. It describes the key events.`
        });
    }
    return outline;
}
