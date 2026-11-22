# Panduan Tetris ESP32-S3 (Paparan 4.3 Inci 800x480)

Projek ini menyediakan kod Arduino untuk menjalankan permainan Tetris berwarna-warni pada perkakasan **ESP32-S3** dengan paparan skrin **4.3 Inci (800x480 RGB LCD)** seperti modul popular **ESP32-8048S043** (Sunton, Guition, Elecrow, atau Makerfabs).

---

## 1. Keperluan Perkakasan & Pustaka (Library)

1. **Papan Pembangunan**:
   - ESP32-S3 dengan 16MB Flash dan 8MB PSRAM (Octal/OPI PSRAM).
   - Skrin 4.3" 800x480 RGB Interface (contoh: ESP32-8048S043 dengan sentuhan kapasitif GT911).

2. **Pustaka Arduino Diperlukan**:
   - Buka **Arduino IDE** -> **Library Manager** (`Ctrl + Shift + I`).
   - Cari dan pasang: `LovyanGFX` oleh **lovyan03** (versi terkini).

---

## 2. Tetapan Arduino IDE (Tools Menu)

Sebelum muat naik (Upload) kod ke ESP32-S3:

- **Board**: `ESP32S3 Dev Module`
- **USB CDC On Boot**: `Enabled`
- **Flash Size**: `16MB (128Mb)`
- **Partition Scheme**: `16M Flash (3MB APP/9.9MB FATFS)` atau `Huge APP (3MB No OTA/1MB SPIFFS)`
- **PSRAM**: `OPI PSRAM` ⚠️ *(PENTING: Mesti pilih OPI PSRAM kerana sprite 800x480 16-bit menggunakan memori PSRAM)*
- **Upload Speed**: `921600`

---

## 3. Cara Mengawal Permainan

Kod ini menyokong 2 kaedah kawalan serentak:

1. **Sentuhan Skrin (Touch Screen GT911)**:
   - Butang sentuh telah dilukis di sebelah kanan skrin:
     - **`< KIRI`**: Gerak ke kiri
     - **`KANAN >`**: Gerak ke kanan
     - **`PUSING (ROTATE)`**: Pusingkan blok Tetris
     - **`JATUH (DROP)`**: Jatuh terus ke lantai (Hard drop)

2. **Kawalan Papan Kekunci PC melalui Serial Monitor**:
   - Sambungkan ESP32-S3 ke PC dengan kabel USB.
   - Buka **Serial Monitor** pada baud rate `115200`.
   - Taip dan hantar huruf:
     - `a` = Gerak Kiri
     - `d` = Gerak Kanan
     - `w` = Pusing
     - `s` = Turun perlahan (Soft Drop)
     - ` ` (Spacebar) = Jatuh terus (Hard Drop)
     - `r` = Mula semula (Restart)

---

## 4. Struktur Fail Projek

```text
tetris_game/
├── index.html                  <- Web Tetris untuk pelayar Google Chrome
├── style.css                   <- Penggayaan warna-warni & efek neon
├── audio.js                    <- Sintesis kesan bunyi Web Audio API
├── script.js                   <- Enjin permainan Tetris Web
└── esp32_tetris/
    ├── esp32_tetris.ino        <- Skrip Arduino ESP32-S3 (LovyanGFX 800x480)
    └── README.md               <- Panduan setup Arduino IDE
```
