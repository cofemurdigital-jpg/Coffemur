# UNIT Supply — Dashboard Admin + Tracking Order

## Yang ditambahkan
- `admin.html`: dashboard omzet, jumlah order, status order, produk terlaris, stok menipis.
- `tracking.html`: pelanggan bisa melacak order memakai nomor order + WhatsApp.
- Admin bisa mengubah status: BARU → DIPROSES → DIKIRIM → SELESAI / DIBATALKAN.
- Apps Script menambah endpoint `dashboard`, `orders`, `tracking` dan aksi POST `updateStatus`.

## Update Apps Script
Salin ulang isi `google-apps-script/Code.gs` ke Apps Script yang terhubung ke Sheet, lalu Deploy → Manage deployments → Edit → New version → Deploy.

## Cara buka
- Toko: `index.html`
- Tracking: `tracking.html`
- Admin: `admin.html`

Catatan: halaman admin pada versi ini memakai proteksi tingkat aplikasi/browser, bukan autentikasi server-side. Untuk penggunaan internal, jangan sebarkan URL admin secara publik. Jika nanti diperlukan, tahap berikutnya bisa dibuat login admin yang benar-benar tervalidasi di server.
