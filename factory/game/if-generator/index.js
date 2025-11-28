import fs from 'fs';
import path from 'path';
import { buildGraph } from './graph-builder.js';
import { writeNodes } from './node-writer.js';

export async function generateIF(gameId, context, lang, config) {
    console.log(`Generating IF Game: ${gameId} (${lang})`);

    // 1. Build Narrative Graph
    const graph = await buildGraph(context, config.if_max_nodes);

    // 2. Write Node Content (Text + Choices)
    const nodes = await writeNodes(graph, context, lang);

    const gameData = {
        gameId,
        mode: 'if',
        language: lang,
        startNodeId: nodes[0].id,
        nodes
    };

    return gameData;
}
