// DOM Elements
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('status-text');
const targetName = document.getElementById('target-name');
const syncFill = document.getElementById('sync-fill');
const syncPercent = document.getElementById('sync-percent');
const syncRing = document.querySelector('.sync-ring');
const cmdBtns = document.querySelectorAll('.cmd-btn');
const executeBtn = document.getElementById('execute-btn');
const commandLog = document.getElementById('command-log');
const effectOverlay = document.getElementById('effect-overlay');
const spiralCanvas = document.getElementById('spiral-canvas');
const commandDisplay = document.getElementById('command-display');

// State
let appState = 'standby'; // standby, scanning, syncing, ready
let selectedCmd = null;
let selectedText = null;
let syncLevel = 0;
let spiralAnimationId = null;

// Audio Context
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(freq, duration = 0.1, type = 'sine') {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

// Logging
function addLog(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `> ${message}`;
    commandLog.appendChild(entry);
    commandLog.scrollTop = commandLog.scrollHeight;
}

// State Machine
function setState(newState) {
    appState = newState;

    switch (newState) {
        case 'standby':
            statusText.textContent = '待機中';
            statusDot.className = 'status-dot';
            break;
        case 'scanning':
            statusText.textContent = 'スキャン中';
            statusDot.className = 'status-dot syncing';
            syncRing.classList.add('active');
            break;
        case 'syncing':
            statusText.textContent = '同期中';
            statusDot.className = 'status-dot syncing';
            break;
        case 'ready':
            statusText.textContent = '接続完了';
            statusDot.className = 'status-dot active';
            syncRing.classList.remove('active');
            break;
    }
}

// Target Detection Simulation
function startScanning() {
    setState('scanning');
    addLog('ターゲットをスキャン中...', 'system');
    playTone(400, 0.15);

    // Simulate finding a target
    setTimeout(() => {
        const names = ['対象者A', '被験者001', 'ターゲット', '認識対象'];
        targetName.textContent = names[Math.floor(Math.random() * names.length)];
        addLog('ターゲット検出', 'system');
        playTone(800, 0.1);
        playTone(1000, 0.1);
        startSyncing();
    }, 2000);
}

function startSyncing() {
    setState('syncing');
    addLog('同期開始...', 'system');

    const syncInterval = setInterval(() => {
        syncLevel += Math.random() * 15 + 5;
        if (syncLevel >= 100) {
            syncLevel = 100;
            clearInterval(syncInterval);
            syncComplete();
        }
        updateSyncDisplay();
        playTone(200 + syncLevel * 5, 0.05);
    }, 300);
}

function updateSyncDisplay() {
    syncFill.style.width = syncLevel + '%';
    syncPercent.textContent = Math.floor(syncLevel) + '%';
}

function syncComplete() {
    setState('ready');
    addLog('同期完了 - 指令待機中', 'success');
    playTone(1200, 0.2);
    setTimeout(() => playTone(1500, 0.2), 100);
}

// Command Selection
cmdBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (appState !== 'ready') return;

        // Deselect others
        cmdBtns.forEach(b => b.classList.remove('selected'));

        // Select this one
        btn.classList.add('selected');
        selectedCmd = btn.dataset.cmd;
        selectedText = btn.dataset.text;

        // Enable execute
        executeBtn.removeAttribute('disabled');

        playTone(600, 0.08);
        addLog(`指令選択: ${btn.querySelector('.cmd-text').textContent}`, 'command');
    });
});

// Execute Command
executeBtn.addEventListener('click', () => {
    if (!selectedCmd || appState !== 'ready') return;

    addLog(`指令実行: ${selectedText}`, 'command');
    playTone(300, 0.3, 'sawtooth');

    showEffect();
});

// Effect Display
function showEffect() {
    effectOverlay.classList.remove('hidden');
    commandDisplay.textContent = selectedText;
    commandDisplay.style.animation = 'none';
    void commandDisplay.offsetWidth;
    commandDisplay.style.animation = 'fadeInOut 4s ease forwards';

    startSpiral();
    startHypnoticSound();

    // End effect after duration
    setTimeout(() => {
        stopSpiral();
        effectOverlay.classList.add('hidden');
        addLog('指令完了', 'success');
        playTone(800, 0.2);
        playTone(1000, 0.2);

        // Reset selection
        cmdBtns.forEach(b => b.classList.remove('selected'));
        selectedCmd = null;
        selectedText = null;
        executeBtn.setAttribute('disabled', true);
    }, 4500);
}

// Spiral Animation
let spiralAngle = 0;

function startSpiral() {
    spiralCanvas.width = window.innerWidth;
    spiralCanvas.height = window.innerHeight;
    animateSpiral();
}

function animateSpiral() {
    const ctx = spiralCanvas.getContext('2d');
    const w = spiralCanvas.width;
    const h = spiralCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spiralAngle);

    // Draw spiral rings
    const maxRadius = Math.max(w, h);
    const ringCount = 15;

    for (let i = 0; i < ringCount; i++) {
        const radius = (i * 60 + (Date.now() / 10) % 60);
        if (radius > maxRadius) continue;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);

        // Alternating pink and purple
        if (i % 2 === 0) {
            ctx.strokeStyle = '#ff6b9d';
            ctx.lineWidth = 25;
        } else {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 20;
        }
        ctx.stroke();
    }

    ctx.restore();

    spiralAngle += 0.08;
    spiralAnimationId = requestAnimationFrame(animateSpiral);
}

function stopSpiral() {
    if (spiralAnimationId) {
        cancelAnimationFrame(spiralAnimationId);
        spiralAnimationId = null;
    }
}

// Hypnotic Sound
let hypnoInterval = null;

function startHypnoticSound() {
    if (hypnoInterval) clearInterval(hypnoInterval);

    let tick = 0;
    hypnoInterval = setInterval(() => {
        playTone(150 + (tick % 2) * 50, 0.1, 'sine');
        tick++;
    }, 250);

    // Stop after effect duration
    setTimeout(() => {
        if (hypnoInterval) {
            clearInterval(hypnoInterval);
            hypnoInterval = null;
        }
    }, 4000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    addLog('アプリケーション起動', 'system');

    // Start scanning after a moment
    setTimeout(() => {
        startScanning();
    }, 1500);
});

// Touch feedback
document.addEventListener('touchstart', () => {
    // Ensure audio context is ready
    getAudioContext();
}, { once: true });
