# 🌋 Indonesia Volcano Ash Tracker & Dispersion Navigation

Sistem pemantauan interaktif sebaran abu vulkanik, arah angin atmosferik real-time, dan estimasi dampak spasial erupsi gunung berapi di Indonesia (Anak Krakatau, Merapi, Semeru, Lewotobi, Marapi, Ruang, Ibu, Sinabung).

Dibangun menggunakan **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, dan integrasi data resmi internasional & nasional:
- **VAAC Darwin (Bureau of Meteorology Australia)**: Buletin dan poligon resmi sebaran abu vulkanik penerbangan internasional.
- **PVMBG / MAGMA Indonesia**: Status level aktivitas dan rekomendasi mitigasi KRB.
- **Open-Meteo & ECMWF**: Vektor kecepatan & arah angin atmosferik permukaan dan ketinggian 850 hPa.
- **Copernicus CAMS**: Kualitas udara real-time ($SO_2$, PM2.5, PM10, Dust, AQI).

---

## 🚀 Fitur Utama

1. **Pemilih Gunung Api Aktif**: Pilihan gunung api di Indonesia lengkap dengan elevasi, radius KRB, dan kode VONA.
2. **Pencarian Kota & Kecamatan**: Geocoding instan untuk menguji apakah lokasi pengguna terdampak.
3. **Analisis Dampak Spasial**: Algoritma *Point-in-Polygon* berbasis data buletin resmi VAAC Darwin, menghitung jarak *geodesic* dan arah azimuth kawah ke target lokasi.
4. **Peta Taktis Interaktif**: Peta custom dark mode dengan garis aliran angin bergerak (*animated wind streamlines*), panah trajektori bercahaya, poligon sebaran abu resmi, serta *floating tactical compass HUD*.
5. **Telemetri Kualitas Udara**: Konsentrasi gas magma $SO_2$ dan partikel abu halus PM2.5 / PM10.

---

## 🛠️ Menjalankan Lokal (Development)

```bash
# Clone repository
git clone https://github.com/VixStnly/vulcano-tracker.git
cd vulcano-tracker

# Install dependensi
npm install

# Jalankan server development
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🚆 Deploy ke Railway

Project ini sudah dilengkapi konfigurasi siap pakai untuk **[Railway](https://railway.com/)**:

1. **Hubungkan GitHub ke Railway**:
   - Buka dashboard [Railway.com](https://railway.com/).
   - Klik **New Project** → **Deploy from GitHub repo**.
   - Pilih repository `VixStnly/vulcano-tracker`.

2. **Deteksi Otomatis (Nixpacks)**:
   - File `railway.json` sudah tersedia di root repository:
     ```json
     {
       "$schema": "https://railway.com/railway.schema.json",
       "build": {
         "builder": "NIXPACKS"
       },
       "deploy": {
         "startCommand": "npm run start"
       }
     }
     ```
   - Railway akan otomatis menjalankan `npm install`, `npm run build`, dan `npm run start`.
   - Variable `PORT` disuplai otomatis oleh Railway.

3. **Generate Domain**:
   - Di tab **Settings** project Railway, pada bagian **Networking**, klik **Generate Domain** untuk mendapatkan URL publik (misal: `vulcano-tracker-production.up.railway.app`).

---

## 📜 Lisensi
MIT License.
