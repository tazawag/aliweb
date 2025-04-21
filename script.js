const canvas = document.getElementById('shopCanvas');
const ctx = canvas.getContext('2d');

const assets = {
    images: {
        shopBg: new Image(),
        soulImg: new Image(),
    },
    sounds: {
        textSFX: new Audio('res/snd/snd_text.wav'),
        menumoveSFX: new Audio('res/snd/snd_menumove.wav')
    },
    font: new FontFace('Determination Mono', 'url(res/determination-mono.otf)')
};

let assetsLoaded = {
    shopBg: false,
    soulImg: false,
    font: false,
    shopkeeperImages: false
};

const shopkeeperImages = {};
const expressions = ['neutral','shocked'];
let currentExpression = 'neutral';
let currentFrame = 0;
let animationTimer = 0;

let totalFramesToLoad = 0;
let framesLoaded = 0;

let soundEnabled = false;

document.getElementById('enterButton').addEventListener('click', () => {
    soundEnabled = true;

    const introScreen = document.getElementById('introScreen');
    introScreen.classList.add('hidden');

    setTimeout(() => {
        introScreen.style.display = 'none';

        const silent = new Audio();
        silent.play().catch(() => {});

        tryDraw();
    }, 300);
});

function loadAssets() {
    const shopBg = assets.images.shopBg;
    shopBg.src = DEBUG ? 'res/img/backgroundFull.png' : 'res/img/background.png';
    shopBg.onload = () => {
        assetsLoaded.shopBg = true;
        checkAllAssetsLoaded();
    };

    const soulImg = assets.images.soulImg;
    soulImg.src = 'res/img/soul.png';
    soulImg.onload = () => {
        assetsLoaded.soulImg = true;
        checkAllAssetsLoaded();
    };

    // Load shopkeeper frames
    expressions.forEach((expr) => {
        shopkeeperImages[expr] = [];
        for (let i = 1; i <= 2; i++) {
            totalFramesToLoad++;
            const img = new Image();
            img.src = `res/img/alix/${expr}${i}.png`;
            img.onload = () => {
                shopkeeperImages[expr][i - 1] = img;
                framesLoaded++;
                if (framesLoaded === totalFramesToLoad) {
                    assetsLoaded.shopkeeperImages = true;
                    checkAllAssetsLoaded();
                }
            };
        }
    });

    assets.font.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        assetsLoaded.font = true;
        checkAllAssetsLoaded();
    });
}

