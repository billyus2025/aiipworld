export function generateMetadata(projectId, context = {}) {
    // Context can include source novel metadata
    const title = context.novelMetadata ? `Drama: ${context.novelMetadata.title}` : "Sample Drama Title";
    const description = context.novelMetadata ? `Adapted from novel: ${context.novelMetadata.description}` : "A gripping tale of love and betrayal.";
    const tags = context.novelMetadata ? [...context.novelMetadata.tags, "Drama Adaptation"] : ["Romance", "CEO", "Revenge"];

    return {
        id: projectId,
        title: title,
        author: "AI Factory",
        tags: tags,
        description: description,
        createdAt: new Date().toISOString(),
        status: "completed",
        sourceNovelId: context.novelMetadata ? context.novelMetadata.id : null
    };
}
