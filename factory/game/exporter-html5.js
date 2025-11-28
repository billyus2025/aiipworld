import fs from 'fs';
import path from 'path';

export async function exportToHTML5(gameId) {
    console.log(`Exporting Game to HTML5: ${gameId}`);

    const gameDir = path.join(process.cwd(), 'data/game', gameId);
    if (!fs.existsSync(gameDir)) {
        console.error(`Game not found: ${gameId}`);
        return null;
    }

    const metadata = JSON.parse(fs.readFileSync(path.join(gameDir, 'metadata.json'), 'utf8'));
    const exportDir = path.join(gameDir, 'export/html5');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    let htmlContent = "";

    if (metadata.mode === 'if') {
        const gameData = JSON.parse(fs.readFileSync(path.join(gameDir, 'if.json'), 'utf8'));
        htmlContent = generateIFHTML(metadata, gameData);
    } else if (metadata.mode === 'vn') {
        const gameData = JSON.parse(fs.readFileSync(path.join(gameDir, 'vn.json'), 'utf8'));
        const assets = JSON.parse(fs.readFileSync(path.join(gameDir, 'assets.json'), 'utf8'));
        htmlContent = generateVNHTML(metadata, gameData, assets);
    }

    fs.writeFileSync(path.join(exportDir, 'index.html'), htmlContent);
    console.log(`Exported to: ${exportDir}/index.html`);
    return exportDir;
}

function generateIFHTML(metadata, gameData) {
    return `<!DOCTYPE html>
<html lang="${metadata.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body class="bg-black text-gray-200 font-mono h-screen flex flex-col">
    <!-- Ad Slot Top -->
    <div id="ad-slot-top" class="w-full h-16 bg-gray-900 flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">
        Ad Space
    </div>

    <main id="game-container" class="flex-1 p-8 max-w-3xl mx-auto w-full flex flex-col justify-center">
        <div id="story-text" class="text-xl leading-relaxed mb-8 fade-in">Loading...</div>
        <div id="choices" class="space-y-4"></div>
    </main>

    <!-- Ad Slot Bottom -->
    <div id="ad-slot-bottom" class="w-full h-16 bg-gray-900 flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">
        Ad Space
    </div>

    <script>
        const gameData = ${JSON.stringify(gameData)};
        let currentNodeId = gameData.startNodeId;

        function renderNode(nodeId) {
            const node = gameData.nodes.find(n => n.id === nodeId);
            if (!node) return;

            const textEl = document.getElementById('story-text');
            const choicesEl = document.getElementById('choices');

            textEl.classList.remove('fade-in');
            void textEl.offsetWidth;
            textEl.classList.add('fade-in');

            textEl.innerText = node.text;
            choicesEl.innerHTML = '';

            node.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left p-4 border border-gray-700 rounded hover:bg-gray-800 hover:border-green-500 transition text-green-400 font-bold";
                btn.innerText = "> " + choice.label;
                btn.onclick = () => renderNode(choice.target);
                choicesEl.appendChild(btn);
            });
        }

        renderNode(currentNodeId);
    </script>
</body>
</html>`;
}

function generateVNHTML(metadata, gameData, assets) {
    return `<!DOCTYPE html>
<html lang="${metadata.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black h-screen overflow-hidden select-none flex flex-col">
    
    <!-- Ad Slot Top -->
    <div id="ad-slot-top" class="w-full h-12 bg-gray-900 z-50 flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">
        Ad Space
    </div>

    <div class="relative flex-1 w-full h-full overflow-hidden">
        <!-- Background Layer -->
        <div id="bg-layer" class="absolute inset-0 bg-cover bg-center transition-all duration-1000" style="background-image: url('https://via.placeholder.com/1920x1080/1a1a1a/333333?text=Loading...');"></div>

        <!-- UI Layer -->
        <div class="absolute inset-0 flex flex-col justify-end p-8 pb-12 bg-gradient-to-t from-black via-transparent to-transparent">
            <div class="max-w-4xl mx-auto w-full bg-gray-900/90 border border-gray-700 p-6 rounded-lg shadow-2xl cursor-pointer" onclick="nextStep()">
                <div id="speaker-name" class="text-yellow-500 font-bold text-xl mb-2">...</div>
                <div id="dialogue-text" class="text-white text-2xl leading-relaxed">Loading...</div>
                <div class="text-right text-xs text-gray-500 mt-2">Click to continue ▼</div>
            </div>
        </div>
    </div>

    <!-- Ad Slot Bottom -->
    <div id="ad-slot-bottom" class="w-full h-12 bg-gray-900 z-50 flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">
        Ad Space
    </div>

    <script>
        const gameData = ${JSON.stringify(gameData)};
        const assets = ${JSON.stringify(assets)};
        
        let currentSceneIndex = 0;
        let currentDialogueIndex = 0;

        function renderScene() {
            if (currentSceneIndex >= gameData.scenes.length) {
                alert("End of Demo");
                return;
            }

            const scene = gameData.scenes[currentSceneIndex];
            const bgUrl = assets.backgrounds[scene.background]?.src || 'https://via.placeholder.com/1920x1080/2a2a2a/555555?text=Background';
            document.getElementById('bg-layer').style.backgroundImage = "url('" + bgUrl + "')";
            
            renderDialogue();
        }

        function renderDialogue() {
            const scene = gameData.scenes[currentSceneIndex];
            if (currentDialogueIndex >= scene.dialogues.length) {
                currentSceneIndex++;
                currentDialogueIndex = 0;
                renderScene();
                return;
            }

            const dialogue = scene.dialogues[currentDialogueIndex];
            document.getElementById('speaker-name').innerText = dialogue.speaker;
            document.getElementById('dialogue-text').innerText = dialogue.text;
        }

        function nextStep() {
            currentDialogueIndex++;
            renderDialogue();
        }

        renderScene();
    </script>
</body>
</html>`;
}
