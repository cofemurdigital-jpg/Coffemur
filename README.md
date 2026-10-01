# Coffemur — versi terstruktur

## Struktur
- `index.html` — struktur halaman
- `css/style.css` — seluruh styling/responsive
- `js/products.js` — data 18 produk
- `js/app.js` — katalog, pencarian, filter, keranjang, checkout, FAQ, menu, toast, animasi
- `assets/` — tempat foto/logo lokal jika nanti ingin mengganti gambar eksternal

## Cara menjalankan
Buka `index.html` langsung di browser. Untuk pengembangan lebih lanjut, lebih baik gunakan VS Code + Live Server.

## Data produk
Edit `js/products.js` untuk:
- nama produk
- kategori
- harga
- harga coret
- rating
- jumlah terjual
- spesifikasi
- badge
- foto

## Catatan
Versi ini mempertahankan fitur dari file awal. Foto produk masih mengambil referensi dari Unsplash sesuai sumber awal; dapat diganti menjadi foto produk lokal di folder `assets/`.

## Pengembangan berikutnya
1. Checkout WhatsApp otomatis.
2. Nomor order otomatis.
3. Database produk/pesanan dengan Google Sheets atau Supabase.
4. Panel admin sederhana untuk tambah/edit/hapus produk.
5. Stok realtime.
6. Riwayat pesanan pelanggan.
7. Upload foto produk.
8. Promo/voucher dan harga agen.
9. Cetak invoice/nota PDF.
10. Integrasi ongkir dan tracking.

## Coffemur V2 — Google Sheets
Versi ini menambahkan integrasi Google Sheets melalui Google Apps Script. Lihat `GOOGLE-SHEETS-SETUP.md` dan `google-apps-script/Code.gs`.
