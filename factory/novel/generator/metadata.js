export function generateMetadata(projectId, context = {}) {
    // Context can include idea, genre, language, etc.
    const title = context.idea ? `Novel: ${context.idea.substring(0, 20)}...` : "The Legend of the Code Master";
    const genre = context.genre || "Xianxia";
    const description = context.idea || "A young programmer transmigrates into a cultivation world with a coding system.";

    return {
        id: projectId,
        title: title,
        author: "AI Factory",
        genre: genre,
        tags: ["Cultivation", "Immortality", "System", genre],
        description: description,
        characters: ["Li Wei", "Fairy Chen", "Elder Zhang"],
        createdAt: new Date().toISOString(),
        status: "completed",
        language: context.language || "en"
    };
}
