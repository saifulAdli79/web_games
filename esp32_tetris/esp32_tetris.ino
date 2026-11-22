/**
 * ==============================================================================
 * TETRIS WARNA-WARNI UNTUK ESP32-S3 DENGAN PAPARAN 4.3 INCI (800x480)
 * ==============================================================================
 * Papan yang disokong: ESP32-8048S043 (Sunton / Guition / Elecrow ESP32-S3 4.3")
 * Antara Muka Paparan: RGB 16-bit 800x480 (Menggunakan LovyanGFX)
 * Sentuhan (Touch): GT911 Capacitive Touch Screen
 *
 * Kawalan:
 * 1. Butang Sentuh Atas Skrin (On-screen Touch Buttons di panel sisi)
 * 2. Input Serial Monitor PC (Hantar 'a'=kiri, 'd'=kanan, 'w'=pusing, 's'=turun, ' '=jatuh terus)
 * 3. Butang Fizikal GPIO (pilihan)
 * ==============================================================================
 */

#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include <lgfx/v1/platforms/esp32s3/Panel_RGB.hpp>
#include <lgfx/v1/platforms/esp32s3/Bus_RGB.hpp>

// -----------------------------------------------------------------------------
// KONFIGURASI LOVYANGFX UNTUK ESP32-S3 PAPARAN 4.3 INCI (ESP32-8048S043)
// -----------------------------------------------------------------------------
class LGFX : public lgfx::LGFX_Device {
public:
  lgfx::Bus_RGB     _bus_instance;
  lgfx::Panel_RGB   _panel_instance;
  lgfx::Touch_GT911 _touch_instance;

  LGFX(void) {
    {
      auto cfg = _bus_instance.config();
      cfg.panel = &_panel_instance;
      
      // Pin RGB LCD untuk modul ESP32-8048S043 4.3"
      cfg.pin_d0  = GPIO_NUM_15; // B0
      cfg.pin_d1  = GPIO_NUM_7;  // B1
      cfg.pin_d2  = GPIO_NUM_6;  // B2
      cfg.pin_d3  = GPIO_NUM_5;  // B3
      cfg.pin_d4  = GPIO_NUM_4;  // B4
      
      cfg.pin_d5  = GPIO_NUM_9;  // G0
      cfg.pin_d6  = GPIO_NUM_46; // G1
      cfg.pin_d7  = GPIO_NUM_3;  // G2
      cfg.pin_d8  = GPIO_NUM_8;  // G3
      cfg.pin_d9  = GPIO_NUM_16; // G4
      cfg.pin_d10 = GPIO_NUM_1;  // G5
      
      cfg.pin_d11 = GPIO_NUM_14; // R0
      cfg.pin_d12 = GPIO_NUM_21; // R1
      cfg.pin_d13 = GPIO_NUM_47; // R2
      cfg.pin_d14 = GPIO_NUM_48; // R3
      cfg.pin_d15 = GPIO_NUM_45; // R4

      cfg.pin_henable = GPIO_NUM_41; // DE
      cfg.pin_vsync   = GPIO_NUM_40; // VSYNC
      cfg.pin_hsync   = GPIO_NUM_39; // HSYNC
      cfg.pin_pclk    = GPIO_NUM_42; // PCLK
      cfg.freq_write  = 14000000;

      cfg.hsync_polarity    = 0;
      cfg.hsync_front_porch = 8;
      cfg.hsync_pulse_width = 4;
      cfg.hsync_back_porch  = 43;

      cfg.vsync_polarity    = 0;
      cfg.vsync_front_porch = 8;
      cfg.vsync_pulse_width = 4;
      cfg.vsync_back_porch  = 12;

      cfg.pclk_active_neg   = 1;
      cfg.de_idle_high      = 0;
      cfg.pclk_idle_high    = 0;

      _bus_instance.config(cfg);
    }

    {
      auto cfg = _panel_instance.config();
      cfg.memory_width  = 800;
      cfg.memory_height = 480;
      cfg.panel_width   = 800;
      cfg.panel_height  = 480;
      cfg.offset_x      = 0;
      cfg.offset_y      = 0;
      _panel_instance.config(cfg);
    }

    {
      auto cfg = _touch_instance.config();
      cfg.x_min      = 0;
      cfg.x_max      = 799;
      cfg.y_min      = 0;
      cfg.y_max      = 479;
      cfg.pin_int    = -1;
      cfg.pin_rst    = -1;
      cfg.bus_shared = false;
      cfg.offset_rotation = 0;
      cfg.i2c_port   = 1;
      cfg.pin_sda    = GPIO_NUM_19;
      cfg.pin_scl    = GPIO_NUM_20;
      cfg.freq       = 400000;
      cfg.i2c_addr   = 0x5D; // GT911 lazimnya 0x5D atau 0x14
      _touch_instance.config(cfg);
      _panel_instance.setTouch(&_touch_instance);
    }

    _panel_instance.setBus(&_bus_instance);
    setPanel(&_panel_instance);
  }
};

