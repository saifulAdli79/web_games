/**
 * TETRIS WARNA-WARNI - ENJIN PERMAINAN PELAYAR WEB CHROME
 */

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 10 * 30 = 300px lebar, 20 * 30 = 600px tinggi

// Warna-warni Neon Tetromino
const COLORS = {
  0: null,
  'I': { main: '#00f0ff', light: '#80f8ff', dark: '#009bb3' }, // Cyan
  'O': { main: '#ffe600', light: '#fff380', dark: '#b3a100' }, // Kuning
  'T': { main: '#b537f7', light: '#d88aff', dark: '#7415a6' }, // Ungu Neon
  'S': { main: '#00ff66', light: '#80ffb3', dark: '#00b347' }, // Hijau Neon
  'Z': { main: '#ff1744', light: '#ff8a9e', dark: '#b30024' }, // Merah Neon
  'J': { main: '#2979ff', light: '#85b4ff', dark: '#004ecb' }, // Biru Elektrik
  'L': { main: '#ff9100', light: '#ffc480', dark: '#b36500' }  // Oren Terang
};

// Bentuk-bentuk Tetromino (Matriks Putaran Asas)
const PIECES = {
  'I': [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'O': [
    [1, 1],
    [1, 1]
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'S': [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  'J': [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'L': [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

// Canvas & Konteks Grafik
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

// Elemen UI
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');

// Pembolehubah Permainan
let board = createBoard();
let score = 0;
let lines = 0;
let level = 1;
let highScore = parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
highScoreElement.textContent = highScore;

let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

let isGameOver = false;
let isPaused = false;
let isPlaying = false;
let animationId = null;

// Partikel animasi kesan letupan garisan
let particles = [];

// Rawak 7-Bag System (Tetris Standard Rasmi)
let bag = [];
function getNextFromBag() {
  if (bag.length === 0) {
    bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    // Kocok beg
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return bag.pop();
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function spawnPiece(type) {
  const shape = PIECES[type];
  return {
    type: type,
    shape: shape,
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: type === 'I' ? -1 : 0
  };
}

// Semak perlanggaran (Collision Detection)
function collide(board, piece) {
  const m = piece.shape;
  const o = { x: piece.x, y: piece.y };
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0) {
        const boardY = y + o.y;
        const boardX = x + o.x;

        // Semak sempadan kiri/kanan/bawah
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
          return true;
        }
        // Semak jika terkena blok sedia ada
        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

// Cantumkan blok ke dalam papan permainan
function merge(board, piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const by = y + piece.y;
        const bx = x + piece.x;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          board[by][bx] = piece.type;
        }
      }
    });
  });
}

// Putaran Matriks (Clockwise)
function rotateMatrix(matrix) {
  const N = matrix.length;
  const result = matrix.map((_, i) =>
    matrix.map(row => row[i]).reverse()
  );
  return result;
}

function playerRotate() {
  if (!isPlaying || isPaused || isGameOver) return;
  const originalShape = currentPiece.shape;
  const rotated = rotateMatrix(currentPiece.shape);
  const oldX = currentPiece.x;

  currentPiece.shape = rotated;

  // Wall-kick asas: anjak sedikit jika terkena dinding
  let offset = 1;
  while (collide(board, currentPiece)) {
    currentPiece.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (Math.abs(offset) > currentPiece.shape[0].length) {
      // Putaran gagal kerana ruang terlalu sempit
      currentPiece.shape = originalShape;
      currentPiece.x = oldX;
      return;
    }
  }

  window.soundFX.rotate();
}

function playerMove(dir) {
  if (!isPlaying || isPaused || isGameOver) return;
  currentPiece.x += dir;
  if (collide(board, currentPiece)) {
    currentPiece.x -= dir;
  } else {
    window.soundFX.move();
  }
}

function playerDrop() {
  if (!isPlaying || isPaused || isGameOver) return;
  currentPiece.y++;
  if (collide(board, currentPiece)) {
    currentPiece.y--;
    lockPiece();
  } else {
    dropCounter = 0;
  }
}

function playerHardDrop() {
  if (!isPlaying || isPaused || isGameOver) return;
  let dropDistance = 0;
  while (!collide(board, currentPiece)) {
    currentPiece.y++;
    dropDistance++;
  }
  currentPiece.y--;
  dropDistance--;

  score += dropDistance * 2;
  updateScoreUI();
  window.soundFX.drop();
  lockPiece();
}

function playerHold() {
  if (!isPlaying || isPaused || isGameOver || !canHold) return;

  window.soundFX.hold();
  if (holdPiece === null) {
    holdPiece = currentPiece.type;
    currentPiece = spawnPiece(nextPiece);
    nextPiece = getNextFromBag();
  } else {
    const temp = holdPiece;
    holdPiece = currentPiece.type;
    currentPiece = spawnPiece(temp);
  }

  canHold = false;
  drawHoldPreview();
  drawNextPreview();
}

// Kunci blok dan periksa garisan penuh
function lockPiece() {
  merge(board, currentPiece);
  window.soundFX.drop();
  canHold = true;

  clearLines();

  // Ambil blok baru
  currentPiece = spawnPiece(nextPiece);
  nextPiece = getNextFromBag();
  drawNextPreview();

  // Semak Game Over jika blok baru terus berlanggar
  if (collide(board, currentPiece)) {
    triggerGameOver();
  }
}

// Menghapus garisan penuh dengan kesan letupan partikel
function clearLines() {
  let linesCleared = 0;
  const clearedRows = [];

  outer: for (let y = ROWS - 1; y >= 0; --y) {
    for (let x = 0; x < COLS; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }

    clearedRows.push(y);
    const row = board.splice(y, 1)[0];
    board.unshift(new Array(COLS).fill(0));
    linesCleared++;
    y++; // Periksa baris sama lagi kerana baris atas telah turun
  }

  if (linesCleared > 0) {
    // Cipta zarah/partikel berwarna
    clearedRows.forEach(rowY => {
      createLineClearParticles(rowY);
    });

    // Pengiraan markah rasmi Tetris
    const scoreMultipliers = [0, 100, 300, 500, 800];
    score += scoreMultipliers[linesCleared] * level;
    lines += linesCleared;

    // Tingkatkan level setiap 10 baris
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);

    if (linesCleared === 4) {
      window.soundFX.tetrisClear();
    } else {
      window.soundFX.lineClear();
    }

    updateScoreUI();
  }
}

// Sistem Partikel
function createLineClearParticles(rowY) {
  for (let x = 0; x < COLS; x++) {
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: rowY * BLOCK_SIZE + BLOCK_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 5 + 3,
        color: ['#00f0ff', '#ff007f', '#ffe600', '#00ff66', '#ffffff'][Math.floor(Math.random() * 5)],
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Lukis Blok Warna-Warni dengan Efek Bevel & Cahaya Neon
function drawBlock(context, x, y, type, isGhost = false) {
  const colorData = COLORS[type];
  if (!colorData) return;

  const px = x * BLOCK_SIZE;
  const py = y * BLOCK_SIZE;

  if (isGhost) {
    // Blok bayang (Ghost piece)
    context.save();
    context.strokeStyle = colorData.main;
    context.fillStyle = 'rgba(255, 255, 255, 0.04)';
    context.lineWidth = 1.5;
    context.strokeRect(px + 1.5, py + 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3);
    context.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
    context.restore();
    return;
  }

  // Badan Utama Blok
  context.fillStyle = colorData.main;
  context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);

  // Sudut Cerah (Atas & Kiri)
  context.fillStyle = colorData.light;
  context.fillRect(px, py, BLOCK_SIZE, 3);
  context.fillRect(px, py, 3, BLOCK_SIZE);

  // Sudut Gelap (Bawah & Kanan untuk Efek 3D)
  context.fillStyle = colorData.dark;
  context.fillRect(px, py + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
  context.fillRect(px + BLOCK_SIZE - 3, py, 3, BLOCK_SIZE);

  // Garis Sempadan Halus
  context.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  context.lineWidth = 1;
  context.strokeRect(px + 0.5, py + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

// Dapatkan kedudukan Ghost Piece (di mana blok akan jatuh)
function getGhostPiece() {
  const ghost = {
    type: currentPiece.type,
    shape: currentPiece.shape,
    x: currentPiece.x,
    y: currentPiece.y
  };

  while (!collide(board, ghost)) {
    ghost.y++;
  }
  ghost.y--;
  return ghost;
}

// Lukis Seluruh Papan Permainan
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid latar belakang yang halus
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
  }

  // Lukis blok pegun di papan
  for (let y = 0; y < ROWS; ++y) {
    for (let x = 0; x < COLS; ++x) {
      if (board[y][x] !== 0) {
        drawBlock(ctx, x, y, board[y][x]);
      }
    }
  }

  // Lukis Ghost Piece & Blok Aktif
  if (currentPiece && isPlaying && !isGameOver) {
    const ghost = getGhostPiece();
    ghost.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(ctx, ghost.x + x, ghost.y + y, ghost.type, true);
        }
      });
    });

    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.type);
        }
      });
    });
  }

  // Lukis zarah letupan
  drawParticles();
}

