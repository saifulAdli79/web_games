/**
 * BOMBERMAN KLASIK - ENJIN PERMAINAN PELAYAR CHROME
 */

const canvas = document.getElementById('bombermanCanvas');
const ctx = canvas.getContext('2d');

const COLS = 13;
const ROWS = 11;
const TILE_SIZE = 40;

// Jenis Jubin / Tile
const TILE_EMPTY = 0;
const TILE_WALL  = 1; // Tiang keluli kekal
const TILE_BRICK = 2; // Batu bata boleh pecah

// Jenis Power-Up
const ITEM_NONE  = 0;
const ITEM_BOMB  = 1; // +1 Bom
const ITEM_FIRE  = 2; // +1 Jarak Letupan
const ITEM_SPEED = 3; // +Kelajuan
const ITEM_DOOR  = 4; // Pintu Keluar Stage

// UI Elemen
const scoreEl = document.getElementById('score');
const livesContainer = document.getElementById('livesContainer');
const stageEl = document.getElementById('stage');
const enemyCountEl = document.getElementById('enemyCount');
const maxBombsVal = document.getElementById('maxBombsVal');
const flameRangeVal = document.getElementById('flameRangeVal');
const speedVal = document.getElementById('speedVal');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');

// Status Permainan
let grid = [];
let itemGrid = [];
let bombs = [];
let explosions = [];
let enemies = [];
let particles = [];

let score = 0;
let lives = 3;
let stage = 1;
let isPlaying = false;
let isPaused = false;
let isGameOver = false;

// Pemain Bomberman
const player = {
  x: 1.5 * TILE_SIZE,
  y: 1.5 * TILE_SIZE,
  radius: 14,
  baseSpeed: 2.3,
  speed: 2.3,
  dirX: 0,
  dirY: 0,
  facing: 'down',
  maxBombs: 1,
  flameRange: 1,
  activeBombs: 0,
  isDead: false,
  invincibleTimer: 0
};

// Kawalan Papan Kekunci
const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Cipta Papan Permainan Arena
function initGrid() {
  grid = [];
  itemGrid = [];
  bombs = [];
  explosions = [];
  enemies = [];
  particles = [];

  for (let r = 0; r < ROWS; r++) {
    const row = [];
    const itemRow = [];
    for (let c = 0; c < COLS; c++) {
      // Sempadan luar dan tiang berselang adalah keluli kekal
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        row.push(TILE_WALL);
      } else if (r % 2 === 0 && c % 2 === 0) {
        row.push(TILE_WALL);
      } else {
        // Kawasan lapang sekitar spawn pemain (1,1), (1,2), (2,1)
        if ((r <= 2 && c <= 2)) {
          row.push(TILE_EMPTY);
        } else {
          // 40% peluang letak batu bata boleh musnah
          if (Math.random() < 0.45) {
            row.push(TILE_BRICK);
          } else {
            row.push(TILE_EMPTY);
          }
        }
      }
      itemRow.push(ITEM_NONE);
    }
    grid.push(row);
    itemGrid.push(itemRow);
  }

  // Sembunyikan Power-up di bawah batu bata
  const brickCoords = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === TILE_BRICK) {
        brickCoords.push({ r, c });
      }
    }
  }

  // Kocok kedudukan batu
  brickCoords.sort(() => Math.random() - 0.5);

  if (brickCoords.length > 0) {
    // 1 Pintu Rahsia keluar stage
    const doorPos = brickCoords.pop();
    itemGrid[doorPos.r][doorPos.c] = ITEM_DOOR;

    // Beberapa item kuasa
    if (brickCoords.length > 0) {
      const bPos = brickCoords.pop();
      itemGrid[bPos.r][bPos.c] = ITEM_BOMB;
    }
    if (brickCoords.length > 0) {
      const fPos = brickCoords.pop();
      itemGrid[fPos.r][fPos.c] = ITEM_FIRE;
    }
    if (brickCoords.length > 0 && Math.random() < 0.6) {
      const sPos = brickCoords.pop();
      itemGrid[sPos.r][sPos.c] = ITEM_SPEED;
    }
  }

  // Cipta Musuh (Ballom) mengikut bilangan stage
  const enemyCount = Math.min(3 + stage, 7);
  const emptyCoords = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (grid[r][c] === TILE_EMPTY && !(r <= 3 && c <= 3)) {
        emptyCoords.push({ r, c });
      }
    }
  }
  emptyCoords.sort(() => Math.random() - 0.5);

  for (let i = 0; i < enemyCount; i++) {
    if (emptyCoords.length > 0) {
      const pos = emptyCoords.pop();
      enemies.push({
        x: (pos.c + 0.5) * TILE_SIZE,
        y: (pos.r + 0.5) * TILE_SIZE,
        radius: 13,
        speed: 1.1 + stage * 0.1,
        dirX: Math.random() < 0.5 ? 1 : -1,
        dirY: 0,
        changeTimer: 0
      });
    }
  }

  updateStatsUI();
}

