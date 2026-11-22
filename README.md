# 🕹️ Retro Arcade Web & ESP32-S3 Game Collection

Koleksi permainan arked klasik retro berwarna-warni yang boleh dimainkan terus pada **Pelayar Web Google Chrome** (menggunakan HTML5 Canvas & Web Audio API tanpa sebarang pemasangan luar), berserta kod **Arduino untuk mikropengawal ESP32-S3 dengan paparan 4.3 inci (800×480 RGB LCD)**!

---

## 🌟 Permainan yang Disertakan

| Permainan | Penerangan | Fail Utama |
| :--- | :--- | :--- |
| **🧱 Tetris Warna-Warni** | 7 blok Tetromino neon, fungsi *Hold Piece*, bayang *Ghost Piece*, kesan letupan partikel dan putaran *Wall-kick*. | [`index.html`](index.html) |
| **🟡 Google Pac-Man Doodle** | Edisi Ulang Tahun Ke-30 Google ("GOOGLE" maze 58×17) & mod Klasik 1980, lagu intro asal, butang *Insert Coin*, AI hantu aktif & kitaran hidup semula. | [`pacman/index.html`](pacman/index.html) |
| **💣 Bomberman Klasik** | Letupan bersilang, rantaian letupan bom, musuh Ballom, serta item kuasa tersembunyi (💣 +Bom, 🔥 +Api, ⚡ +Laju, 🚪 Pintu Rahsia). | [`bomberman/index.html`](bomberman/index.html) |
| **🎮 Pusat Arcade (Menu)** | Menu pelancar utama dengan kad visual untuk bertukar antara semua permainan dengan mudah. | [`arcade_hub.html`](arcade_hub.html) |

---

## 🚀 Cara Menjalankan pada Pelayar Web (PC)

Tiada sebarang *server* atau muat turun pustaka luar (*dependencies*) diperlukan!

1. Klon atau muat turun repositori ini:
   ```bash
   git clone https://github.com/USERNAME/REPO_NAME.git
   ```
2. Buka fail [`arcade_hub.html`](arcade_hub.html) atau mana-mana fail permainan (`index.html`) dengan klik dua kali untuk membukanya terus di **Google Chrome** atau pelayar moden pilihan anda.

---

## ⌨️ Panduan Kawalan Papan Kekunci (PC)

### 1. Tetris Warna-Warni
* <kbd>◀</kbd> <kbd>▶</kbd> / <kbd>A</kbd> <kbd>D</kbd> : Gerak Kiri / Kanan
* <kbd>▲</kbd> / <kbd>W</kbd> : Pusing Blok (*Rotate*)
* <kbd>▼</kbd> / <kbd>S</kbd> : Jatuh Perlahan (*Soft Drop*)
* <kbd>SPACE</kbd> : Jatuh Terus (*Hard Drop*)
* <kbd>C</kbd> / <kbd>SHIFT</kbd> : Simpan Blok (*Hold Piece*)
* <kbd>P</kbd> / <kbd>ESC</kbd> : Jeda (*Pause*) | <kbd>R</kbd> : Mula Semula (*Restart*)

### 2. Google Pac-Man Doodle
* <kbd>▲</kbd> <kbd>▼</kbd> <kbd>◀</kbd> <kbd>▶</kbd> / <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> : Kawal Arah Pac-Man
* <kbd>SPACE</kbd> / <kbd>ENTER</kbd> : *Insert Coin* / Mula Permainan
* <kbd>P</kbd> : Jeda | <kbd>R</kbd> : Mula Semula

### 3. Bomberman Klasik
* <kbd>▲</kbd> <kbd>▼</kbd> <kbd>◀</kbd> <kbd>▶</kbd> / <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> : Gerak Bomberman
* <kbd>SPACE</kbd> : **Letak Bom 💣**
* <kbd>P</kbd> : Jeda | <kbd>R</kbd> : Mula Semula

---

## 📟 Versi Arduino ESP32-S3 (Paparan 4.3 Inci 800×480)

Folder [`esp32_tetris/`](esp32_tetris/) mengandungi skrip penuh Arduino untuk memainkan Tetris pada perkakasan **ESP32-S3** dengan skrin 4.3" (contohnya modul **ESP32-8048S043** Sunton / Guition / Elecrow).

### Keperluan:
* **Pustaka Arduino:** Pasang `LovyanGFX` oleh **lovyan03**.
* **Tetapan Board Arduino IDE:**
  - Board: `ESP32S3 Dev Module`
  - Flash Size: `16MB`
  - PSRAM: `OPI PSRAM` ⚠️ *(Wajib untuk sprite grafik 800×480 16-bit tanpa kelipan)*
  - USB CDC On Boot: `Enabled`
* **Kawalan:**
  - Sentuhan skrin kapasitif GT911 (butang sentuh disediakan pada skrin).
  - Kawalan papan kekunci PC melalui **Serial Monitor** USB (115200 baud: `a`, `d`, `w`, `s`, `space`).

---

## 📁 Struktur Fail Projek

```text
├── README.md                   <- Dokumentasi projek
├── arcade_hub.html             <- Menu Utama Pusat Permainan
│
├── index.html                  <- Web Tetris Warna-Warni
├── style.css
├── audio.js                    <- Penjana kesan bunyi Web Audio API
├── script.js                   <- Enjin permainan Tetris
│
├── pacman/                     <- Google Pac-Man Doodle & Klasik
│   ├── index.html
│   ├── style.css
│   ├── audio.js                <- Lagu intro asal & siren sintesis
│   └── script.js
│
├── bomberman/                  <- Bomberman Klasik
│   ├── index.html
│   ├── style.css
│   ├── audio.js
│   └── script.js
│
└── esp32_tetris/               <- Kod Arduino ESP32-S3 (Paparan 4.3" 800x480)
    ├── esp32_tetris.ino
    └── README.md
```

---

## 📄 Lesen
Projek ini dibangunkan untuk tujuan pembelajaran dan pemuliharaan arked retro. Bebas untuk digunakan dan dikongsi!
