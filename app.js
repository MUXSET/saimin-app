// DOM Elements
const mainScreen = document.getElementById('main-screen');
const effectScreen = document.getElementById('effect-screen');
const statusLabel = document.getElementById('status-label');
const levelFill = document.getElementById('level-fill');
const levelText = document.getElementById('level-text');
const mainBtn = document.getElementById('main-btn');
const subCmds = document.querySelectorAll('.cmd-btn.small');
const historyLog = document.getElementById('history-log');
const effectText = document.getElementById('effect-text');
const effectBar = document.getElementById('effect-bar');
const targetFrame = document.querySelector('.target-frame');
const scanEffect = document.querySelector('.scan-effect');
const statusDots = document.querySelector('.status-dots');

// State
let controlLevel = 0;
let isConnected = false;

// Audio
let audioCtx = null;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function beep(freq, dur = 0.1, type = 'sine') {
    const ctx = getAudio();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
}

// Logging
function log(msg, type = '') {
    const item = document.createElement('div');
    item.className = 'log-item ' + type;
    item.textContent = '> ' + msg;
    historyLog.appendChild(item);
    historyLog.scrollTop = historyLog.scrollHeight;
}

// Initialize - Start Scanning
function init() {
    log('ターゲット検索中...');

    // Simulate finding target
    setTimeout(() => {
        beep(800, 0.1);
        beep(1000, 0.15);
        statusLabel.textContent = '接続完了';
        statusDots.style.display = 'none';
        targetFrame.classList.add('connected');
        scanEffect.style.animation = 'none';
        isConnected = true;
        log('ターゲット捕捉', 'success');

        // Enable main button
        mainBtn.removeAttribute('disabled');
    }, 3000);
}

// Main Hypnosis Button
mainBtn.addEventListener('click', () => {
    if (!isConnected) return;
    startHypnosis();
});

// Sub Commands
subCmds.forEach(btn => {
    btn.addEventListener('click', () => {
        if (controlLevel < 50) {
            log('支配レベル不足', 'command');
            beep(200, 0.2, 'sawtooth');
            return;
        }

        const cmd = btn.dataset.cmd;
        const cmdText = btn.querySelector('span:last-child').textContent;
        executeCommand(cmd, cmdText);
    });
});

// Start Hypnosis Effect
function startHypnosis() {
    log('催眠開始...', 'command');
    beep(300, 0.3, 'sawtooth');

    // Show effect screen
    mainScreen.classList.remove('active');
    effectScreen.classList.add('active');
    effectText.textContent = '見つめろ...';

    // Progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 2;
        effectBar.style.width = progress + '%';

        // Change text
        if (progress === 30) effectText.textContent = '深く...';
        if (progress === 60) effectText.textContent = '落ちろ...';
        if (progress === 90) effectText.textContent = '服従しろ';

        // Beep
        if (progress % 10 === 0) beep(150 + progress * 2, 0.1);

        if (progress >= 100) {
            clearInterval(progressInterval);
            endHypnosis();
        }
    }, 50);
}

function endHypnosis() {
    beep(1000, 0.2);
    beep(1200, 0.3);

    // Increase control level
    controlLevel = Math.min(100, controlLevel + 25);
    updateLevel();

    // Return to main
    setTimeout(() => {
        effectScreen.classList.remove('active');
        mainScreen.classList.add('active');
        log('催眠成功 - 支配レベル上昇', 'success');

        // Enable sub commands if level high enough
        if (controlLevel >= 50) {
            subCmds.forEach(btn => btn.removeAttribute('disabled'));
        }
    }, 500);
}

function updateLevel() {
    levelFill.style.width = controlLevel + '%';
    levelText.textContent = controlLevel + '%';
}

// Execute Sub Command
function executeCommand(cmd, text) {
    log(`指令実行: ${text}`, 'command');
    beep(600, 0.1);

    // Show effect briefly
    mainScreen.classList.remove('active');
    effectScreen.classList.add('active');

    effectText.textContent = text;
    effectBar.style.width = '0%';

    let p = 0;
    const pInt = setInterval(() => {
        p += 5;
        effectBar.style.width = p + '%';
        if (p >= 100) {
            clearInterval(pInt);

            setTimeout(() => {
                effectScreen.classList.remove('active');
                mainScreen.classList.add('active');
                log(`${text} - 完了`, 'success');
                beep(800, 0.15);
            }, 300);
        }
    }, 30);
}

// Touch to enable audio
document.addEventListener('touchstart', () => getAudio(), { once: true });
document.addEventListener('click', () => getAudio(), { once: true });

// Start
document.addEventListener('DOMContentLoaded', init);
