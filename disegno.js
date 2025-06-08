// Variabili globali per la configurazione del pennello e l'interruzione del disegno
const SPESSORE_PENNELLO = 0; // Indice della dimensione del pennello (0-4), 0 è il più piccolo
const SPESSORE_PIXEL_MAP = [3, 9, 19, 32, 39]; // Mappa di spessori effettivi in pixel
const SPESSORE_PIXEL = SPESSORE_PIXEL_MAP[SPESSORE_PENNELLO]; // Spessore effettivo in pixel logici

// Assicura che PIXEL_WIDTH e PIXEL_HEIGHT siano numeri interi
const PIXEL_WIDTH = Math.floor(800 / SPESSORE_PIXEL); // Larghezza desiderata del canvas in pixel logici
const PIXEL_HEIGHT = Math.floor(600 / SPESSORE_PIXEL); // Altezza desiderata del canvas in pixel logici

let abortDrawing = false; // Variabile globale per interrompere il processo di disegno

// Funzione helper per introdurre un ritardo asincrono
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Classe PixelArt e metodi per convertire un'immagine in un formato "pixel art"
class PixelArt {
    // Palette di colori predefinita per la conversione in pixel art
    static colors = [
        [ // colori della riga superiore
            "rgb(255, 255, 255)",     // Bianco
            "rgb(193, 193, 193)",     // Grigio Chiaro
            "rgb(239, 19, 11)",       // Rosso
            "rgb(255, 113, 0)",       // Arancione
            "rgb(255, 228, 0)",       // Giallo
            "rgb(0, 204, 0)",         // Verde
            "rgb(0, 255, 145)",       // Menta
            "rgb(0, 178, 255)",       // Azzurro Cielo
            "rgb(35, 31, 211)",       // Blu Marino
            "rgb(163, 0, 186)",       // Viola
            "rgb(223, 105, 167)",     // Rosa
            "rgb(255, 172, 142)",     // Beige
            "rgb(160, 82, 45)"        // Marrone
        ],
        [ // colori della riga inferiore
            "rgb(0, 0, 0)",           // Nero
            "rgb(80, 80, 80)",        // Grigio
            "rgb(116, 11, 7)",        // Rosso Scuro
            "rgb(194, 56, 0)",        // Arancione Scuro
            "rgb(232, 162, 0)",       // Giallo Scuro
            "rgb(0, 70, 25)",         // Verde Scuro
            "rgb(0, 120, 93)",        // Menta Scuro
            "rgb(0, 86, 158)",        // Azzurro Cielo Scuro
            "rgb(14, 8, 101)",        // Blu Marino Scuro
            "rgb(85, 0, 105)",        // Viola Scuro
            "rgb(135, 53, 84)",       // Rosa Scuro
            "rgb(204, 119, 77)",      // Beige Scuro
            "rgb(99, 48, 13)"         // Marrone Scuro
        ]
    ];

    // Converte una stringa RGB (es. "rgb(255, 0, 128)") in un array di numeri [255, 0, 128]
    static rgbStringToArray(rgb) {
        const m = rgb.match(/\d+/g);
        return m ? m.map(Number) : [0, 0, 0];
    }

    // Calcola la distanza euclidea tra due colori RGB nello spazio 3D
    static colorDistance(c1, c2) {
        return Math.sqrt(
            (c1[0] - c2[0]) ** 2 +
            (c1[1] - c2[1]) ** 2 +
            (c1[2] - c2[2]) ** 2
        );
    }

