# Petunjuk Pemasangan Absensi SiPaud

Fitur baru: **absen guru** (foto selfie + GPS, radius 20 m) dan **absen murid** (H/I/S/A, tanpa foto dan lokasi), plus rekap harian dan bulanan untuk admin. Semua berjalan di situs Anda sendiri lewat halaman `absen.html`.

Tidak perlu server, Firebase Storage, maupun Cloud Functions. Cukup paket gratis Firebase (Spark). Batas gratis bisa berubah, jadi cek halaman harga Firebase sesekali.

## 1. Buat project Firebase
1. Buka https://console.firebase.google.com lalu **Add project** (nama bebas, Google Analytics boleh dimatikan).
2. Pilih paket gratis (Spark). Tidak perlu memasukkan kartu.

## 2. Aktifkan Authentication dan Firestore
1. Menu **Build → Authentication → Get started → Email/Password → Enable**.
2. Menu **Build → Firestore Database → Create database**. Pilih lokasi `asia-southeast2 (Jakarta)`, mulai dengan mode **production**.

## 3. Isi firebase-config.js
1. Di **Project settings (ikon roda gigi) → General → Your apps**, klik ikon web `</>` dan daftarkan app.
2. Salin nilai `apiKey`, `authDomain`, `projectId`, `appId` ke file `firebase-config.js` (ganti semua tulisan `ISI_...`).

API key Firebase memang terlihat publik. Yang melindungi data adalah aturan keamanan di langkah 4.

## 4. Pasang aturan keamanan (wajib)
1. Buka **Firestore Database → Rules**.
2. Hapus isinya, tempel seluruh isi file `firestore.rules`, lalu klik **Publish**.

Aturan ini membuat: guru hanya bisa absen atas namanya sendiri, jarak ke sekolah dicek ulang di server Firebase, jam absen diambil dari server, dan hanya admin yang bisa mengubah data.

## 5. Buat akun Anda sebagai admin
1. **Authentication → Users → Add user**: isi email dan kata sandi Anda.
2. **Firestore Database → Start collection** dengan ID koleksi `guru`.
3. **Document ID** diisi **email Anda, huruf kecil semua, persis sama** (contoh: `admin@gmail.com`). Tambahkan field:
   - `nama` (string): nama Anda
   - `role` (string): `admin`
   - `kelas` (array): kosongkan atau tambah satu item teks kosong lalu hapus

## 6. Unggah situs
Unggah semua file di folder ini ke hosting Anda. Alamat harus **HTTPS**, kalau tidak GPS dan kamera ditolak browser.

Lalu di Firebase buka **Authentication → Settings → Authorized domains → Add domain**, dan tambahkan domain situs Anda (contoh: `sipaudruang-rasamyid.biz.id`). Tanpa langkah ini login ditolak.

## 7. Isi data lewat menu Atur
Buka `absen.html`, masuk sebagai admin, lalu:
1. **Lokasi sekolah:** berdirilah di tengah sekolah, tekan *Pakai lokasi saya sekarang*, atur radius (20), **Simpan**. Wajib dilakukan sebelum guru bisa absen.
2. **Akun 10 guru:** untuk tiap guru, buat dulu akun di **Authentication → Add user** (email + kata sandi), lalu daftarkan emailnya di menu Atur → Data guru, isi nama dan kelas yang diampu.
3. **Murid:** impor dari Excel/Google Sheets (dua kolom: nama dan kelas), atau tambah satu per satu.

Penulisan kelas otomatis dijadikan huruf besar, jadi `tk a` dan `TK A` dianggap sama.

## 8. Uji sebelum dipakai
- Coba absen dari HP guru di dalam dan di luar area sekolah.
- Jika banyak guru gagal padahal di sekolah, naikkan radius ke 30–50 m (GPS HP bisa meleset 5–15 m, lebih besar di dalam ruangan).
- Cek halaman Rekap: foto, jam, dan jarak harus muncul.

## 9. Pasang di HP guru (bentuk aplikasi)
Halaman `absen.html` sudah berbentuk aplikasi HP: menu ada di bagian bawah layar, tombol besar, dan bisa dipasang di layar utama seperti aplikasi biasa.

- **Android (Chrome):** buka alamat situs, lalu ketuk tombol **Pasang** di bagian atas halaman. Jika tidak muncul, buka menu titik tiga → **Pasang aplikasi** / **Tambahkan ke layar utama**.
- **iPhone (Safari):** ketuk tombol **Bagikan** → **Tambah ke Layar Utama**. Di iPhone harus memakai Safari.

Setelah terpasang, ikon "Absen PAUD" muncul di layar utama dan terbuka layar penuh tanpa bilah alamat. Aplikasi tetap butuh internet untuk absen. Saat sinyal hilang hanya tampilan dasarnya yang terbuka.

Berkas yang mendukung ini: `manifest.json`, `sw.js`, `pwa.js`, serta ikon `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`. Semuanya harus ikut diunggah di folder yang sama dengan `absen.html`. Ikon dibuat dari logo asli yang hanya 48 px, jadi hasilnya agak buram. Ganti ketiga ikon itu dengan logo beresolusi tinggi (512 × 512 px) bila ada, dengan nama berkas yang sama.

Setelah mengunggah pembaruan, aplikasi di HP guru otomatis memakai versi baru pada pembukaan berikutnya. Jika masih tampil versi lama, tutup aplikasi lalu buka lagi.

## Hal yang perlu diketahui
- Aplikasi fake GPS masih bisa memalsukan lokasi. Foto selfie dengan cap waktu dan jarak yang tercatat membantu admin memeriksa.
- Tanggal absen diambil dari tanggal HP, sedangkan jam diambil dari server. Jika tanggal HP sengaja diubah, jam di rekap akan tidak cocok.
- Foto disimpan kecil (±20–30 KB) langsung di Firestore, sekitar 20 foto per hari untuk 10 guru.
- Lupa kata sandi guru: reset lewat **Authentication → Users → ⋮ → Reset password**.
- File `script.js` lama tetap dipakai untuk menu dan WhatsApp. Tombol "Isi Absensi" di halaman Service sekarang mengarah ke `absen.html`.
