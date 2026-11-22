/**
 * GOOGLE PAC-MAN DOODLE - ENJIN PERMAINAN PELAYAR CHROME
 * Menyokong Mod Google Doodle ("GOOGLE" 58x17) & Mod Labirin Klasik (28x31)
 */

const canvas = document.getElementById('pacmanCanvas');
const ctx = canvas.getContext('2d');

// -----------------------------------------------------------------------------
// PETA 1: GOOGLE PAC-MAN DOODLE (58 Kolum x 17 Baris)
// -----------------------------------------------------------------------------
const GOOGLE_MAP = [
  '##########################################################', // 0
  '#O...........##...............##...............##.......O#', // 1
  '#.#####.####.##.#####.#######.##.#######.#####.##.######.#', // 2
  '#.#####.####.##.#####.#######.##.#######.#####.##.######.#', // 3
  '#........................................................#', // 4
  '#.#######..######...######..###--###..######..##...#####.#', // 5 (Pintu '--' di kolum 27-28)
  '#.#........######...######..#      #..######..##...#####.#', // 6
  '#.#..####..######...######..#      #..######..##...#####.#', // 7
  '#.#.....#..######...######..#      #..######..##...#####.#', // 8 (Terowong Tembus kiri & kanan)
  '#.#.###.#..######...######..#      #..######..##...#.....#', // 9
  '#.#...#.#..######...######..########..######..##...#...#.#', // 10
  '#.#####.#..######...######............######..##...#####.#', // 11
  '#........................................................#', // 12
  '#.#####.####.##.#####.#######.##.#######.#####.##.######.#', // 13
  '#.#####.####.##.#####.#######.##.#######.#####.##.######.#', // 14
  '#O...........##...............##...............##.......O#', // 15
  '##########################################################'  // 16
];

// -----------------------------------------------------------------------------
// PETA 2: LABIRIN KLASIK 1980 (28 Kolum x 31 Baris)
// -----------------------------------------------------------------------------
const CLASSIC_MAP = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#O####.#####.##.#####.####O#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.#####.##.#####.######",
  "     #.#####.##.#####.#     ",
  "     #.              .#     ",
  "     #.## ###--### ##.#     ",
  "######.## #      # ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "     #.## ######## ##.#     ",
  "     #.##          ##.#     ",
  "     #.## ######## ##.#     ",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#O..##................##..O#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################"
];

// Status Mod
let currentMode = 'google'; // 'google' atau 'classic'
let TILE_SIZE = 15;
let COLS = 58;
let ROWS = 17;
let currentMapTemplate = GOOGLE_MAP;

let map = [];
let totalPellets = 0;
let pelletsEaten = 0;