    // Trova il colore più vicino nella palette predefinita a un dato colore RGB
    static findNearestColor(rgbArray) {
        let bestColor = null;
        let bestDist = Infinity;

        for (const row of PixelArt.colors) {
            for (const colorStr of row) {
                const c = PixelArt.rgbStringToArray(colorStr);
                const dist = PixelArt.colorDistance(rgbArray, c);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestColor = colorStr;
                }
            }
        }
        return bestColor;
    }

    // Converte un'immagine data in un array di dati pixel art
    static convertToPixelArt(image) {
        const width = PIXEL_WIDTH;
        const height = PIXEL_HEIGHT;

        // Crea un canvas temporaneo per disegnare l'immagine e ottenere i dati dei pixel
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Ridimensiona e centra l'immagine proporzionalmente sul canvas temporaneo
        const ratio = Math.min(width / image.width, height / image.height);
        const newWidth = image.width * ratio;
        const newHeight = image.height * ratio;
        const offsetX = (width - newWidth) / 2;
        const offsetY = (height - newHeight) / 2;

        ctx.clearRect(0, 0, width, height); // Pulisce il canvas temporaneo
        ctx.drawImage(image, offsetX, offsetY, newWidth, newHeight); // Disegna l'immagine ridimensionata

        // Ottiene i dati dei pixel dall'immagine disegnata sul canvas temporaneo
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data; // Array di valori RGBA

        const result = []; // Array per memorizzare i pixel convertiti in pixel art

        // Itera su ogni pixel del canvas temporaneo
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4; // Calcola l'indice iniziale del pixel nell'array data (R,G,B,A)
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3]; // Componente alfa (trasparenza)

                if (a !== 0) { // Se il pixel non è completamente trasparente
                    const nearestColor = PixelArt.findNearestColor([r, g, b]); // Trova il colore più vicino nella palette
                    result.push({ x, y, color: nearestColor }); // Aggiunge il pixel convertito all'array dei risultati
                }
            }
        }
        return result; // Restituisce l'array di pixel art
    }
}

// Seleziona uno strumento nella toolbar tramite il suo attributo data-tooltip
async function selectTool(toolName) {
    const tools = document.querySelectorAll(
        "#game-toolbar .toolbar-group-tools .tool, #game-toolbar .toolbar-group-actions .tool"
    );
    const tool = Array.from(tools).find(el =>
        el.getAttribute("data-tooltip")?.toLowerCase() === toolName.toLowerCase()
    );
    if (tool) {
        tool.click();
    }
}

// Seleziona la dimensione del pennello tramite il suo indice nella lista delle dimensioni
async function selectSize(sizeIndex) {
    const sizes = document.querySelectorAll("#game-toolbar .sizes .container .size");
    if (sizeIndex >= 0 && sizeIndex < sizes.length) {
        sizes[sizeIndex].click();
    }
}

// Seleziona un colore nella palette tramite la sua stringa RGB
async function selectColor(colorRgb) {
    const colors = document.querySelectorAll("#game-toolbar .colors .top .color, #game-toolbar .colors .bottom .color");
    const color = Array.from(colors).find(el => el.style.backgroundColor === colorRgb);
    if (color) {
        const rect = color.getBoundingClientRect();
        const opts = {
            bubbles: true,
            cancelable: true,
            pointerType: "mouse",
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            button: 0,
            pointerId: 1,
        };

        color.dispatchEvent(new PointerEvent("pointerdown", opts));
        color.dispatchEvent(new PointerEvent("pointerup", opts));
        color.dispatchEvent(new PointerEvent("click", opts));
    }
}

/**
 * Disegna una linea sul canvas simulando trascinamenti del mouse.
 * Può disegnare linee orizzontali, verticali e diagonali.
 * @param {HTMLCanvasElement} canvas L'elemento canvas su cui disegnare.
 * @param {number} x1 La coordinata X di inizio della linea (in pixel logici).
 * @param {number} y1 La coordinata Y di inizio della linea (in pixel logici).
 * @param {number} x2 La coordinata X di fine della linea (in pixel logici).
 * @param {number} y2 La coordinata Y di fine della linea (in pixel logici).
 */