function resetPlayerPosition() {
  player.x = 1.5 * TILE_SIZE;
  player.y = 1.5 * TILE_SIZE;
  player.dirX = 0;
  player.dirY = 0;
  player.facing = 'down';
  player.activeBombs = 0;
  player.isDead = false;
  player.invincibleTimer = 120; // 2 saat kebal selepas respawn
}

// Semak sama ada posisi boleh dilalui entiti
function isBlocked(x, y, radius, isBombPassable = false) {
  const margin = 2;
  const left   = Math.floor((x - radius + margin) / TILE_SIZE);
  const right  = Math.floor((x + radius - margin) / TILE_SIZE);
  const top    = Math.floor((y - radius + margin) / TILE_SIZE);
  const bottom = Math.floor((y + radius - margin) / TILE_SIZE);

  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
      if (grid[r][c] === TILE_WALL || grid[r][c] === TILE_BRICK) return true;

      // Semak bom di petak ini
      if (!isBombPassable) {
        for (const b of bombs) {
          if (b.col === c && b.row === r && !b.canPassThrough) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Letak Bom
function plantBomb() {
  if (!isPlaying || isPaused || isGameOver || player.isDead) return;

  const col = Math.floor(player.x / TILE_SIZE);
  const row = Math.floor(player.y / TILE_SIZE);

  // Semak jika sudah ada bom di petak ini atau melebihi had
  const existing = bombs.find(b => b.col === col && b.row === row);
  if (existing || player.activeBombs >= player.maxBombs) return;

  bombs.push({
    col: col,
    row: row,
    timer: 140, // ~2.3 saat (60fps)
    range: player.flameRange,
    canPassThrough: true // Pemain boleh keluar dari petak bom sebelum terperangkap
  });

  player.activeBombs++;
  window.bombermanAudio.plantBomb();
}

// Letupkan Bom
function explodeBomb(bomb) {
  window.bombermanAudio.explode();
  player.activeBombs = Math.max(0, player.activeBombs - 1);

  const flameTiles = [{ col: bomb.col, row: bomb.row }];
  const dirs = [
    { x: 0, y: -1 }, // Atas
    { x: 0, y: 1 },  // Bawah
    { x: -1, y: 0 }, // Kiri
    { x: 1, y: 0 }   // Kanan
  ];

  dirs.forEach(d => {
    for (let dist = 1; dist <= bomb.range; dist++) {
      const tc = bomb.col + d.x * dist;
      const tr = bomb.row + d.y * dist;

      if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) break;
      if (grid[tr][tc] === TILE_WALL) {
        break; // Tiang keluli hentikan api terus
      }

      flameTiles.push({ col: tc, row: tr });

      if (grid[tr][tc] === TILE_BRICK) {
        // Hancurkan batu bata!
        grid[tr][tc] = TILE_EMPTY;
        createBrickParticles((tc + 0.5) * TILE_SIZE, (tr + 0.5) * TILE_SIZE);
        score += 20;
        updateStatsUI();
        break; // Api berhenti selepas memusnahkan satu batu bata
      }

      // Rantaian letupan jika ada bom lain dalam laluan api
      const otherBomb = bombs.find(b => b.col === tc && b.row === tr);
      if (otherBomb) {
        otherBomb.timer = 1; // Cetuskan serta-merta
      }
    }
  });

  explosions.push({
    tiles: flameTiles,
    life: 25 // Hayat nyalaan api ~0.4 saat
  });
}

function createBrickParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 6 + 4,
      color: '#d96e38',
      alpha: 1,
      decay: 0.04
    });
  }
}