LGFX lcd;
LGFX_Sprite canvas(&lcd); // Double-buffer sprite untuk elak skrin berkelip

// -----------------------------------------------------------------------------
// DEFINISI PERMAINAN TETRIS
// -----------------------------------------------------------------------------
#define BOARD_COLS 10
#define BOARD_ROWS 20
#define BLOCK_PX   22 // 10 * 22 = 220px lebar, 20 * 22 = 440px tinggi (muat cantik dlm 480px)

// Kedudukan Offset Papan Tetris pada Skrin 800x480
#define BOARD_OFFSET_X 290
#define BOARD_OFFSET_Y 20

// Warna Warna Tetris (RGB565)
#define COLOR_BG        0x0842 // Hitam Kebiruan Gelap
#define COLOR_PANEL     0x18E5 // Gelap Kad
#define COLOR_GRID      0x2126 // Garis Grid Halus
#define COLOR_TEXT      0xFFFF // Putih
#define COLOR_TEXT_MUT  0x8C71 // Kelabu

#define COLOR_I         0x07FF // Cyan
#define COLOR_O         0xFFE0 // Kuning
#define COLOR_T         0xB1DF // Ungu Magenta
#define COLOR_S         0x07E0 // Hijau Neon
#define COLOR_Z         0xF800 // Merah
#define COLOR_J         0x001F // Biru
#define COLOR_L         0xFD20 // Oren

const uint16_t PIECE_COLORS[8] = {
  0x0000,   // Kosong
  COLOR_I,  // 1: I
  COLOR_O,  // 2: O
  COLOR_T,  // 3: T
  COLOR_S,  // 4: S
  COLOR_Z,  // 5: Z
  COLOR_J,  // 6: J
  COLOR_L   // 7: L
};

// Bentuk Tetromino 4x4
const uint8_t TETROMINOES[7][4][4] = {
  // I
  { {0,0,0,0}, {1,1,1,1}, {0,0,0,0}, {0,0,0,0} },
  // O
  { {0,1,1,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0} },
  // T
  { {0,1,0,0}, {1,1,1,0}, {0,0,0,0}, {0,0,0,0} },
  // S
  { {0,1,1,0}, {1,1,0,0}, {0,0,0,0}, {0,0,0,0} },
  // Z
  { {1,1,0,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0} },
  // J
  { {1,0,0,0}, {1,1,1,0}, {0,0,0,0}, {0,0,0,0} },
  // L
  { {0,0,1,0}, {1,1,1,0}, {0,0,0,0}, {0,0,0,0} }
};

// Pembolehubah Permainan
uint8_t board[BOARD_ROWS][BOARD_COLS] = {0};
uint32_t score = 0;
uint16_t linesClearedTotal = 0;
uint16_t level = 1;
bool gameOver = false;
bool isPaused = false;

struct Piece {
  int8_t type;
  int8_t x;
  int8_t y;
  uint8_t shape[4][4];
};

Piece currentPiece;
int8_t nextPieceType = 0;

unsigned long lastDropTime = 0;
unsigned long dropDelay = 800; // ms

// -----------------------------------------------------------------------------
// FUNGSI LOGIK TETRIS
// -----------------------------------------------------------------------------
void initPiece(Piece &p, int8_t type) {
  p.type = type;
  p.x = 3;
  p.y = 0;
  for (int r = 0; r < 4; r++) {
    for (int c = 0; c < 4; c++) {
      p.shape[r][c] = TETROMINOES[type - 1][r][c] ? type : 0;
    }
  }
}