async function drawLine(canvas, x1, y1, x2, y2) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / PIXEL_WIDTH;
    const scaleY = rect.height / PIXEL_HEIGHT;

    // Calcola le coordinate client (reali) per l'inizio e la fine della linea
    const clientX1 = rect.left + x1 * scaleX + scaleX / 2;
    const clientY1 = rect.top + y1 * scaleY + scaleY / 2;
    const clientX2 = rect.left + x2 * scaleX + scaleX / 2;
    const clientY2 = rect.top + y2 * scaleY + scaleY / 2;

    // Opzioni per l'evento pointerdown (inizio del trascinamento)
    const optsDown = {
        bubbles: true,
        cancelable: true,
        pointerType: "mouse",
        clientX: clientX1,
        clientY: clientY1,
        button: 0,
        pointerId: 1,
    };
    // Opzioni per l'evento pointermove (spostamento del trascinamento)
    const optsMove = { ...optsDown, clientX: clientX2, clientY: clientY2 };
    // Opzioni per l'evento pointerup (fine del trascinamento)
    const optsUp = { ...optsMove };

    // Dispatch degli eventi per simulare il disegno della linea
    canvas.dispatchEvent(new PointerEvent("pointerdown", optsDown));
    canvas.dispatchEvent(new PointerEvent("pointermove", optsMove));
    canvas.dispatchEvent(new PointerEvent("pointerup", optsUp));
}

