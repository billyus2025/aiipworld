export function generateMetadata(projectId, context = {}) {
    // Context can include idea, genre, language, etc.
    const title = context.title || (context.idea ? `Novel: ${context.idea.substring(0, 20)}...` : "The Legend of the Code Master");
    const genre = context.genre || "Xianxia";
    const description = context.synopsis || context.idea || "A young programmer transmigrates into a cultivation world with a coding system.";
    const tags = context.tags || ["Cultivation", "Immortality", "System", genre];
    const characters = context.main_characters || ["Li Wei", "Fairy Chen", "Elder Zhang"];

    return {
        id: projectId,
        title: title,
        author: "AI Factory",
        genre: genre,
        tags: tags,
        description: description,
        characters: characters,
        createdAt: new Date().toISOString(),
        status: "completed",
        language: context.language || "en",
        ...context.extraMetadata // Allow passing through other fields
    };
}