// Paparan Kotak Pratonton (Next & Hold)
function drawPreviewPiece(context, canvasEl, pieceType) {
  context.clearRect(0, 0, canvasEl.width, canvasEl.height);
  if (!pieceType) return;

  const shape = PIECES[pieceType];
  const size = 22; // saiz kecil untuk preview
  const offsetX = (canvasEl.width - shape[0].length * size) / 2;
  const offsetY = (canvasEl.height - shape.length * size) / 2;

  shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const colorData = COLORS[pieceType];
        const px = offsetX + x * size;
        const py = offsetY + y * size;

        context.fillStyle = colorData.main;
        context.fillRect(px, py, size, size);

        context.fillStyle = colorData.light;
        context.fillRect(px, py, size, 2);
        context.fillRect(px, py, 2, size);

        context.fillStyle = colorData.dark;
        context.fillRect(px, py + size - 2, size, 2);
        context.fillRect(px + size - 2, py, 2, size);

        context.strokeStyle = 'rgba(0,0,0,0.3)';
        context.strokeRect(px, py, size, size);
      }
    });
  });
}

function drawNextPreview() {
  drawPreviewPiece(nextCtx, nextCanvas, nextPiece);
}

function drawHoldPreview() {
  drawPreviewPiece(holdCtx, holdCanvas, holdPiece);
}

