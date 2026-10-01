# Coffemur V2 — Google Sheets

ZIP ini sudah disiapkan untuk memakai Google Sheets sebagai database produk dan pesanan.

## 1. Google Sheet
Gunakan spreadsheet yang sudah kamu kirim:
`https://docs.google.com/spreadsheets/d/1-t04oImAo1x4fmhPI5zqrbQ4aKLVwugkwP73ExC6nM4/edit`

## 2. Apps Script
Buka spreadsheet → **Extensions → Apps Script**.
Salin isi `google-apps-script/Code.gs` ke project Apps Script tersebut.
Jalankan fungsi `setup()` sekali untuk membuat 3 sheet:
- PRODUK
- PESANAN
- DETAIL_PESANAN

Setelah itu isi data produk pada sheet **PRODUK**. Kolom `specs` dipisahkan dengan `||`.

## 3. Deploy Web App
Apps Script → **Deploy → New deployment → Web app**.
- Execute as: **Me**
- Who has access: **Anyone**

Salin URL yang berakhiran `/exec` ke `js/config.js` pada `apiUrl`.

> URL Apps Script yang kamu kirim sudah dimasukkan ke `js/config.js`. Jika itu adalah deployment dari script yang berbeda, deploy `Code.gs` ini dan ganti `apiUrl` dengan URL deployment baru.

## 4. Cara kerja
- Website mengambil produk dari `GET ?action=products`.
- Checkout mengirim order ke `POST` Apps Script.
- Order masuk ke **PESANAN** dan detail item masuk ke **DETAIL_PESANAN**.
- Jika kolom `stok` di PRODUK diisi angka, stok akan otomatis berkurang saat order berhasil.
- Jika Google Sheets belum siap, website masih menampilkan katalog lokal sebagai fallback.