// UI Elemen
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const livesContainer = document.getElementById('livesContainer');
const levelBadge = document.getElementById('levelBadge');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const insertCoinBtn = document.getElementById('insertCoinBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const modeGoogleBtn = document.getElementById('modeGoogleBtn');
const modeClassicBtn = document.getElementById('modeClassicBtn');

// Status Permainan
let score = 0;
let highScore = parseInt(localStorage.getItem('pacman_high_score') || '10000', 10);
highScoreEl.textContent = formatScore(highScore);
let lives = 3;
let level = 1;
let isPlaying = false;
let isPaused = false;
let isGameOver = false;

let frightenedTimer = 0;
let ghostEatMultiplier = 1;
let gameTick = 0;

function formatScore(n) {
  return n === 0 ? '00' : n.toString();
}

// Objek Pac-Man
const pacman = {
  x: 0,
  y: 0,
  speed: 2,
  dirX: 0,
  dirY: 0,
  nextDirX: -1,
  nextDirY: 0,
  radius: 6.5,
  mouthAngle: 0.2,
  mouthSpeed: 0.05,
  mouthMax: 0.35,
  mouthOpening: true,
  angle: Math.PI
};

// Objek 4 Hantu
const GHOST_COLORS = {
  blinky: '#ff0000', // Merah
  pinky:  '#ffb8ff', // Merah jambu
  inky:   '#00ffff', // Sian
  clyde:  '#ffb852'  // Oren
};

let ghosts = [];

// Tetapan Konfigurasi Mod
function setGameMode(mode) {
  currentMode = mode;
  if (mode === 'google') {
    TILE_SIZE = 15;
    COLS = 58;
    ROWS = 17;
    currentMapTemplate = GOOGLE_MAP;
    canvas.width = 870;
    canvas.height = 255;
    modeGoogleBtn.classList.add('active');
    modeClassicBtn.classList.remove('active');
  } else {
    TILE_SIZE = 16;
    COLS = 28;
    ROWS = 31;
    currentMapTemplate = CLASSIC_MAP;
    canvas.width = 448;
    canvas.height = 496;
    modeClassicBtn.classList.add('active');
    modeGoogleBtn.classList.remove('active');
  }

  resetMap();
  resetPositions();
  draw();
}

function initGhosts() {
  if (currentMode === 'google') {
    // Rumah hantu Google berada di kolum 26-30, baris 6-9 (Pintu di baris 5, kolum 27-28)
    ghosts = [
      {
        name: 'blinky',
        color: GHOST_COLORS.blinky,
        x: 27.5 * TILE_SIZE,
        y: 4.5 * TILE_SIZE, // Di luar bumbung pintu
        dirX: -1,
        dirY: 0,
        mode: 'chase',
        state: 'active',
        lastTileX: 27,
        lastTileY: 4,
        exitDelay: 0,
        eaten: false,
        speed: 1.6
      },
      {
        name: 'pinky',
        color: GHOST_COLORS.pinky,
        x: 27.5 * TILE_SIZE,
        y: 7.5 * TILE_SIZE, // Dalam rumah
        dirX: 0,
        dirY: 1,
        mode: 'chase',
        state: 'in_house',
        lastTileX: 27,
        lastTileY: 7,
        exitDelay: 60,
        eaten: false,
        speed: 1.5
      },
      {
        name: 'inky',
        color: GHOST_COLORS.inky,
        x: 26.5 * TILE_SIZE,
        y: 7.5 * TILE_SIZE,
        dirX: 0,
        dirY: -1,
        mode: 'chase',
        state: 'in_house',
        lastTileX: 26,
        lastTileY: 7,
        exitDelay: 200,
        eaten: false,
        speed: 1.45
      },
      {
        name: 'clyde',
        color: GHOST_COLORS.clyde,
        x: 28.5 * TILE_SIZE,
        y: 7.5 * TILE_SIZE,
        dirX: 0,
        dirY: 1,
        mode: 'chase',
        state: 'in_house',
        lastTileX: 28,
        lastTileY: 7,
        exitDelay: 360,
        eaten: false,
        speed: 1.4
      }
    ];
  } else {
    // Mod Klasik (Baris 11-14)
    ghosts = [
      {
        name: 'blinky',
        color: GHOST_COLORS.blinky,
        x: 13.5 * TILE_SIZE,
        y: 11.5 * TILE_SIZE,
        dirX: -1,
        dirY: 0,
        mode: 'chase',
        state: 'active',
        lastTileX: 13,
        lastTileY: 11,
        exitDelay: 0,
        eaten: false,
        speed: 1.6
      },
      {
        name: 'pinky',
        color: GHOST_COLORS.pinky,
        x: 13.5 * TILE_SIZE,
        y: 14.5 * TILE_SIZE,
        dirX: 0,
        dirY: 1,
        mode: 'chase',
        state: 'in_house',
        lastTileX: 13,
        lastTileY: 14,
        exitDelay: 60,
        eaten: false,
        speed: 1.5
      },
      {
        name: 'inky',
        color: GHOST_COLORS.inky,
        x: 11.5 * TILE_SIZE,
        y: 14.5 * TILE_SIZE,
        dirX: 0,
        dirY: -1,
        mode: 'chase',
        state: 'in_house',
        lastTileX: 11,
        lastTileY: 14,
        exitDelay: 200,
        eaten: false,
        speed: 1.45
      },
      {
        name: 'clyde',
        color: GHOST_COLORS.clyde,
        x: 15.5 * TILE_SIZE,
        y: 14.5 * TILE_SIZE,
        dirX: 0,
        dirY: 1,
        mode: 'chase',
        state: 'in_house',
        lastTileX: 15,
        lastTileY: 14,
        exitDelay: 360,
        eaten: false,
        speed: 1.4
      }
    ];
  }
}

function resetMap() {
  map = currentMapTemplate.map(row => row.split(''));
  totalPellets = 0;
  pelletsEaten = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (map[r][c] === '.' || map[r][c] === 'O') {
        totalPellets++;
      }
    }
  }
}

