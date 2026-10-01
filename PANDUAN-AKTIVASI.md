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
