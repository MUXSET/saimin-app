// Navigation & Routing
const screens = {
    splash: document.getElementById('screen-splash'),
    home: document.getElementById('screen-home'),
    scan: document.getElementById('screen-scan'),
    control: document.getElementById('screen-control'),
    effect: document.getElementById('screen-effect')
};

const navItems = document.querySelectorAll('.tab-item');

function showScreen(screenId) {
    // Hide all
    Object.values(screens).forEach(el => el.classList.remove('active'));
    // Show specific
    const screenEl = document.getElementById(screenId);
    if (screenEl) screenEl.classList.add('active');

    // Update Tab Bar
    navItems.forEach(item => {
        if (item.dataset.target === screenId) item.classList.add('active');
        else item.classList.remove('active');
    });
}

// 1. App Boot Logic
document.addEventListener('DOMContentLoaded', () => {
    // Splash Timer
    setTimeout(() => {
        showScreen('screen-home');
        // Hide splash after transition locally if needed, but 'active' toggle works
        screens.splash.classList.remove('active');
    }, 2500);

    // Tab Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            if (target) showScreen(target);
        });
    });

    // Button: Go to Scan
    document.getElementById('btn-goto-scan').addEventListener('click', () => {
        showScreen('screen-scan');
        startScanSim();
    });

    // Button: Back to Home
    document.getElementById('back-to-home').addEventListener('click', () => {
        showScreen('screen-home');
        resetScan();
    });
});

// 2. Scan Logic
const targetFrame = document.querySelector('.target-frame');
const scanStatus = document.getElementById('scan-status-text');
const scanControls = document.getElementById('scan-controls');
let scanTimer;

function startScanSim() {
    resetScan();
    scanStatus.innerText = '周囲の信号を検索中...';

    // Fake delay
    scanTimer = setTimeout(() => {
        targetFrame.classList.add('locked');
        scanStatus.innerText = '接続確立: 被験者-093';
        scanControls.classList.remove('hidden');
        playSound(1000, 0.2); // Beep
    }, 2500);
}

function resetScan() {
    clearTimeout(scanTimer);
    targetFrame.classList.remove('locked');
    scanControls.classList.add('hidden');
    scanStatus.innerText = '待機中';
}

// Button: Start Hypno Session (Go to Control)
document.getElementById('btn-start-hypno').addEventListener('click', () => {
    showScreen('screen-control');
});

// 3. Command Logic
document.querySelectorAll('.cmd-tile').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.dataset.text;
        triggerEffect(text);
    });
});

const effectLayer = document.getElementById('screen-effect');
const hypnoText = document.getElementById('hypno-text');
const hypnoBar = document.getElementById('hypno-bar');

function triggerEffect(text) {
    effectLayer.classList.remove('hidden');
    hypnoText.innerText = text;
    playSound(400, 0.4); // Deep sound

    // Progress Bar
    hypnoBar.style.width = '0%';
    let p = 0;
    const interval = setInterval(() => {
        p += 2;
        hypnoBar.style.width = p + '%';
        if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                effectLayer.classList.add('hidden');
            }, 500);
        }
    }, 50);
}

// Simple Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}