// Kemas kini Pemain
function updatePlayer() {
  if (player.isDead) return;

  if (player.invincibleTimer > 0) {
    player.invincibleTimer--;
  }

  let moveX = 0;
  let moveY = 0;

  if (keys.up)    { moveY -= 1; player.facing = 'up'; }
  if (keys.down)  { moveY += 1; player.facing = 'down'; }
  if (keys.left)  { moveX -= 1; player.facing = 'left'; }
  if (keys.right) { moveX += 1; player.facing = 'right'; }

  // Normalisasikan jika bergerak serong
  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  const speed = player.speed;

  // Gerak paksi X
  if (moveX !== 0) {
    const nextX = player.x + moveX * speed;
    if (!isBlocked(nextX, player.y, player.radius)) {
      player.x = nextX;
    } else {
      // Peluncuran sudut automatik (Corner Sliding)
      const curTileY = Math.floor(player.y / TILE_SIZE);
      const centerY = (curTileY + 0.5) * TILE_SIZE;
      if (Math.abs(player.y - centerY) > 4) {
        player.y += Math.sign(centerY - player.y) * 1.5;
      }
    }
  }

  // Gerak paksi Y
  if (moveY !== 0) {
    const nextY = player.y + moveY * speed;
    if (!isBlocked(player.x, nextY, player.radius)) {
      player.y = nextY;
    } else {
      const curTileX = Math.floor(player.x / TILE_SIZE);
      const centerX = (curTileX + 0.5) * TILE_SIZE;
      if (Math.abs(player.x - centerX) > 4) {
        player.x += Math.sign(centerX - player.x) * 1.5;
      }
    }
  }

  // Semak jika pemain telah meninggalkan petak bom
  bombs.forEach(b => {
    if (b.canPassThrough) {
      const pCol = Math.floor(player.x / TILE_SIZE);
      const pRow = Math.floor(player.y / TILE_SIZE);
      if (pCol !== b.col || pRow !== b.row) {
        b.canPassThrough = false;
      }
    }
  });

  // Ambil Item Power-Up
  const pCol = Math.floor(player.x / TILE_SIZE);
  const pRow = Math.floor(player.y / TILE_SIZE);

  if (grid[pRow][pCol] === TILE_EMPTY) {
    const item = itemGrid[pRow][pCol];
    if (item === ITEM_BOMB) {
      player.maxBombs++;
      itemGrid[pRow][pCol] = ITEM_NONE;
      score += 100;
      window.bombermanAudio.powerup();
      updateStatsUI();
    } else if (item === ITEM_FIRE) {
      player.flameRange++;
      itemGrid[pRow][pCol] = ITEM_NONE;
      score += 100;
      window.bombermanAudio.powerup();
      updateStatsUI();
    } else if (item === ITEM_SPEED) {
      player.speed = Math.min(3.6, player.speed + 0.5);
      itemGrid[pRow][pCol] = ITEM_NONE;
      score += 100;
      window.bombermanAudio.powerup();
      updateStatsUI();
    } else if (item === ITEM_DOOR && enemies.length === 0) {
      // Masuk ke Stage seterusnya!
      stageClear();
    }
  }
}

