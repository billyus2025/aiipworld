export async function generateEpisodes(config, outline) {
    // Mock episode generation
    const episodes = [];
    for (let i = 1; i <= config.episodes; i++) {
        episodes.push({
            id: i,
            title: `Episode ${i}`,
            content: `This is the content for episode ${i}. It is a short drama episode with about 200 words. `.repeat(10),
            twist: i % (config.episodes / config.twists) === 0 ? "A shocking twist happens here!" : null
        });
    }
    return episodes;
}
