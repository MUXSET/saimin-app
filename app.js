// DOM Elements
const warningScreen = document.getElementById('warning-screen');
const bootBtn = document.getElementById('boot-btn');
const mainInterface = document.getElementById('main-interface');
const cameraFeed = document.getElementById('camera-feed');
const faceBox = document.querySelector('.face-box');
const depthSlider = document.getElementById('depth-slider');
const cmdBtns = document.querySelectorAll('.cmd-btn');
const executeBtn = document.getElementById('execute-btn');
const effectCanvas = document.getElementById('effect-canvas');
const clockDisplay = document.getElementById('clock');

// State
let isBooted = false;
let isScanning = false;
let isLocked = false;
let selectedCmd = null;
let effectFrameId;

// Clock Update
setInterval(() => {
    const now = new Date();
    clockDisplay.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}, 1000);

// 1. Boot Sequence
bootBtn.addEventListener('click', async () => {
    // Play Boot Sound
    playSound(400, 'square', 0.1);

    warningScreen.style.opacity = '0';
    setTimeout(() => {
        warningScreen.classList.add('hidden');
        mainInterface.classList.remove('hidden');
        startCamera();
    }, 500);
});

// 2. Camera & Scanning
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraFeed.srcObject = stream;
        isScanning = true;
        simulateScanning();
    } catch (err) {
        console.warn('Camera access denied, using static.');
        isScanning = true;
        simulateScanning(); // Still simulate scan on black screen
    }
}

function simulateScanning() {
    // Move the face box randomly until "locked"
    const moveBox = () => {
        if (isLocked) return;

        // Random position
        const x = 30 + Math.random() * 40; // %
        const y = 30 + Math.random() * 40; // %

        faceBox.style.left = x + '%';
        faceBox.style.top = y + '%';
        faceBox.classList.remove('hidden'); // flicker

        playSound(800, 'sine', 0.05); // blip

        setTimeout(() => {
            if (!isLocked) requestAnimationFrame(moveBox);
        }, 1000 + Math.random() * 2000);
    };

    // Auto-Lock after 5 seconds
    setTimeout(() => {
        lockTarget();
    }, 5000);

    moveBox();
}

function lockTarget() {
    isLocked = true;
    faceBox.style.left = '50%';
    faceBox.style.top = '50%';
    faceBox.style.borderColor = '#ff0055';
    faceBox.classList.remove('hidden');

    document.querySelector('.lock-text').innerText = "TARGET_LOCKED";

    // Play Lock Sound
    playSound(1200, 'sawtooth', 0.1);
    setTimeout(() => playSound(1200, 'sawtooth', 0.1), 100);
}

// 3. Controls
depthSlider.addEventListener('input', (e) => {
    // Update visuals if we want
    playSound(200 + e.target.value * 5, 'sine', 0.02);
});

cmdBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isLocked) return; // Can't select valid cmd until lock? Or maybe allowed.

        // Select logic
        cmdBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedCmd = btn.dataset.cmd;

        // Enable Execute
        executeBtn.removeAttribute('disabled');
        playSound(600, 'square', 0.05);
    });
});

executeBtn.addEventListener('click', () => {
    if (!selectedCmd) return;
    startHypnosis();
});

// 4. Execution (Spiral)
let spiralParams = { angle: 0 };

function startHypnosis() {
    effectCanvas.classList.remove('hidden');
    effectCanvas.width = mainInterface.offsetWidth;
    effectCanvas.height = mainInterface.offsetHeight;

    // Sound loop
    startIsochronicTone();

    animateSpiral();
}

function animateSpiral() {
    const ctx = effectCanvas.getContext('2d');
    const w = effectCanvas.width;
    const h = effectCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spiralParams.angle);

    // Anime "Eye" Spiral
    ctx.lineWidth = 15;
    for (let i = 0; i < 10; i++) {
        const r = i * 25 + (Date.now() / 20) % 25;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? '#ff0055' : 'transparent';
        ctx.stroke();
    }

    ctx.restore();

    spiralParams.angle += 0.2;
    effectFrameId = requestAnimationFrame(animateSpiral);
}

// Audio System
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let pulseInterval;

function playSound(freq, type, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function startIsochronicTone() {
    // Simple pulse loop
    if (pulseInterval) clearInterval(pulseInterval);

    pulseInterval = setInterval(() => {
        playSound(150, 'sawtooth', 0.1);
    }, 200); // 5Hz Theta
}

// Reset
document.querySelector('[data-cmd="reset"]').addEventListener('click', () => {
    cancelAnimationFrame(effectFrameId);
    effectCanvas.classList.add('hidden');
    clearInterval(pulseInterval);
    // Reset selection
    isLocked = false;
    simulateScanning();
    executeBtn.setAttribute('disabled', true);
    cmdBtns.forEach(b => b.classList.remove('selected'));
    selectedCmd = null;
    document.querySelector('.lock-text').innerText = "SEARCHING...";
    faceBox.style.borderColor = '#ff0055';
});
