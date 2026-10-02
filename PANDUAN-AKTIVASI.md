# Panduan Aktivasi Coffemur (6 langkah)

PIN admin sudah tertulis di Code.gs: **admin5858** (ganti nanti di baris `ADMIN_PIN`).

1. Buka Google Sheet -> Extensions -> Apps Script. Hapus semua isi, tempel isi `google-apps-script/Code.gs`. Klik Save.
2. Pilih fungsi `setup` di dropdown -> Run -> izinkan akses. (Membuat sheet PRODUK, PESANAN, DETAIL_PESANAN.)
3. Deploy -> **New deployment** -> ikon roda gigi -> Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**
   -> Deploy. **Salin URL yang berakhiran /exec.**
4. Buka `js/config.js`, tempel URL itu di `apiUrl` (di antara tanda kutip). Save.
5. Sheet PRODUK -> File -> Import -> Upload `produk-import.csv` -> *Replace current sheet*.
6. Upload semua file ke Netlify / GitHub Pages / Cloudflare Pages.

## Tes
Buka di browser: `URL_EXEC?action=adminProducts&token=admin5858`
Harus muncul `{"ok":true,"products":[...`

Lalu buka `admin-produk.html`, masukkan PIN, tambah produk, refresh `index.html`.

## Invoice otomatis via WhatsApp (Fonnte)
Setiap order masuk, WA toko otomatis mengirim pesan + invoice PDF ke WA pemesan.

1. Daftar di fonnte.com, hubungkan nomor WA toko (scan QR), lalu salin **token** device.
2. Di Apps Script, isi `FONNTE_TOKEN` di `Code.gs` dengan token tersebut. Save.
3. Pilih fungsi `testKirimWa` -> Run -> izinkan akses (butuh izin koneksi eksternal). Invoice contoh akan masuk ke WA toko.
4. Deploy -> **Manage deployments** -> edit -> **New version** -> Deploy. URL /exec tetap sama.
5. Jika pengiriman gagal, order tetap tersimpan. Alasannya dicatat di sheet **LOG_WA**.

Opsional: isi `WA_SITE_URL` agar pesan WA memuat link lacak pesanan.
Catatan: pengiriman file/media di Fonnte hanya tersedia di paket yang mendukung media.