function resetPositions() {
  if (currentMode === 'google') {
    pacman.x = 27.5 * TILE_SIZE;
    pacman.y = 12.5 * TILE_SIZE; // Di lorong bawah perkataan Google
  } else {
    pacman.x = 13.5 * TILE_SIZE;
    pacman.y = 23.5 * TILE_SIZE;
  }

  pacman.dirX = 0;
  pacman.dirY = 0;
  pacman.nextDirX = -1;
  pacman.nextDirY = 0;
  pacman.angle = Math.PI;
  pacman.radius = (TILE_SIZE / 2) - 1;
  gameTick = 0;
  initGhosts();
}

function isTilePassable(tileX, tileY, isGhost = false, ghostState = 'active') {
  const tunnelRow = currentMode === 'google' ? 8 : 14;

  if (tileY === tunnelRow && (tileX < 0 || tileX >= COLS)) {
    return true; // Terowong tembus
  }
  if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) {
    return false;
  }

  const tile = map[tileY][tileX];
  if (tile === '#') return false;

  // Pintu rumah hantu ('-')
  if (tile === '-' && !isGhost) return false;
  if (tile === '-' && isGhost && ghostState === 'active') return false;

  return true;
}

// Kemas kini Pac-Man
function updatePacman() {
  const currentTileX = Math.floor(pacman.x / TILE_SIZE);
  const currentTileY = Math.floor(pacman.y / TILE_SIZE);
  const centerTileX = (currentTileX + 0.5) * TILE_SIZE;
  const centerTileY = (currentTileY + 0.5) * TILE_SIZE;

  // Pertukaran arah
  if (pacman.nextDirX !== 0 || pacman.nextDirY !== 0) {
    if (pacman.nextDirX === -pacman.dirX && pacman.nextDirY === -pacman.dirY && (pacman.dirX !== 0 || pacman.dirY !== 0)) {
      pacman.dirX = pacman.nextDirX;
      pacman.dirY = pacman.nextDirY;
      pacman.nextDirX = 0;
      pacman.nextDirY = 0;
    } else {
      const targetTileX = currentTileX + pacman.nextDirX;
      const targetTileY = currentTileY + pacman.nextDirY;
      const distFromCenter = Math.hypot(pacman.x - centerTileX, pacman.y - centerTileY);

      if (distFromCenter <= pacman.speed + 1.5 && isTilePassable(targetTileX, targetTileY, false)) {
        pacman.x = centerTileX;
        pacman.y = centerTileY;
        pacman.dirX = pacman.nextDirX;
        pacman.dirY = pacman.nextDirY;
        pacman.nextDirX = 0;
        pacman.nextDirY = 0;
      }
    }
  }

  // Sudut mulut
  if (pacman.dirX === 1)  pacman.angle = 0;
  if (pacman.dirX === -1) pacman.angle = Math.PI;
  if (pacman.dirY === 1)  pacman.angle = Math.PI * 0.5;
  if (pacman.dirY === -1) pacman.angle = Math.PI * 1.5;

  // Gerakan
  if (pacman.dirX !== 0 || pacman.dirY !== 0) {
    const nextTileX = currentTileX + pacman.dirX;
    const nextTileY = currentTileY + pacman.dirY;

    if (!isTilePassable(nextTileX, nextTileY, false)) {
      if (pacman.dirX > 0 && pacman.x >= centerTileX) { pacman.x = centerTileX; pacman.dirX = 0; }
      else if (pacman.dirX < 0 && pacman.x <= centerTileX) { pacman.x = centerTileX; pacman.dirX = 0; }
      else if (pacman.dirY > 0 && pacman.y >= centerTileY) { pacman.y = centerTileY; pacman.dirY = 0; }
      else if (pacman.dirY < 0 && pacman.y <= centerTileY) { pacman.y = centerTileY; pacman.dirY = 0; }
      else {
        pacman.x += pacman.dirX * pacman.speed;
        pacman.y += pacman.dirY * pacman.speed;
      }
    } else {
      pacman.x += pacman.dirX * pacman.speed;
      pacman.y += pacman.dirY * pacman.speed;
    }

    if (pacman.mouthOpening) {
      pacman.mouthAngle += pacman.mouthSpeed;
      if (pacman.mouthAngle >= pacman.mouthMax) pacman.mouthOpening = false;
    } else {
      pacman.mouthAngle -= pacman.mouthSpeed;
      if (pacman.mouthAngle <= 0.04) pacman.mouthOpening = true;
    }
  }

  // Terowong tembus
  if (pacman.x < -8) pacman.x = COLS * TILE_SIZE + 4;
  if (pacman.x > COLS * TILE_SIZE + 8) pacman.x = -4;

  // Makan titik makanan
  if (currentTileY >= 0 && currentTileY < ROWS && currentTileX >= 0 && currentTileX < COLS) {
    const tile = map[currentTileY][currentTileX];
    if (tile === '.') {
      map[currentTileY][currentTileX] = ' ';
      score += 10;
      pelletsEaten++;
      window.pacmanAudio.waka();
      updateScoreUI();
    } else if (tile === 'O') {
      map[currentTileY][currentTileX] = ' ';
      score += 50;
      pelletsEaten++;
      frightenedTimer = 480;
      ghostEatMultiplier = 1;

      ghosts.forEach(g => {
        if (!g.eaten && g.state === 'active') {
          g.mode = 'frightened';
          g.dirX = -g.dirX;
          g.dirY = -g.dirY;
        }
      });
      window.pacmanAudio.waka();
      updateScoreUI();
    }
  }

  if (pelletsEaten >= totalPellets && totalPellets > 0) {
    levelClear();
  }
}