// Disegna la matrice di pixel ricevuta sul canvas
async function drawPixelMatrix(pixelData, canvas) {
    if (!Array.isArray(pixelData) || pixelData.length === 0) return;

    // Converte pixelData in una griglia 2D per un accesso rapido
    // Inizializza la griglia con `null` per i pixel vuoti
    const pixelGrid = Array(PIXEL_HEIGHT).fill(null).map(() => Array(PIXEL_WIDTH).fill(null));

    // Conta le occorrenze di ogni colore per trovare quello di sfondo più frequente
    const colorCount = {};
    for (const { x, y, color } of pixelData) {
        if (x >= 0 && x < PIXEL_WIDTH && y >= 0 && y < PIXEL_HEIGHT) {
            pixelGrid[y][x] = color; // Popola la griglia dei pixel
            colorCount[color] = (colorCount[color] || 0) + 1;
        }
    }

    // Ordina i colori per frequenza (dal più frequente al meno frequente)
    const sortedColors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]);
    const backgroundColor = sortedColors.length > 0 ? sortedColors[0][0] : "rgb(255, 255, 255)"; // Bianco di default se non ci sono pixel
    
    const allColors = Object.keys(colorCount);

    // Inizializza una griglia per tenere traccia dei pixel già disegnati
    const drawnGrid = Array(PIXEL_HEIGHT).fill(null).map(() => Array(PIXEL_WIDTH).fill(false));

    // Riempi lo sfondo con il colore più frequente
    if (!abortDrawing) {
        await selectColor(backgroundColor);
        if (abortDrawing) return;
        await selectTool("fill");
        if (abortDrawing) return;
        // Esegui un "click" con drawLine su (0, 0) per riempire
        await drawLine(canvas, 0, 0, 0, 0);
    }

    // Funzione helper per trovare il segmento orizzontale più lungo del colore dato
    const getHorizontalSegment = (x, y, color, grid) => {
        let endX = x;
        while (endX + 1 < PIXEL_WIDTH && grid[y][endX + 1] === color) {
            endX++;
        }
        return { x1: x, y1: y, x2: endX, y2: y, length: endX - x + 1, color: color };
    };

    // Funzione helper per trovare il segmento verticale più lungo del colore dato
    const getVerticalSegment = (x, y, color, grid) => {
        let endY = y;
        while (endY + 1 < PIXEL_HEIGHT && grid[endY + 1][x] === color) {
            endY++;
        }
        return { x1: x, y1: y, x2: x, y2: endY, length: endY - y + 1, color: color };
    };

    // Funzione helper per trovare il segmento diagonale più lungo (da in alto a sinistra a in basso a destra)
    const getDiagonal1Segment = (x, y, color, grid) => {
        let currentX = x;
        let currentY = y;
        let segmentLength = 0;
        while (currentX + 1 < PIXEL_WIDTH && currentY + 1 < PIXEL_HEIGHT && grid[currentY + 1][currentX + 1] === color) {
            currentX++;
            currentY++;
            segmentLength++;
        }
        return { x1: x, y1: y, x2: currentX, y2: currentY, length: segmentLength + 1, color: color };
    };

    // Funzione helper per trovare il segmento diagonale più lungo (da in basso a sinistra a in alto a destra)
    const getDiagonal2Segment = (x, y, color, grid) => {
        let currentX = x;
        let currentY = y;
        let segmentLength = 0;
        while (currentX + 1 < PIXEL_WIDTH && currentY - 1 >= 0 && grid[currentY - 1][currentX + 1] === color) {
            currentX++;
            currentY--;
            segmentLength++;
        }
        return { x1: x, y1: y, x2: currentX, y2: currentY, length: segmentLength + 1, color: color };
    };

    // NUOVO APPROCCIO: Trova TUTTE le linee possibili di tutti i colori e ordinale per lunghezza
    let allLines = [];

    // Cerca tutte le linee per tutti i colori
    for (const color of allColors) {
        if (color === backgroundColor) continue; // Salta il colore di sfondo

        for (let y = 0; y < PIXEL_HEIGHT; y++) {
            for (let x = 0; x < PIXEL_WIDTH; x++) {
                if (pixelGrid[y][x] === color) {
                    // Ottiene tutte le linee candidate che partono da (x,y)
                    const candidates = [
                        getHorizontalSegment(x, y, color, pixelGrid),
                        getVerticalSegment(x, y, color, pixelGrid),
                        getDiagonal1Segment(x, y, color, pixelGrid),
                        getDiagonal2Segment(x, y, color, pixelGrid)
                    ];

                    for (const candidate of candidates) {
                        if (candidate && candidate.length > 1) { // Solo linee di lunghezza > 1
                            // Verifica che questa linea non sia già stata aggiunta (per evitare duplicati)
                            const lineExists = allLines.some(existingLine => 
                                existingLine.x1 === candidate.x1 && 
                                existingLine.y1 === candidate.y1 && 
                                existingLine.x2 === candidate.x2 && 
                                existingLine.y2 === candidate.y2 &&
                                existingLine.color === candidate.color
                            );
                            
                            if (!lineExists) {
                                allLines.push(candidate);
                            }
                        }
                    }
                }
            }
        }
    }

    // Ordina tutte le linee per lunghezza (dalla più lunga alla più corta)
    allLines.sort((a, b) => b.length - a.length);

    await selectTool("brush");
    if (abortDrawing) return;
    await selectSize(SPESSORE_PENNELLO);
    if (abortDrawing) return;

    let currentColor = null;

    // Disegna le linee in ordine di lunghezza
    for (const line of allLines) {
        if (abortDrawing) break;

        // Verifica se almeno un pixel di questa linea non è ancora stato disegnato
        const { x1, y1, x2, y2, color } = line;
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);
        let currentCheckX = x1;
        let currentCheckY = y1;
        let hasUndrawnPixels = false;

        while (true) {
            if (currentCheckY >= 0 && currentCheckY < PIXEL_HEIGHT &&
                currentCheckX >= 0 && currentCheckX < PIXEL_WIDTH &&
                pixelGrid[currentCheckY][currentCheckX] === color &&
                !drawnGrid[currentCheckY][currentCheckX]) {
                hasUndrawnPixels = true;
                break;
            }
            if (currentCheckX === x2 && currentCheckY === y2) break;
            if (x1 !== x2) currentCheckX += dx;
            if (y1 !== y2) currentCheckY += dy;
            if (x1 === x2 && y1 === y2) break;
        }

        // Se questa linea ha pixel non disegnati, disegnala
        if (hasUndrawnPixels) {
            // Cambia colore solo se necessario
            if (currentColor !== color) {
                await selectColor(color);
                if (abortDrawing) return;
                currentColor = color;
            }

            await drawLine(canvas, x1, y1, x2, y2);

            // Marca tutti i pixel coperti dalla linea come disegnati
            currentCheckX = x1;
            currentCheckY = y1;
            while (true) {
                if (currentCheckY >= 0 && currentCheckY < PIXEL_HEIGHT &&
                    currentCheckX >= 0 && currentCheckX < PIXEL_WIDTH) {
                    drawnGrid[currentCheckY][currentCheckX] = true;
                }
                if (currentCheckX === x2 && currentCheckY === y2) break;
                if (x1 !== x2) currentCheckX += dx;
                if (y1 !== y2) currentCheckY += dy;
                if (x1 === x2 && y1 === y2) break;
            }

            await sleep(12);
        }
    }

    // Passaggio finale: Correzione dei pixel di sfondo sovrascritti
    if (!abortDrawing) {
        await selectColor(backgroundColor);
        if (abortDrawing) return;
        await selectSize(0); // Usa il pennello più piccolo per i dettagli
        if (abortDrawing) return;

        // Disegna singoli pixel di sfondo che sono stati sovrascritti
        for (let y = 0; y < PIXEL_HEIGHT; y++) {
            for (let x = 0; x < PIXEL_WIDTH; x++) {
                if (abortDrawing) break;
                if (pixelGrid[y][x] === backgroundColor && drawnGrid[y][x]) {
                    await drawLine(canvas, x, y, x, y);
                    await sleep(5);
                }
            }
            if (abortDrawing) break;
        }
    }
}

