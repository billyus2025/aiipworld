export async function generateOutline(config) {
    // Mock outline generation with structured arcs
    const outline = [];
    const arcs = ["Opening", "Rising Action", "Twist", "Climax", "Resolution"];
    const itemsPerArc = Math.ceil(config.outline_items / arcs.length);

    let idCounter = 1;
    for (const arc of arcs) {
        for (let i = 0; i < itemsPerArc; i++) {
            if (idCounter > config.outline_items) break;
            outline.push({
                id: idCounter,
                arc: arc,
                title: `Outline Item ${idCounter}: ${arc} Part ${i + 1}`,
                summary: `This is the summary for outline item ${idCounter}. It is part of the ${arc} arc.`
            });
            idCounter++;
        }
    }
    return outline;
}