// AI & Kitaran Rumah Hantu
function updateGhosts() {
  gameTick++;

  if (frightenedTimer > 0) {
    frightenedTimer--;
    if (frightenedTimer === 0) {
      ghosts.forEach(g => {
        if (!g.eaten && g.state === 'active') {
          g.mode = 'chase';
        }
      });
    }
  }

  const doorCenterX = currentMode === 'google' ? 27.5 * TILE_SIZE : 13.5 * TILE_SIZE;
  const outsideY    = currentMode === 'google' ? 4.5 * TILE_SIZE  : 11.5 * TILE_SIZE;
  const insideY     = currentMode === 'google' ? 7.5 * TILE_SIZE  : 14.5 * TILE_SIZE;

  ghosts.forEach(g => {
    // 1. DI DALAM RUMAH HANTU
    if (g.state === 'in_house') {
      g.y += g.dirY * 0.8;
      if (g.y >= (insideY + 8)) g.dirY = -1;
      if (g.y <= (insideY - 8)) g.dirY = 1;

      if (gameTick >= g.exitDelay) {
        g.state = 'exiting';
      }
      return;
    }

    // 2. KELUAR RUMAH
    if (g.state === 'exiting') {
      if (Math.abs(g.x - doorCenterX) > 1.5) {
        g.x += Math.sign(doorCenterX - g.x) * 1.5;
      } else {
        g.x = doorCenterX;
        if (g.y > outsideY) {
          g.y -= 1.6;
        } else {
          g.y = outsideY;
          g.state = 'active';
          g.mode = frightenedTimer > 0 ? 'frightened' : 'chase';
          g.dirX = (g.name === 'blinky' || g.name === 'inky') ? -1 : 1;
          g.dirY = 0;
          g.lastTileX = Math.floor(g.x / TILE_SIZE);
          g.lastTileY = Math.floor(g.y / TILE_SIZE);
        }
      }
      return;
    }

    // 3. MATA MASUK RUMAH
    if (g.state === 'entering') {
      g.x = doorCenterX;
      if (g.y < insideY) {
        g.y += 2.5;
      } else {
        g.y = insideY;
        g.eaten = false;
        g.mode = 'chase';
        g.state = 'exiting';
      }
      return;
    }

    // 4. MERAYAU & MEMBURU (ACTIVE)
    let currentSpeed = g.speed;
    if (g.eaten) {
      currentSpeed = 3.6;
    } else if (g.mode === 'frightened') {
      currentSpeed = 0.95;
    }

    const currentTileX = Math.floor(g.x / TILE_SIZE);
    const currentTileY = Math.floor(g.y / TILE_SIZE);
    const centerTileX = (currentTileX + 0.5) * TILE_SIZE;
    const centerTileY = (currentTileY + 0.5) * TILE_SIZE;

    // Jika mata hantu tiba di pintu
    if (g.eaten) {
      const distToDoorEntrance = Math.hypot(g.x - doorCenterX, g.y - outsideY);
      if (distToDoorEntrance < 10) {
        g.x = doorCenterX;
        g.y = outsideY;
        g.dirX = 0;
        g.dirY = 1;
        g.state = 'entering';
        return;
      }
    }

    const distFromCenter = Math.hypot(g.x - centerTileX, g.y - centerTileY);
    const isNewTile = (currentTileX !== g.lastTileX || currentTileY !== g.lastTileY);

    if (distFromCenter <= currentSpeed + 1.2 && isNewTile) {
      g.lastTileX = currentTileX;
      g.lastTileY = currentTileY;

      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ];

      const validDirs = directions.filter(d => {
        if (d.x === -g.dirX && d.y === -g.dirY) return false;
        return isTilePassable(currentTileX + d.x, currentTileY + d.y, true, g.state);
      });

      if (validDirs.length > 0) {
        let chosenDir = validDirs[0];

        if (g.eaten) {
          validDirs.sort((a, b) => {
            const ax = (currentTileX + a.x + 0.5) * TILE_SIZE;
            const ay = (currentTileY + a.y + 0.5) * TILE_SIZE;
            const bx = (currentTileX + b.x + 0.5) * TILE_SIZE;
            const by = (currentTileY + b.y + 0.5) * TILE_SIZE;
            return Math.hypot(ax - doorCenterX, ay - outsideY) - Math.hypot(bx - doorCenterX, by - outsideY);
          });
          chosenDir = validDirs[0];
        } else if (g.mode === 'frightened') {
          chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        } else {
          // AI Chasing Keperibadian
          let targetX = pacman.x;
          let targetY = pacman.y;

          if (g.name === 'blinky') {
            targetX = pacman.x;
            targetY = pacman.y;
          } else if (g.name === 'pinky') {
            targetX = pacman.x + pacman.dirX * 48;
            targetY = pacman.y + pacman.dirY * 48;
          } else if (g.name === 'inky') {
            const blinky = ghosts[0];
            const pivotX = pacman.x + pacman.dirX * 24;
            const pivotY = pacman.y + pacman.dirY * 24;
            targetX = pivotX + (pivotX - blinky.x);
            targetY = pivotY + (pivotY - blinky.y);
          } else if (g.name === 'clyde') {
            const dist = Math.hypot(g.x - pacman.x, g.y - pacman.y);
            if (dist > 8 * TILE_SIZE) {
              targetX = pacman.x;
              targetY = pacman.y;
            } else {
              targetX = 1 * TILE_SIZE;
              targetY = (ROWS - 2) * TILE_SIZE;
            }
          }

          validDirs.sort((a, b) => {
            const ax = (currentTileX + a.x + 0.5) * TILE_SIZE;
            const ay = (currentTileY + a.y + 0.5) * TILE_SIZE;
            const bx = (currentTileX + b.x + 0.5) * TILE_SIZE;
            const by = (currentTileY + b.y + 0.5) * TILE_SIZE;
            return Math.hypot(ax - targetX, ay - targetY) - Math.hypot(bx - targetX, by - targetY);
          });
          chosenDir = validDirs[0];
        }

        if (chosenDir.x !== 0) g.y = centerTileY;
        if (chosenDir.y !== 0) g.x = centerTileX;
        g.dirX = chosenDir.x;
        g.dirY = chosenDir.y;
      } else {
        g.dirX = -g.dirX;
        g.dirY = -g.dirY;
      }
    }

    g.x += g.dirX * currentSpeed;
    g.y += g.dirY * currentSpeed;

    if (g.x < -8) g.x = COLS * TILE_SIZE + 4;
    if (g.x > COLS * TILE_SIZE + 8) g.x = -4;

    // Sentuhan dengan Pac-Man
    if (g.state === 'active') {
      const distToPacman = Math.hypot(g.x - pacman.x, g.y - pacman.y);
      if (distToPacman < TILE_SIZE * 0.75) {
        if (g.mode === 'frightened' && !g.eaten) {
          g.eaten = true;
          g.mode = 'eyes';
          g.state = 'returning';
          const points = 200 * ghostEatMultiplier;
          score += points;
          ghostEatMultiplier *= 2;
          window.pacmanAudio.eatGhost();
          updateScoreUI();
        } else if (!g.eaten) {
          handleDeath();
        }
      }
    }
  });
}