// Kemas kini Bom & Api Letupan
function updateBombsAndExplosions() {
  // Bom
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.timer--;
    if (b.timer <= 0) {
      explodeBomb(b);
      bombs.splice(i, 1);
    }
  }

  // Api Letupan
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.life--;

    // Semak sentuhan api dengan pemain
    if (player.invincibleTimer <= 0 && !player.isDead) {
      const pCol = Math.floor(player.x / TILE_SIZE);
      const pRow = Math.floor(player.y / TILE_SIZE);
      if (exp.tiles.some(t => t.col === pCol && t.row === pRow)) {
        killPlayer();
      }
    }

    // Semak sentuhan api dengan musuh
    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const en = enemies[eIdx];
      const eCol = Math.floor(en.x / TILE_SIZE);
      const eRow = Math.floor(en.y / TILE_SIZE);
      if (exp.tiles.some(t => t.col === eCol && t.row === eRow)) {
        createBrickParticles(en.x, en.y);
        enemies.splice(eIdx, 1);
        score += 200;
        window.bombermanAudio.enemyDie();
        updateStatsUI();
      }
    }

    if (exp.life <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// Kemas kini AI Musuh (Ballom)
function updateEnemies() {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  enemies.forEach(en => {
    en.changeTimer--;
    const nextX = en.x + en.dirX * en.speed;
    const nextY = en.y + en.dirY * en.speed;

    const atIntersection = (Math.floor(en.x) % TILE_SIZE < 3 && Math.floor(en.y) % TILE_SIZE < 3);

    if (isBlocked(nextX, nextY, en.radius) || (atIntersection && en.changeTimer <= 0)) {
      // Pilih arah baharu
      const validDirs = dirs.filter(d => !isBlocked(en.x + d.x * en.speed * 2, en.y + d.y * en.speed * 2, en.radius));
      if (validDirs.length > 0) {
        const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
        en.dirX = chosen.x;
        en.dirY = chosen.y;
        en.changeTimer = Math.floor(Math.random() * 60) + 40;
      } else {
        en.dirX = -en.dirX;
        en.dirY = -en.dirY;
      }
    } else {
      en.x = nextX;
      en.y = nextY;
    }

    // Semak langgaran musuh dengan pemain
    if (player.invincibleTimer <= 0 && !player.isDead) {
      const dist = Math.hypot(en.x - player.x, en.y - player.y);
      if (dist < player.radius + en.radius - 4) {
        killPlayer();
      }
    }
  });
}

function killPlayer() {
  player.isDead = true;
  window.bombermanAudio.playerDie();
  lives--;
  updateLivesUI();

  setTimeout(() => {
    if (lives <= 0) {
      triggerGameOver();
    } else {
      resetPlayerPosition();
    }
  }, 1000);
}

function stageClear() {
  window.bombermanAudio.stageClear();
  stage++;
  stageEl.textContent = stage;
  initGrid();
  resetPlayerPosition();
}

function triggerGameOver() {
  isGameOver = true;
  isPlaying = false;
  overlayTitle.textContent = "GAME OVER";
  overlayTitle.style.color = "#ff2200";
  overlayMessage.innerHTML = `Markah: <strong>${score}</strong> | Stage: <strong>${stage}</strong>`;
  startBtn.textContent = "MAIN SEMULA (R)";
  overlay.classList.remove('hidden');
}

// Lukisan Grafik Canvas
function drawArena() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const px = c * TILE_SIZE;
      const py = r * TILE_SIZE;

      // Lantai Padang Hijau
      ctx.fillStyle = (r + c) % 2 === 0 ? '#276b2f' : '#215c28';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Pintu Rahsia (jika terdedah)
      if (grid[r][c] === TILE_EMPTY && itemGrid[r][c] === ITEM_DOOR) {
        ctx.fillStyle = enemies.length === 0 ? '#00e5ff' : '#556677';
        ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        ctx.fillText('🚪', px + 12, py + 26);
      }
      // Power-Up Terdedah
      else if (grid[r][c] === TILE_EMPTY && itemGrid[r][c] !== ITEM_NONE) {
        const itemType = itemGrid[r][c];
        ctx.fillStyle = '#1e2838';
        ctx.beginPath();
        ctx.arc(px + 20, py + 20, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '16px sans-serif';
        if (itemType === ITEM_BOMB)  ctx.fillText('💣', px + 11, py + 26);
        if (itemType === ITEM_FIRE)  ctx.fillText('🔥', px + 11, py + 26);
        if (itemType === ITEM_SPEED) ctx.fillText('⚡', px + 11, py + 26);
      }

      // Tiang Keluli Kekal
      if (grid[r][c] === TILE_WALL) {
        ctx.fillStyle = '#7a8b9e';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#9cb0c6';
        ctx.fillRect(px, py, TILE_SIZE, 4);
        ctx.fillRect(px, py, 4, TILE_SIZE);
        ctx.fillStyle = '#4f5d6d';
        ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);
        ctx.fillRect(px + TILE_SIZE - 4, py, 4, TILE_SIZE);
      }
      // Batu Bata Boleh Pecah
      else if (grid[r][c] === TILE_BRICK) {
        ctx.fillStyle = '#c7582b';
        ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.fillStyle = '#e07646';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 3);
        ctx.fillStyle = '#8f3b17';
        ctx.fillRect(px + 2, py + TILE_SIZE - 5, TILE_SIZE - 4, 3);
        // Garisan bata
        ctx.strokeStyle = '#6b2b0f';
        ctx.beginPath();
        ctx.moveTo(px, py + 13); ctx.lineTo(px + TILE_SIZE, py + 13);
        ctx.moveTo(px, py + 26); ctx.lineTo(px + TILE_SIZE, py + 26);
        ctx.moveTo(px + 20, py); ctx.lineTo(px + 20, py + 13);
        ctx.moveTo(px + 10, py + 13); ctx.lineTo(px + 10, py + 26);
        ctx.moveTo(px + 30, py + 13); ctx.lineTo(px + 30, py + 26);
        ctx.stroke();
      }
    }
  }
}