bool checkCollision(const Piece &p, int8_t testX, int8_t testY, const uint8_t shape[4][4]) {
  for (int r = 0; r < 4; r++) {
    for (int c = 0; c < 4; c++) {
      if (shape[r][c]) {
        int targetX = testX + c;
        int targetY = testY + r;

        if (targetX < 0 || targetX >= BOARD_COLS || targetY >= BOARD_ROWS) {
          return true; // Keluar sempadan
        }
        if (targetY >= 0 && board[targetY][targetX] != 0) {
          return true; // Berlanggar blok lain
        }
      }
    }
  }
  return false;
}

void rotatePiece(Piece &p) {
  uint8_t temp[4][4] = {0};
  for (int r = 0; r < 4; r++) {
    for (int c = 0; c < 4; c++) {
      temp[c][3 - r] = p.shape[r][c];
    }
  }
  if (!checkCollision(p, p.x, p.y, temp)) {
    memcpy(p.shape, temp, sizeof(temp));
  }
}

void lockPiece() {
  for (int r = 0; r < 4; r++) {
    for (int c = 0; c < 4; c++) {
      if (currentPiece.shape[r][c]) {
        int by = currentPiece.y + r;
        int bx = currentPiece.x + c;
        if (by >= 0 && by < BOARD_ROWS && bx >= 0 && bx < BOARD_COLS) {
          board[by][bx] = currentPiece.type;
        }
      }
    }
  }

  // Semak garisan penuh
  int lines = 0;
  for (int r = BOARD_ROWS - 1; r >= 0; r--) {
    bool full = true;
    for (int c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] == 0) {
        full = false;
        break;
      }
    }
    if (full) {
      lines++;
      for (int moveR = r; moveR > 0; moveR--) {
        for (int c = 0; c < BOARD_COLS; c++) {
          board[moveR][c] = board[moveR - 1][c];
        }
      }
      for (int c = 0; c < BOARD_COLS; c++) {
        board[0][c] = 0;
      }
      r++; // semak semula baris ini
    }
  }

  if (lines > 0) {
    const uint16_t pts[5] = {0, 100, 300, 500, 800};
    score += pts[lines] * level;
    linesClearedTotal += lines;
    level = (linesClearedTotal / 10) + 1;
    dropDelay = max(100UL, 800UL - (level - 1) * 70);
  }

  // Blok seterusnya
  initPiece(currentPiece, nextPieceType);
  nextPieceType = random(1, 8);

  if (checkCollision(currentPiece, currentPiece.x, currentPiece.y, currentPiece.shape)) {
    gameOver = true;
  }
}

void resetGame() {
  memset(board, 0, sizeof(board));
  score = 0;
  linesClearedTotal = 0;
  level = 1;
  dropDelay = 800;
  gameOver = false;
  isPaused = false;
  randomSeed(esp_random());
  nextPieceType = random(1, 8);
  initPiece(currentPiece, random(1, 8));
}

// -----------------------------------------------------------------------------
// LUKISAN GRAFIK (LGFX SPRITE)
// -----------------------------------------------------------------------------
void drawBlock(int x, int y, uint16_t color) {
  canvas.fillRect(x, y, BLOCK_PX, BLOCK_PX, color);
  // Highlight atas/kiri
  canvas.drawFastHLine(x, y, BLOCK_PX, 0xFFFF);
  canvas.drawFastVLine(x, y, BLOCK_PX, 0xFFFF);
  // Bayang bawah/kanan
  canvas.drawFastHLine(x, y + BLOCK_PX - 1, BLOCK_PX, 0x0000);
  canvas.drawFastVLine(x + BLOCK_PX - 1, y, BLOCK_PX, 0x0000);
}

