# ChatWave

ChatWave adalah aplikasi chat real-time berbasis React, Vite, Supabase, dan Capacitor untuk web serta Android.

## Fitur yang tersedia

- Login dan pendaftaran dengan email/password.
- Profil pengguna: nama tampilan, username, dan foto profil.
- Chat pribadi satu lawan satu dengan pembaruan pesan real-time.
- Balas pesan, edit pesan sendiri, dan tarik pesan untuk semua orang.
- Reaksi emoji pada pesan dengan jumlah reaksi yang tersinkron antarpengguna.
- Kirim foto, video, file, lokasi, serta Voice Note.
- Status teks, foto, dan video yang berakhir setelah 24 jam.
- Privasi Status: hanya kontak yang pernah memiliki percakapan pribadi, atau semua pengguna ChatWave.
- Pencatatan penayangan Status dan pembatasan akses media Status melalui RLS.
- Grup chat: buat grup, ubah nama, tambah/keluarkan anggota, jadikan admin, keluar, dan hapus grup oleh pemilik.
- Panggilan suara/video pribadi melalui WebRTC.
- Log panggilan dengan tanggal dan durasi.
- Presence, indikator sedang mengetik, status online/terakhir dilihat, dan indikator pesan dibaca.
- Paket Android debug APK melalui GitHub Actions.

## Menjalankan secara lokal

1. Pasang Node.js.
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.

## Build web

Jalankan `npm run build`. Folder hasil build adalah `dist`.

## Build Android

GitHub Actions menjalankan build Android debug dan mengunggah artifact APK. Gunakan APK dari run yang sesuai dengan commit terbaru; jangan memakai artifact dari build lama.

## Keamanan

- Frontend hanya menggunakan Supabase publishable key.
- Jangan pernah menaruh service-role key di kode frontend.
- Akses tabel dan file dilindungi oleh Row Level Security (RLS).
- Media Status mengikuti pengaturan audiens pada setiap Status.

## Tahap pengembangan berikutnya

- Push notification saat aplikasi tidak sedang terbuka (memerlukan konfigurasi FCM/Web Push).
- Panggilan grup.
- End-to-end encryption (E2EE) setelah desain kunci, pemulihan akun, dan kompatibilitas multi-perangkat dirancang serta diuji.