function handleDeath() {
  window.pacmanAudio.death();
  lives--;
  updateLivesUI();

  if (lives <= 0) {
    triggerGameOver();
  } else {
    resetPositions();
  }
}

function levelClear() {
  window.pacmanAudio.win();
  level++;
  levelBadge.textContent = 'LV ' + level;
  resetMap();
  resetPositions();
}

function triggerGameOver() {
  isGameOver = true;
  isPlaying = false;
  overlayTitle.textContent = "GAME OVER";
  overlayTitle.style.color = "#ff0055";
  overlayMessage.innerHTML = `Markah: <strong>${score}</strong> | Level: <strong>${level}</strong>`;
  startBtn.textContent = "INSERT COIN";
  overlay.classList.remove('hidden');
}

// Lukisan Grafik
function getGoogleWallColor(c) {
  if (c >= 2 && c <= 8)   return '#4285f4'; // G - Biru
  if (c >= 10 && c <= 16) return '#ea4335'; // o - Merah
  if (c >= 18 && c <= 33) return '#fbbc05'; // o - Kuning (Rumah Hantu)
  if (c >= 35 && c <= 43) return '#4285f4'; // g - Biru
  if (c >= 45 && c <= 48) return '#34a853'; // l - Hijau
  if (c >= 50 && c <= 55) return '#ea4335'; // e - Merah
  return '#2121ff'; // Sempadan Luar - Biru Neon Klasik
}