void drawUI() {
  // Latar belakang
  canvas.fillScreen(COLOR_BG);

  // 1. Papan Utama Tetris (Tengah)
  canvas.fillRect(BOARD_OFFSET_X - 4, BOARD_OFFSET_Y - 4, 
                  (BOARD_COLS * BLOCK_PX) + 8, (BOARD_ROWS * BLOCK_PX) + 8, 0x10A2);
  canvas.drawRect(BOARD_OFFSET_X - 4, BOARD_OFFSET_Y - 4, 
                  (BOARD_COLS * BLOCK_PX) + 8, (BOARD_ROWS * BLOCK_PX) + 8, 0x07FF);

  // Lukis Grid & Blok Pegun
  for (int r = 0; r < BOARD_ROWS; r++) {
    for (int c = 0; c < BOARD_COLS; c++) {
      int px = BOARD_OFFSET_X + c * BLOCK_PX;
      int py = BOARD_OFFSET_Y + r * BLOCK_PX;
      if (board[r][c] > 0) {
        drawBlock(px, py, PIECE_COLORS[board[r][c]]);
      } else {
        canvas.drawRect(px, py, BLOCK_PX, BLOCK_PX, COLOR_GRID);
      }
    }
  }

  // Lukis Blok Semasa
  if (!gameOver) {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (currentPiece.shape[r][c]) {
          int px = BOARD_OFFSET_X + (currentPiece.x + c) * BLOCK_PX;
          int py = BOARD_OFFSET_Y + (currentPiece.y + r) * BLOCK_PX;
          if (py >= BOARD_OFFSET_Y) {
            drawBlock(px, py, PIECE_COLORS[currentPiece.type]);
          }
        }
      }
    }
  }

  // 2. Panel Kiri (Markah, Level, Baris)
  canvas.fillRoundRect(30, 40, 220, 240, 10, COLOR_PANEL);
  canvas.drawRoundRect(30, 40, 220, 240, 10, 0x07FF);

  canvas.setTextColor(0x07FF);
  canvas.setTextSize(2);
  canvas.drawString("ESP32-S3 TETRIS", 45, 55);

  canvas.setTextColor(COLOR_TEXT_MUT);
  canvas.setTextSize(1);
  canvas.drawString("MARKAH:", 45, 95);
  canvas.setTextColor(0xFFE0);
  canvas.setTextSize(2);
  canvas.drawNumber(score, 45, 110);

  canvas.setTextColor(COLOR_TEXT_MUT);
  canvas.setTextSize(1);
  canvas.drawString("LEVEL:", 45, 145);
  canvas.setTextColor(0x07E0);
  canvas.setTextSize(2);
  canvas.drawNumber(level, 45, 160);

  canvas.setTextColor(COLOR_TEXT_MUT);
  canvas.setTextSize(1);
  canvas.drawString("BARIS:", 45, 195);
  canvas.setTextColor(0xF800);
  canvas.setTextSize(2);
  canvas.drawNumber(linesClearedTotal, 45, 210);

  // 3. Panel Kanan (Blok Seterusnya & Butang Sentuh)
  canvas.fillRoundRect(550, 40, 210, 130, 10, COLOR_PANEL);
  canvas.drawRoundRect(550, 40, 210, 130, 10, 0x07FF);
  canvas.setTextColor(0x07FF);
  canvas.setTextSize(1);
  canvas.drawString("SETERUSNYA", 610, 50);

  // Lukis Next Piece Preview
  if (nextPieceType > 0) {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (TETROMINOES[nextPieceType - 1][r][c]) {
          drawBlock(620 + c * 18, 75 + r * 18, PIECE_COLORS[nextPieceType]);
        }
      }
    }
  }

  // 4. Butang Sentuh Atas Skrin (On-Screen Touch Buttons)
  // Butang Kiri
  canvas.fillRoundRect(550, 200, 95, 65, 8, 0x2148);
  canvas.drawRoundRect(550, 200, 95, 65, 8, 0x07FF);
  canvas.setTextColor(0xFFFF);
  canvas.setTextSize(2);
  canvas.drawString("< KIRI", 565, 222);

  // Butang Kanan
  canvas.fillRoundRect(665, 200, 95, 65, 8, 0x2148);
  canvas.drawRoundRect(665, 200, 95, 65, 8, 0x07FF);
  canvas.drawString("KANAN >", 675, 222);

  // Butang Pusing (Rotate)
  canvas.fillRoundRect(550, 280, 210, 65, 8, 0x39E7);
  canvas.drawRoundRect(550, 280, 210, 65, 8, 0xFFE0);
  canvas.setTextColor(0x0000);
  canvas.drawString("PUSING (ROTATE)", 568, 302);

  // Butang Jatuh Laju (Drop)
  canvas.fillRoundRect(550, 360, 210, 65, 8, 0xF800);
  canvas.drawRoundRect(550, 360, 210, 65, 8, 0xFFFF);
  canvas.setTextColor(0xFFFF);
  canvas.drawString("JATUH (DROP)", 595, 382);

  // Overlay Game Over
  if (gameOver) {
    canvas.fillRoundRect(250, 180, 300, 120, 12, 0x0000);
    canvas.drawRoundRect(250, 180, 300, 120, 12, 0xF800);
    canvas.setTextColor(0xF800);
    canvas.setTextSize(3);
    canvas.drawString("GAME OVER", 280, 200);
    canvas.setTextColor(0xFFFF);
    canvas.setTextSize(1);
    canvas.drawString("Sentuh skrin atau hantar 'r' di Serial", 270, 250);
  }

  // Tolak ke skrin LCD tanpa kelipan
  canvas.pushSprite(0, 0);
}

