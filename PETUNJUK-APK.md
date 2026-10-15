# Membuat APK Android (Absen PAUD)

APK dibangun otomatis oleh GitHub dari repo yang sama dengan situs Anda. Anda tidak perlu Android Studio dan tidak perlu menginstal apa pun di komputer. Gratis untuk repo publik.

Lakukan dulu **PETUNJUK-SETUP.md** (Firebase dan firebase-config.js terisi). APK hanya membungkus aplikasi yang sama, jadi Firebase tetap wajib.

## 1. Pastikan berkas ini ada di repo
Selain file situs, repo harus berisi:

| Berkas | Fungsi |
|---|---|
| `package.json` | daftar alat pembungkus (Capacitor) |
| `capacitor.config.json` | nama aplikasi dan ID paket |
| `debug.keystore` | kunci tanda tangan tetap, supaya versi baru bisa menimpa versi lama |
| `.github/workflows/build-apk.yml` | resep pembuat APK |

Folder `.github` kadang tersembunyi di komputer, jadi sering tidak ikut terunggah saat seret-lepas. Cara aman membuatnya langsung di GitHub:
1. Di repo, klik **Add file → Create new file**.
2. Di kolom nama, ketik persis `.github/workflows/build-apk.yml` (tanda `/` otomatis membuat folder).
3. Buka berkas `build-apk.yml` dari ZIP dengan Notepad, salin seluruh isinya, tempel di GitHub, lalu **Commit changes**.

## 2. Bangun APK
1. Buka tab **Actions** di repo. Jika muncul tombol hijau untuk mengaktifkan, klik.
2. Pilih **Build APK Android** di kiri, lalu klik **Run workflow → Run workflow**.
3. Tunggu sekitar 5–10 menit sampai muncul tanda centang hijau.

## 3. Ambil APK-nya
Buka halaman utama repo, lalu klik **Releases** di kolom kanan. Di sana ada **Absen PAUD v1.N** dengan berkas **Absen-PAUD.apk**. Alamat halaman itu bisa dikirim ke guru, dan berkasnya bisa diunduh tanpa login GitHub.

## 4. Kirim dan pasang di HP guru
- **Kirim link Releases lewat WhatsApp.** Ini paling andal, karena WhatsApp kadang menolak atau mengubah berkas `.apk`. Kalau mau mengirim berkasnya langsung, coba kirim sebagai dokumen.
- Di HP Android guru: unduh APK, ketuk berkasnya, lalu izinkan **Pasang aplikasi dari sumber ini** untuk browser atau WhatsApp yang dipakai.
- Jika muncul peringatan Play Protect (aplikasi tidak dari Play Store), pilih **Tetap instal**. Ini wajar untuk APK di luar Play Store.
- Saat pertama dibuka, izinkan **Kamera** dan **Lokasi**. Tanpa izin lokasi, absen guru tidak bisa dilakukan.

## 5. Memperbarui aplikasi
Isi APK adalah salinan situs saat dibangun. Kalau Anda mengubah situs (misalnya `firebase-config.js`), jalankan lagi **Run workflow**, lalu kirim link Release yang baru. Guru memasangnya langsung di atas aplikasi lama, tanpa mencopot. Data aman karena tersimpan di Firebase. Nomor versi naik otomatis.

## Hal yang perlu diketahui
- Ini **hanya Android**. Guru dengan iPhone memakai link situs dan menambahkannya ke layar utama (lihat PETUNJUK-SETUP.md bagian 9).
- Login di dalam APK memakai alamat bawaan `localhost`. Di Firebase, **Authentication → Settings → Authorized domains** biasanya sudah memuatnya. Jika login ditolak, pastikan `localhost` ada di daftar itu.
- Tombol foto membuka aplikasi kamera HP. Jika yang terbuka kamera belakang, guru tinggal membalik ke kamera depan.
- `debug.keystore` adalah kunci tipe debug dan ikut terlihat di repo publik. Cukup untuk dipakai sekolah kecil, tetapi bukan untuk diunggah ke Play Store. Untuk Play Store diperlukan kunci rilis rahasia.
- Alur pembangunan ini belum pernah dijalankan di GitHub oleh saya. Kalau ada langkah yang gagal (tanda silang merah), klik langkah itu, salin pesan errornya, dan kirim ke saya.
