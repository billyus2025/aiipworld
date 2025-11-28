import path from 'path';
import fs from 'fs';

export function generateSubtitles(text, outputDir, lang) {
    // Mock SRT generation
    // Simple split by sentence
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    let srtContent = "";
    let startTime = 0;

    sentences.forEach((sentence, index) => {
        const duration = Math.max(2, sentence.length * 0.1); // Rough estimate
        const endTime = startTime + duration;

        srtContent += `${index + 1}\n`;
        srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
        srtContent += `${sentence.trim()}\n\n`;

        startTime = endTime;
    });

    const outputFile = path.join(outputDir, `${lang}.srt`);
    fs.writeFileSync(outputFile, srtContent);
    console.log(`Generated subtitles: ${outputFile}`);
    return outputFile;
}

function formatTime(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 12).replace('.', ',');
}
