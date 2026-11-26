# ChatWave

ChatWave adalah aplikasi chat real-time berbasis React, Vite, Supabase, dan Capacitor untuk web serta Android.

## Fitur yang sudah tersedia

- Login dan pendaftaran dengan email/password.
- Profil pengguna: nama tampilan, username, dan foto profil.
- Chat pribadi satu lawan satu dengan pembaruan pesan real-time.
- Balas pesan, edit pesan sendiri, dan tarik pesan untuk semua orang.
- Reaksi emoji pada pesan dengan jumlah reaksi yang tersinkron antarpengguna.
- Kirim foto, video, file, lokasi, serta Voice Note.
- Status teks, foto, dan video yang berakhir setelah 24 jam; termasuk pencatatan penayangan.
- Grup chat: buat grup, kelola nama, tambah/keluarkan anggota, ubah anggota menjadi admin, keluar, dan hapus grup sebagai pemilik.
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
- Akses tabel dan file harus tetap dilindungi oleh Row Level Security (RLS).

## Tahap pengembangan berikutnya

- Push notification saat aplikasi tidak sedang terbuka.
- Panggilan grup.
- Penguatan privasi dan opsi kontrol siapa yang dapat melihat Status.
- End-to-end encryption (E2EE) setelah desain kunci, pemulihan akun, dan kompatibilitas multi-perangkat dirancang serta diuji.