// Kemas Kini UI Markah
function updateScoreUI() {
  scoreElement.textContent = score;
  levelElement.textContent = level;
  linesElement.textContent = lines;

  if (score > highScore) {
    highScore = score;
    highScoreElement.textContent = highScore;
    localStorage.setItem('tetris_high_score', highScore.toString());
  }
}

// Gelung Utama Animasi (Game Loop)
function gameLoop(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (isPlaying && !isPaused && !isGameOver) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  updateParticles();
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

// Pengendalian Mula / Tamat / Pause
function startGame() {
  window.soundFX.init();
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;
  dropCounter = 0;
  particles = [];
  holdPiece = null;
  canHold = true;
  isGameOver = false;
  isPaused = false;
  isPlaying = true;

  bag = [];
  nextPiece = getNextFromBag();
  currentPiece = spawnPiece(getNextFromBag());

  updateScoreUI();
  drawNextPreview();
  drawHoldPreview();

  overlay.classList.add('hidden');
  lastTime = performance.now();
}

function triggerGameOver() {
  isGameOver = true;
  isPlaying = false;
  window.soundFX.gameOver();

  overlayTitle.textContent = "TAMAT PERMAINAN";
  overlayTitle.style.color = "#ff1744";
  overlayMessage.innerHTML = `Markah Anda: <strong>${score}</strong><br>Level: <strong>${level}</strong>`;
  startBtn.textContent = "MAIN SEMULA (R)";
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!isPlaying || isGameOver) return;
  isPaused = !isPaused;

  if (isPaused) {
    overlayTitle.textContent = "JEDA (PAUSED)";
    overlayTitle.style.color = "#00f0ff";
    overlayMessage.textContent = "Permainan sedang dihentikan seketika.";
    startBtn.textContent = "SAMBUNG (P)";
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    lastTime = performance.now();
  }
}

// Kawalan Papan Kekunci PC (Keyboard Listeners)
window.addEventListener('keydown', (event) => {
  // Cegah scroll pada anak panah dan spacebar
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }

  if (isGameOver) {
    if (event.code === 'KeyR' || event.code === 'Space') {
      startGame();
    }
    return;
  }

  if (!isPlaying) {
    if (event.code === 'Space' || event.code === 'Enter') {
      startGame();
    }
    return;
  }

  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA':
      playerMove(-1);
      break;

    case 'ArrowRight':
    case 'KeyD':
      playerMove(1);
      break;

    case 'ArrowUp':
    case 'KeyW':
      playerRotate();
      break;

    case 'ArrowDown':
    case 'KeyS':
      playerDrop();
      score += 1;
      updateScoreUI();
      break;

    case 'Space':
      playerHardDrop();
      break;

    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':
      playerHold();
      break;

    case 'KeyP':
    case 'Escape':
      togglePause();
      break;

    case 'KeyR':
      startGame();
      break;
  }
});

// Butang Mula / Pause pada Paparan Skrin
startBtn.addEventListener('click', () => {
  if (!isPlaying || isGameOver) {
    startGame();
  } else if (isPaused) {
    togglePause();
  }
});

// Suis Bunyi
soundToggleBtn.addEventListener('click', () => {
  const enabled = window.soundFX.toggle();
  soundToggleBtn.textContent = enabled ? "🔊 Bunyi: HIDUP" : "🔈 Bunyi: PADAM";
});

// Mula gelung animasi
draw();
requestAnimationFrame(gameLoop);
