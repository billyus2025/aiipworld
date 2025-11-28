export async function generateOutline(config, context = {}) {
    // Mock outline generation with structured arcs
    const outline = [];
    const arcs = context.arcs || ["Opening", "Rising Action", "Twist", "Climax", "Resolution"];
    const itemsPerArc = Math.ceil(config.outline_items / arcs.length);

    let idCounter = 1;
    for (const arc of arcs) {
        // If arc is an object (from user data), use its title/summary
        const arcTitle = typeof arc === 'string' ? arc : arc.title || "Unknown Arc";
        const arcSummary = typeof arc === 'string' ? `Part of ${arc}` : arc.summary || "No summary";

        for (let i = 0; i < itemsPerArc; i++) {
            if (idCounter > config.outline_items) break;
            outline.push({
                id: idCounter,
                arc: arcTitle,
                title: `Chapter ${idCounter}: ${arcTitle} - Part ${i + 1}`,
                summary: `This chapter covers: ${arcSummary}. Focus on character development and plot progression.`
            });
            idCounter++;
        }
    }
    return outline;
}
