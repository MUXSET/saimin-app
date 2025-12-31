// Screens
const homeScreen = document.getElementById('home-screen');
const mainScreen = document.getElementById('main-screen');
const effectScreen = document.getElementById('effect-screen');

// Home
const launchApp = document.getElementById('launch-app');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');

// Main
const backBtn = document.getElementById('back-btn');
const targetStatus = document.getElementById('target-status');
const controlBar = document.getElementById('control-bar');
const controlPct = document.getElementById('control-pct');
const hypnoBtn = document.getElementById('hypno-btn');
const commandBtns = document.querySelectorAll('.command-btn');
const logEl = document.getElementById('log');

// Effect
const spiralGif = document.getElementById('spiral-gif');
const effectText = document.getElementById('effect-text');
const effectBar = document.getElementById('effect-bar');

// State
let controlLevel = 0;
let isConnected = false;

// Audio
let audioCtx;
function beep(freq, dur = 0.1, type = 'sine') {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

// Update time
function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}
updateTime();
setInterval(updateTime, 1000);

// Log
function log(msg, type = '') {
    const line = document.createElement('div');
    line.className = 'log-line ' + type;
    line.textContent = '> ' + msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
}

// Show screen
function showScreen(screen) {
    [homeScreen, mainScreen, effectScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Launch App from Home
launchApp.addEventListener('click', () => {
    beep(800, 0.1);
    showScreen(mainScreen);
    if (!isConnected) {
        startScan();
    }
});

// Back to Home
backBtn.addEventListener('click', () => {
    beep(400, 0.1);
    showScreen(homeScreen);
});

// Scan for target
function startScan() {
    log('ターゲット検索中...');
    targetStatus.textContent = '検索中';
    targetStatus.className = 'value status-waiting';

    setTimeout(() => {
        beep(1000, 0.15);
        beep(1200, 0.15);
        isConnected = true;
        targetStatus.textContent = '接続完了';
        targetStatus.className = 'value status-connected';
        hypnoBtn.removeAttribute('disabled');
        log('ターゲット捕捉', 'ok');
    }, 2500);
}

// Update control display
function updateControl() {
    controlBar.style.width = controlLevel + '%';
    controlPct.textContent = controlLevel + '%';

    if (controlLevel >= 50) {
        targetStatus.textContent = '支配中';
        targetStatus.className = 'value status-controlled';
        commandBtns.forEach(btn => btn.removeAttribute('disabled'));
    }
}

// Hypnosis
hypnoBtn.addEventListener('click', () => {
    if (!isConnected) return;
    log('催眠開始', 'cmd');
    beep(300, 0.2, 'sawtooth');
    runEffect('深く落ちろ...', 3000, () => {
        controlLevel = Math.min(100, controlLevel + 30);
        updateControl();
        log('催眠成功 - 支配率上昇', 'ok');
    });
});

// Commands
commandBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.dataset.text;
        log(`コマンド: ${text}`, 'cmd');
        beep(600, 0.1);
        runEffect(text, 2000, () => {
            log('実行完了', 'ok');
        });
    });
});

// Run Effect
function runEffect(text, duration, callback) {
    showScreen(effectScreen);
    effectText.textContent = text;
    effectBar.style.width = '0%';

    // Animate bar
    let start = Date.now();
    function tick() {
        let elapsed = Date.now() - start;
        let pct = Math.min(100, (elapsed / duration) * 100);
        effectBar.style.width = pct + '%';

        if (elapsed < duration) {
            requestAnimationFrame(tick);
        } else {
            // Done
            beep(800, 0.15);
            setTimeout(() => {
                showScreen(mainScreen);
                if (callback) callback();
            }, 300);
        }
    }
    tick();

    // Audio pulse
    let pulseInt = setInterval(() => beep(150, 0.08, 'sine'), 200);
    setTimeout(() => clearInterval(pulseInt), duration);
}

// Enable audio on interaction
document.addEventListener('click', () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}, { once: true });
