const canvas = document.getElementById('shopCanvas');
const ctx = canvas.getContext('2d');

const textSFX = new Audio('res/snd/snd_text.wav');
const menumoveSFX = new Audio('res/snd/snd_menumove.wav');

let fontLoaded = false;
let bgLoaded = false;
let soulLoaded = false;

let soundEnabled = false;

document.getElementById('enterButton').addEventListener('click', () => {
    soundEnabled = true;

    const introScreen = document.getElementById('introScreen');
    introScreen.style.display = 'none';

    const silent = new Audio();
    silent.play().catch(() => {});

    tryDraw();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (fontLoaded && bgLoaded && soulLoaded) {
        draw();
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const DEBUG = false;

const shopBg = new Image();
if (DEBUG) {
    shopBg.src = 'res/img/backgroundFull.png';
} else {
    shopBg.src = 'res/img/background.png';
}

const soulImg = new Image();
soulImg.src = 'res/img/soul.png';

const customFont = new FontFace('Determination Mono', 'url(res/determination-mono.otf)');
let hoverIndex = 0;

const buttons = ['Projects', 'Mods', 'Talk', 'Exit'];

let dialogueText = "";
let displayedText = "";
let textIndex = 0;
let typingSpeed = 30;
let precomputedLines = [];
let flattenedCharacters = [];

let showDialogue = true;

let globalScale = 1;
let drawX = 0;
let drawY = 0;

function tryDraw() {
    if (fontLoaded && bgLoaded && soulLoaded && soundEnabled) {
        draw();
        startDialogue("Hi! Welcome to my website!");
    }
}

customFont.load().then((loadedFont) => {
    document.fonts.add(loadedFont);
    fontLoaded = true;
});

shopBg.onload = () => {
    bgLoaded = true;
};

soulImg.onload = () => {
    soulLoaded = true;
};

function getButtonHitbox(i) {
    const fontScale = globalScale * 11;
    const fontSize = 14 * fontScale;
    const spacing = 200 * globalScale;

    const buttonX = drawX + 2200 * globalScale;
    const buttonY = drawY + 1475 * globalScale + 10 * globalScale + i * spacing;

    const width = 800 * globalScale;
    const height = fontSize*1.3;

    return { x: buttonX, y: buttonY - height, width, height }; // top-left corner and size
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = -1;

    buttons.forEach((btn, i) => {
        const hitbox = getButtonHitbox(i);

        if (
            mouseX >= hitbox.x &&
            mouseX <= hitbox.x + hitbox.width &&
            mouseY >= hitbox.y &&
            mouseY <= hitbox.y + hitbox.height
        ) {
            found = i;
        }
    });

    if (found !== -1 && found !== hoverIndex) {
        hoverIndex = found;
        playSound(menumoveSFX);
        draw();
    }
});
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    buttons.forEach((btn, i) => {
        const hitbox = getButtonHitbox(i);

        if (
            mouseX >= hitbox.x &&
            mouseX <= hitbox.x + hitbox.width &&
            mouseY >= hitbox.y &&
            mouseY <= hitbox.y + hitbox.height
        ) {
            alert(btn);
        }
    });
});

function drawButtons(x, y, spacing, scale) {
    const fontSize = 14 * scale;
    const letterSpacing = -0.5 * scale;

    ctx.font = `${fontSize}px "Determination Mono", monospace`;
    ctx.fillStyle = '#ffffff';

    buttons.forEach((btn, i) => {
        const btnY = y + i * spacing;
        let btnX = x;

        if (hoverIndex === i) {
            ctx.drawImage(soulImg, btnX - 13.9 * scale, btnY - fontSize + 6.9 * scale, 7.5 * scale, 7.5 * scale);
        }

        for (let char of btn) {
            ctx.fillText(char, btnX, btnY);
            btnX += ctx.measureText(char).width + letterSpacing;
        }

        if (DEBUG) {
            const hitbox = getButtonHitbox(i);
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            ctx.restore();
        }
    });
}

function drawDialogueBox(x, y, width, height) {
    const dialogueLetterSpacing = -0.5 * globalScale;
    const fontSize = 14 * globalScale * 11;
    ctx.font = `${fontSize}px "Determination Mono", monospace`;
    ctx.fillStyle = '#ffffff';

    const lineHeight = fontSize * 1.2;

    // Draw line by line
    let charIndex = 0;
    for (let i = 0; i < precomputedLines.length; i++) {
        let line = precomputedLines[i];
        let lineY = y + i * lineHeight;
        if (lineY > y + height - 10 * globalScale) break;

        let charX = x;
        for (let j = 0; j < line.length && charIndex < displayedText.length; j++) {
            let char = line[j];
            ctx.fillText(char, charX, lineY);
            charX += ctx.measureText(char).width + dialogueLetterSpacing;
            charIndex++;
        }
    }
}

let lastCharTime = 0;

function updateDialogue(timestamp) {
    if (textIndex >= flattenedCharacters.length) return;

    if (!lastCharTime) lastCharTime = timestamp;

    const timeElapsed = timestamp - lastCharTime;

    let currentChar = flattenedCharacters[textIndex]?.char || '';
    let delay = typingSpeed;

    if (displayedText.length > 0) {
        const prevChar = displayedText[displayedText.length - 1];
        if (['.', '!', '?'].includes(prevChar)) {
            delay *= 12;
        } else if ([',', ';', ':'].includes(prevChar)) {
            delay *= 6;
        }
    }

    if (timeElapsed >= delay) {
        displayedText += currentChar;
        playSound(textSFX);

        textIndex++;
        lastCharTime = timestamp;
    }

    draw();

    if (textIndex < flattenedCharacters.length) {
        requestAnimationFrame(updateDialogue);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    globalScale = Math.min(canvas.width / shopBg.width, canvas.height / shopBg.height);
    drawX = (canvas.width - shopBg.width * globalScale) / 2;
    drawY = (canvas.height - shopBg.height * globalScale) / 2;
    ctx.drawImage(shopBg, drawX, drawY, shopBg.width * globalScale, shopBg.height * globalScale);

    if (showDialogue) {
        drawDialogueBox(drawX + 312 * globalScale, drawY + 1474 * globalScale, 1800 * globalScale, 800 * globalScale);
    }    

    drawButtons(drawX + 2400 * globalScale, drawY + 1425 * globalScale, 200 * globalScale, globalScale * 11);
}

function precomputeLines() {
    const boxWidth = 1800 * globalScale;

    const fontSize = 14 * globalScale * 11;
    ctx.font = `${fontSize}px "Determination Mono", monospace`;

    let words = dialogueText.split(' ');
    let lines = [];
    let currentLine = "";

    for (let word of words) {
        const testLine = currentLine + word + " ";
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > boxWidth - 60 * globalScale && currentLine !== "") {
            lines.push(currentLine.trim());
            currentLine = word + " ";
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine.trim());

    precomputedLines = lines;

    // Flatten into char-level entries
    flattenedCharacters = [];
    lines.forEach((line, i) => {
        for (let char of line) {
            flattenedCharacters.push({ char, lineIndex: i });
        }
    });
}

function startDialogue(newText) {
    dialogueText = newText;
    displayedText = "";
    textIndex = 0;
    lastCharTime = 0;
    precomputeLines();
    requestAnimationFrame(updateDialogue);
}

function playSound(sound) {
    if (soundEnabled) {
        const sfx = sound.cloneNode();
        sfx.play();
    }
}
