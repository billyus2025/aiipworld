export async function generateChapters(config, outline) {
    // Mock chapter generation
    const chapters = [];
    for (let i = 1; i <= config.chapters; i++) {
        chapters.push({
            id: i,
            title: `Chapter ${i}`,
            content: `This is the content for chapter ${i}. It is a long form novel chapter with about ${config.words_per_chapter} words. `.repeat(config.words_per_chapter / 20),
            wordCount: config.words_per_chapter
        });
    }
    return chapters;
}