function drawMaze() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = map[r][c];
      const px = c * TILE_SIZE;
      const py = r * TILE_SIZE;

      if (tile === '#') {
        const wallColor = currentMode === 'google' ? getGoogleWallColor(c) : '#2121ff';
        ctx.fillStyle = '#080c18';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      } else if (tile === '-') {
        ctx.fillStyle = '#ff80df';
        ctx.fillRect(px, py + (TILE_SIZE / 2) - 2, TILE_SIZE, 4);
      } else if (tile === '.') {
        ctx.fillStyle = '#ffb8ae';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 'O') {
        const pulse = Math.sin(Date.now() / 150) > 0;
        if (pulse) {
          ctx.fillStyle = '#ffe600';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, (TILE_SIZE / 2) - 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawPacman() {
  ctx.save();
  ctx.translate(pacman.x, pacman.y);
  ctx.rotate(pacman.angle);

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(
    0, 
    0, 
    pacman.radius, 
    pacman.mouthAngle * Math.PI, 
    (2 - pacman.mouthAngle) * Math.PI
  );
  ctx.lineTo(0, 0);
  ctx.fill();

  ctx.restore();
}

function drawGhosts() {
  ghosts.forEach(g => {
    ctx.save();
    ctx.translate(g.x, g.y);

    const r = (TILE_SIZE / 2) - 1;

    if (g.eaten) {
      drawEyes(ctx, g.dirX, g.dirY, r);
    } else {
      if (g.mode === 'frightened') {
        const flash = frightenedTimer < 120 && Math.floor(frightenedTimer / 15) % 2 === 0;
        ctx.fillStyle = flash ? '#ffffff' : '#2121ff';
      } else {
        ctx.fillStyle = g.color;
      }

      ctx.beginPath();
      ctx.arc(0, -2, r, Math.PI, 0, false);
      ctx.lineTo(r, r);
      ctx.lineTo(r * 0.5, r - 2.5);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.5, r - 2.5);
      ctx.lineTo(-r, r);
      ctx.closePath();
      ctx.fill();

      if (g.mode === 'frightened') {
        ctx.fillStyle = '#ffb8ae';
        ctx.fillRect(-2, -2, 2, 2);
        ctx.fillRect(1, -2, 2, 2);
      } else {
        drawEyes(ctx, g.dirX, g.dirY, r);
      }
    }

    ctx.restore();
  });
}

function drawEyes(c, dirX, dirY, r) {
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(-r * 0.4, -2, r * 0.35, 0, Math.PI * 2);
  c.arc(r * 0.4, -2, r * 0.35, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#0000ff';
  c.beginPath();
  c.arc(-r * 0.4 + dirX * 1.2, -2 + dirY * 1.2, r * 0.18, 0, Math.PI * 2);
  c.arc(r * 0.4 + dirX * 1.2, -2 + dirY * 1.2, r * 0.18, 0, Math.PI * 2);
  c.fill();
}

function updateScoreUI() {
  scoreEl.textContent = formatScore(score);
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = formatScore(highScore);
    localStorage.setItem('pacman_high_score', highScore.toString());
  }
}

function updateLivesUI() {
  livesContainer.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    const span = document.createElement('span');
    span.className = 'pac-life';
    span.textContent = '🟡';
    livesContainer.appendChild(span);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMaze();
  drawPacman();
  drawGhosts();
}

function gameLoop() {
  if (isPlaying && !isPaused && !isGameOver) {
    updatePacman();
    updateGhosts();
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// Mulakan Permainan (Insert Coin)
function startGame() {
  window.pacmanAudio.init();
  window.pacmanAudio.playIntroTheme();

  score = 0;
  lives = 3;
  level = 1;
  levelBadge.textContent = 'LV 1';
  isGameOver = false;
  isPaused = false;
  isPlaying = true;

  resetMap();
  resetPositions();
  updateScoreUI();
  updateLivesUI();

  overlay.classList.add('hidden');
}

// Kawalan Papan Kekunci
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }

  if (isGameOver) {
    if (e.code === 'KeyR' || e.code === 'Space') {
      startGame();
    }
    return;
  }

  if (!isPlaying) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter'].includes(e.code)) {
      startGame();
    }
  }

  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      pacman.nextDirX = 0;
      pacman.nextDirY = -1;
      break;
    case 'ArrowDown':
    case 'KeyS':
      pacman.nextDirX = 0;
      pacman.nextDirY = 1;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      pacman.nextDirX = -1;
      pacman.nextDirY = 0;
      break;
    case 'ArrowRight':
    case 'KeyD':
      pacman.nextDirX = 1;
      pacman.nextDirY = 0;
      break;
    case 'KeyP':
    case 'Escape':
      if (isPlaying) {
        isPaused = !isPaused;
        if (isPaused) {
          overlayTitle.textContent = "PAUSED";
          overlayMessage.textContent = "Tekan P atau ESC untuk sambung.";
          startBtn.textContent = "SAMBUNG (P)";
          overlay.classList.remove('hidden');
        } else {
          overlay.classList.add('hidden');
        }
      }
      break;
    case 'KeyR':
      startGame();
      break;
  }
});

startBtn.addEventListener('click', () => {
  if (!isPlaying || isGameOver) {
    startGame();
  } else if (isPaused) {
    isPaused = false;
    overlay.classList.add('hidden');
  }
});

insertCoinBtn.addEventListener('click', () => {
  startGame();
});

soundToggleBtn.addEventListener('click', () => {
  const enabled = window.pacmanAudio.toggle();
  soundToggleBtn.textContent = enabled ? "🔊 Bunyi: HIDUP" : "🔈 Bunyi: PADAM";
});

// Suis Mod Peta
modeGoogleBtn.addEventListener('click', () => {
  if (currentMode !== 'google') {
    setGameMode('google');
  }
});

modeClassicBtn.addEventListener('click', () => {
  if (currentMode !== 'classic') {
    setGameMode('classic');
  }
});

// Permulaan awal
setGameMode('google');
updateLivesUI();
requestAnimationFrame(gameLoop);
