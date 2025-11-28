export async function buildGraph(context, maxNodes) {
    // Mock Graph Generation
    // In real app, use LLM to design the flowchart
    const nodes = [];
    const count = Math.min(maxNodes, 20); // Mock limit

    for (let i = 1; i <= count; i++) {
        nodes.push({
            id: `node-${i}`,
            type: i === 1 ? 'start' : (i === count ? 'end' : 'normal'),
            connections: []
        });
    }

    // Simple linear + branching mock
    nodes.forEach((node, idx) => {
        if (idx < nodes.length - 1) {
            node.connections.push(`node-${idx + 2}`); // Main path
            if (idx % 3 === 0 && idx < nodes.length - 2) {
                node.connections.push(`node-${idx + 3}`); // Branch
            }
        }
    });

    return nodes;
}