// Ascolta i messaggi postati alla finestra per attivare il disegno di pixel art
window.addEventListener("message", async (event) => {
    if (event.source === window && event.data.type === "DRAW_PIXEL_ART") {
        const canvas = document.querySelector("#game-canvas canvas");
        if (canvas) {
            await drawPixelMatrix(event.data.pixelData, canvas);
        }
    }
});

// Funzione self-invoking per inizializzare il drag & drop dell'immagine sul canvas
(async () => {
    function waitForCanvas() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const canvas = document.querySelector("#game-canvas canvas");
                if (canvas) {
                    clearInterval(interval);
                    resolve(canvas);
                }
            }, 500);
        });
    }

    const canvas = await waitForCanvas();

    // Crea un overlay scuro con un messaggio per il drag & drop
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    overlay.style.color = "white";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.fontSize = "24px";
    overlay.style.zIndex = "1000";
    overlay.style.pointerEvents = "none";
    overlay.innerText = "Rilascia l'immagine qui";
    overlay.style.display = "none";
    canvas.parentElement.style.position = "relative";
    canvas.parentElement.appendChild(overlay);

    // Carica l'immagine e avvia il processo di disegno della pixel art
    async function loadImageAndDraw(src) {
        return new Promise(async (resolve, reject) => {
            // 1. Interrompe il disegno corrente:
            abortDrawing = true;
            await sleep(50); // Breve pausa per permettere al ciclo di disegno in corso di verificare abortDrawing

            // 2. Pulisce il canvas usando lo strumento "Clear"
            await selectTool("clear");
            await sleep(50);

            // Reimposta la variabile abortDrawing su false per il nuovo processo di disegno
            abortDrawing = false;

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const pixelData = PixelArt.convertToPixelArt(img);
                // 3. Inizia a disegnare da capo con i nuovi dati pixel art
                window.postMessage({ type: "DRAW_PIXEL_ART", pixelData }, "*");
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    // Gestione degli eventi di drag & drop
    canvas.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        overlay.style.display = "flex";
    });

    canvas.addEventListener("dragleave", () => {
        overlay.style.display = "none";
    });

    canvas.addEventListener("drop", async (ev) => {
        ev.preventDefault();
        overlay.style.display = "none";

        if (ev.dataTransfer.files.length > 0) {
            const file = ev.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                await loadImageAndDraw(url);
                URL.revokeObjectURL(url);
            }
        } else if (ev.dataTransfer.items.length > 0) {
            const item = ev.dataTransfer.items[0];
            if (item.kind === "file" && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                const url = URL.createObjectURL(file);
                await loadImageAndDraw(url);
                URL.revokeObjectURL(url);
            }
        }
    });
})();