function drawBombs() {
  bombs.forEach(b => {
    const px = (b.col + 0.5) * TILE_SIZE;
    const py = (b.row + 0.5) * TILE_SIZE;

    // Denyutan saiz bom
    const pulse = Math.sin(Date.now() / 80) * 2;
    const radius = 13 + pulse;

    // Badan Bom Hitam Berkilat
    ctx.fillStyle = '#111116';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    // Sumbu & Percikan Api
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(px - 2, py - radius - 4, 4, 4);
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.arc(px, py - radius - 5, 3 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawExplosions() {
  explosions.forEach(exp => {
    exp.tiles.forEach(t => {
      const px = t.col * TILE_SIZE;
      const py = t.row * TILE_SIZE;

      ctx.save();
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 14, py + 14, TILE_SIZE - 28, TILE_SIZE - 28);
      ctx.restore();
    });
  });
}

function drawPlayer() {
  if (player.isDead) return;

  // Berkelip jika kebal seketika
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 8) % 2 === 0) {
    return;
  }

  const px = player.x;
  const py = player.y;

  // Badan Biru Bomberman
  ctx.fillStyle = '#0066cc';
  ctx.beginPath();
  ctx.arc(px, py + 4, 11, 0, Math.PI * 2);
  ctx.fill();

  // Kepala Putih Bomberman
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py - 4, 11, 0, Math.PI * 2);
  ctx.fill();

  // Topi pink / pom-pom
  ctx.fillStyle = '#ff4081';
  ctx.beginPath();
  ctx.arc(px, py - 15, 4, 0, Math.PI * 2);
  ctx.fill();

  // Mata Hitam
  ctx.fillStyle = '#000000';
  ctx.fillRect(px - 4, py - 6, 2, 5);
  ctx.fillRect(px + 2, py - 6, 2, 5);
}

function drawEnemies() {
  enemies.forEach(en => {
    const px = en.x;
    const py = en.y;

    // Badan Oren Bouncing Ballom
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(px, py, en.radius, 0, Math.PI * 2);
    ctx.fill();

    // Muka kelakar
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px - 4, py - 2, 3, 0, Math.PI * 2);
    ctx.arc(px + 4, py - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(px - 4 + en.dirX, py - 2 + en.dirY, 1.5, 0, Math.PI * 2);
    ctx.arc(px + 4 + en.dirX, py - 2 + en.dirY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
}

function updateStatsUI() {
  scoreEl.textContent = score;
  stageEl.textContent = stage;
  enemyCountEl.textContent = enemies.length;
  maxBombsVal.textContent = player.maxBombs;
  flameRangeVal.textContent = player.flameRange;
  speedVal.textContent = player.speed > 2.3 ? 'Laju ⚡' : 'Biasa';
}

function updateLivesUI() {
  livesContainer.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    const span = document.createElement('span');
    span.className = 'life-icon';
    span.textContent = '❤️';
    livesContainer.appendChild(span);
  }
}

// Gelung Utama Animasi
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawArena();
  drawBombs();
  drawExplosions();

  if (isPlaying && !isPaused && !isGameOver) {
    updatePlayer();
    updateBombsAndExplosions();
    updateEnemies();
  }

  drawEnemies();
  drawPlayer();
  drawParticles();

  requestAnimationFrame(gameLoop);
}

// Mulakan Permainan
function startGame() {
  window.bombermanAudio.init();
  score = 0;
  lives = 3;
  stage = 1;
  player.maxBombs = 1;
  player.flameRange = 1;
  player.speed = player.baseSpeed;
  isGameOver = false;
  isPaused = false;
  isPlaying = true;

  initGrid();
  resetPlayerPosition();
  updateStatsUI();
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
      keys.up = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = true;
      break;
    case 'Space':
      plantBomb();
      break;
    case 'KeyP':
    case 'Escape':
      isPaused = !isPaused;
      if (isPaused) {
        overlayTitle.textContent = "JEDA (PAUSED)";
        overlayMessage.textContent = "Tekan P atau ESC untuk sambung.";
        startBtn.textContent = "SAMBUNG (P)";
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
      break;
    case 'KeyR':
      startGame();
      break;
  }
});

window.addEventListener('keyup', e => {
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      keys.up = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = false;
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

soundToggleBtn.addEventListener('click', () => {
  const enabled = window.bombermanAudio.toggle();
  soundToggleBtn.textContent = enabled ? "🔊 Bunyi: HIDUP" : "🔈 Bunyi: PADAM";
});

// Paparan awal
initGrid();
resetPlayerPosition();
updateLivesUI();
requestAnimationFrame(gameLoop);