function checkAllAssetsLoaded() {
    if (
        assetsLoaded.shopBg &&
        assetsLoaded.soulImg &&
        assetsLoaded.shopkeeperImages &&
        assetsLoaded.font
    ) {
        const enterBtn = document.getElementById('enterButton');
        enterBtn.style.display = 'block';
        enterBtn.classList.add('show');
        resizeCanvas();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (
        assetsLoaded.shopBg &&
        assetsLoaded.soulImg &&
        assetsLoaded.font &&
        assetsLoaded.shopkeeperImages
    ) {
        draw();
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const DEBUG = false;

const menus = {
    main: ['Projects', 'Mods', 'Talk', 'Exit'],
    Projects: ['Project 1', 'Project 2', 'Back'],
    Mods: ['Lethal C.', 'R.E.P.O.', 'Back'],
    Talk: ['About you', 'This page', 'Back'],
    'Lethal C.': ['Yes', 'No'],
    'R.E.P.O.': ['Yes', 'No']
};

let currentMenu = 'main';
let hoverIndex = 0;

function getButtons() {
    return menus[currentMenu] || [];
}

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
    if (
        assetsLoaded.shopBg &&
        assetsLoaded.soulImg &&
        assetsLoaded.shopkeeperImages &&
        assetsLoaded.font &&
        soundEnabled
    ) {
        startDialogue("Hi! Welcome to my website!");
        requestAnimationFrame(animate);
    }
}

function getButtonHitbox(i) {
    const fontScale = globalScale * 11;
    const fontSize = 14 * fontScale;
    const spacing = 200 * globalScale;

    const buttonX = drawX + 2200 * globalScale;
    const buttonY = drawY + 1475 * globalScale + 10 * globalScale + i * spacing;

    const width = 800 * globalScale;
    const height = fontSize * 1.3;

    return { x: buttonX, y: buttonY - height, width, height };
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = -1;

    getButtons().forEach((btn, i) => {
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
        playSound(assets.sounds.menumoveSFX);
        draw();
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    getButtons().forEach((btn, i) => {
        const hitbox = getButtonHitbox(i);

        if (
            mouseX >= hitbox.x &&
            mouseX <= hitbox.x + hitbox.width &&
            mouseY >= hitbox.y &&
            mouseY <= hitbox.y + hitbox.height
        ) {
            handleButtonClick(btn);
        }
    });
});

function handleButtonClick(buttonLabel) {
    if (buttonLabel === 'Back') {
        currentMenu = 'main';
        hoverIndex = 0;
        startDialogue("Hi! Welcome to my website!", 'neutral');
        draw();
        return;
    }

    if (buttonLabel === 'Yes') {
        if (currentMenu === 'Lethal C.') {
            window.location.href = 'LethalMods';
        } else if (currentMenu === 'R.E.P.O.') {
            window.location.href = 'REPOMods';
        }
        return;
    } else if (buttonLabel === 'No') {
        currentMenu = 'Mods';
        hoverIndex = 0;
        startDialogue("Here are the pages where I list the mods I play with!");
        draw();
        return;
    }

    if (menus[buttonLabel]) {
        currentMenu = buttonLabel;
        hoverIndex = 0;
        draw();
    }

    switch (buttonLabel) {
        case 'Projects':
            startDialogue("Wanna learn about my projects?");
            break;
        case 'Mods':
            startDialogue("Here are the pages where I list the mods I play with!");
            break;
        case 'Talk':
            startDialogue("Sure, what do you wanna talk about?","shocked");
            break;
        case 'Project 1':
        case 'Project 2':
            startDialogue(buttonLabel + "!");
            break;
        case 'Lethal C.':
        case 'R.E.P.O.':
            startDialogue("That will bring you to another page, you OK with that?");
            break;
        case 'About you':
            startDialogue("Me? I'm a dev who loves video games. Shocker, right?");
            break;
        case 'This page':
            startDialogue("I made this page out of boredom, I wanted to make my own little silly website. It was also good training!");
            break;
        case 'Exit':
            startDialogue("This is a website, if you wanna leave you can just close the tab.");
            break;
        default:
            console.log('Unknown button:', buttonLabel);
    }
}

function drawButtons(x, y, spacing, scale) {
    const fontSize = 14 * scale;
    const letterSpacing = -0.5 * scale;

    ctx.font = `${fontSize}px "Determination Mono", monospace`;
    ctx.fillStyle = '#ffffff';

    getButtons().forEach((btn, i) => {
        const btnY = y + i * spacing;
        let btnX = x;

        if (hoverIndex === i) {
            ctx.drawImage(assets.images.soulImg, btnX - 13.9 * scale, btnY - fontSize + 6.9 * scale, 7.5 * scale, 7.5 * scale);
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

    let delay = typingSpeed;
    if (displayedText.length > 0) {
        const prevChar = displayedText[displayedText.length - 1];
        if ([".", "!", "?"].includes(prevChar)) delay *= 12;
        else if ([",", ";", ":"].includes(prevChar)) delay *= 6;
    }

    if (timeElapsed >= delay) {
        displayedText += flattenedCharacters[textIndex]?.char || "";
        playSound(assets.sounds.textSFX);
        textIndex++;
        lastCharTime = timestamp;
    }

    draw();

    if (textIndex < flattenedCharacters.length) {
        requestAnimationFrame(updateDialogue);
    } else {
        currentFrame = 0;
        draw();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    globalScale = Math.min(
        canvas.width / assets.images.shopBg.width,
        canvas.height / assets.images.shopBg.height
    );
    drawX = (canvas.width - assets.images.shopBg.width * globalScale) / 2;
    drawY = (canvas.height - assets.images.shopBg.height * globalScale) / 2;

    ctx.drawImage(
        assets.images.shopBg,
        drawX, drawY,
        assets.images.shopBg.width * globalScale,
        assets.images.shopBg.height * globalScale
    );

    const shopImg = shopkeeperImages[currentExpression][currentFrame];
    if (shopImg) {
        ctx.drawImage(
            shopImg,
            drawX, drawY,
            shopImg.width * globalScale,
            shopImg.height * globalScale
        );
    }

    if (showDialogue) {
        drawDialogueBox(
            drawX + 312 * globalScale,
            drawY + 1474 * globalScale,
            1800 * globalScale,
            800 * globalScale
        );
    }

    drawButtons(
        drawX + 2400 * globalScale,
        drawY + 1425 * globalScale,
        200 * globalScale,
        globalScale * 11
    );
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

    flattenedCharacters = [];
    lines.forEach((line, i) => {
        for (let char of line) {
            flattenedCharacters.push({ char, lineIndex: i });
        }
    });
}

function startDialogue(newText, expression = '') {
    dialogueText = newText;
    displayedText = "";
    textIndex = 0;
    lastCharTime = 0;
    currentExpression = expression == '' ? currentExpression : expression;
    currentFrame = 0;
    animationTimer = 0;
    precomputeLines();
    requestAnimationFrame(updateDialogue);
}

function playSound(sound) {
    if (soundEnabled) {
        const sfx = sound.cloneNode();
        sfx.play();
    }
}

let lastAnimTime = 0;

function animate(timestamp) {
    if (!lastAnimTime) lastAnimTime = timestamp;
    const delta = timestamp - lastAnimTime;

    if (textIndex < flattenedCharacters.length) {
        animationTimer += delta;
        if (animationTimer >= 250) {
            currentFrame = 1 - currentFrame;
            animationTimer = 0;
        }
    } else {
        currentFrame = 0;
    }

    draw();
    lastAnimTime = timestamp;
    requestAnimationFrame(animate);
}

loadAssets();
