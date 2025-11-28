export async function writeNodes(graph, context, lang) {
    // Mock Content Generation
    return graph.map(node => {
        const choices = node.connections.map(targetId => ({
            label: `Go to ${targetId}`,
            target: targetId
        }));

        if (choices.length === 0 && node.type !== 'end') {
            // Fallback for dead ends that aren't marked end
            choices.push({ label: "Restart", target: "node-1" });
        }

        return {
            id: node.id,
            text: `[${lang}] You are at ${node.id}. Context: ${context.title || 'Unknown'}. What do you do?`,
            choices
        };
    });
}