// -----------------------------------------------------------------------------
// PENGENDALIAN SENTUHAN (TOUCH CONTROLS)
// -----------------------------------------------------------------------------
unsigned long lastTouchTime = 0;

void handleTouch() {
  uint16_t touchX, touchY;
  if (lcd.getTouch(&touchX, &touchY)) {
    if (millis() - lastTouchTime < 180) return; // Debounce sentuhan
    lastTouchTime = millis();

    if (gameOver) {
      resetGame();
      return;
    }

    // Zon Kiri: (550 <= X <= 645, 200 <= Y <= 265)
    if (touchX >= 550 && touchX <= 645 && touchY >= 200 && touchY <= 265) {
      if (!checkCollision(currentPiece, currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
        currentPiece.x--;
      }
    }
    // Zon Kanan: (665 <= X <= 760, 200 <= Y <= 265)
    else if (touchX >= 665 && touchX <= 760 && touchY >= 200 && touchY <= 265) {
      if (!checkCollision(currentPiece, currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
        currentPiece.x++;
      }
    }
    // Zon Pusing: (550 <= X <= 760, 280 <= Y <= 345)
    else if (touchX >= 550 && touchX <= 760 && touchY >= 280 && touchY <= 345) {
      rotatePiece(currentPiece);
    }
    // Zon Jatuh: (550 <= X <= 760, 360 <= Y <= 425)
    else if (touchX >= 550 && touchX <= 760 && touchY >= 360 && touchY <= 425) {
      while (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
      }
      lockPiece();
    }
  }
}

// -----------------------------------------------------------------------------
// KAWALAN SERIAL DARI KEYBOARD PC (USB SERIAL)
// -----------------------------------------------------------------------------
void handleSerialInput() {
  if (Serial.available()) {
    char c = Serial.read();
    if (gameOver && (c == 'r' || c == 'R')) {
      resetGame();
      return;
    }

    switch (c) {
      case 'a':
      case 'A': // Kiri
        if (!checkCollision(currentPiece, currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
          currentPiece.x--;
        }
        break;
      case 'd':
      case 'D': // Kanan
        if (!checkCollision(currentPiece, currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
          currentPiece.x++;
        }
        break;
      case 'w':
      case 'W': // Pusing
        rotatePiece(currentPiece);
        break;
      case 's':
      case 'S': // Turun 1 langkah
        if (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
          currentPiece.y++;
        } else {
          lockPiece();
        }
        break;
      case ' ': // Hard drop (Spacebar)
        while (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
          currentPiece.y++;
        }
        lockPiece();
        break;
      case 'r':
      case 'R':
        resetGame();
        break;
    }
  }
}

// -----------------------------------------------------------------------------
// SETUP & LOOP UTAMA ARDUINO
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println(">>> Memulakan ESP32-S3 Tetris 4.3 Inci...");

  // Inisialisasi Paparan LCD & Sentuhan
  lcd.init();
  lcd.setRotation(0); // Orientasi Landscape (800x480)
  lcd.setBrightness(255);

  // Cipta Double-Buffer Sprite (800x480) dalam PSRAM ESP32-S3
  canvas.setColorDepth(16);
  canvas.createSprite(800, 480);

  resetGame();
  Serial.println(">>> Permainan Siap! Kawal melalui Touch Skrin atau Serial ('a','d','w','s',' ')");
}

void loop() {
  // 1. Baca Input Touch & Serial Keyboard
  handleTouch();
  handleSerialInput();

  // 2. Graviti Tetris (Turun Automatik)
  if (!gameOver && !isPaused) {
    if (millis() - lastDropTime > dropDelay) {
      lastDropTime = millis();
      if (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
      } else {
        lockPiece();
      }
    }
  }

  // 3. Render Grafik ke Skrin
  drawUI();
  delay(16); // ~60 FPS
}
