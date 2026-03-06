# Backend - Tugas Matul (Semester 6)

Deskripsi:
- Backend API sederhana untuk tugas mata kuliah (Express + Node.js) yang menyediakan endpoints untuk berita, data peserta, inovasi, dan pengguna.

Fitur utama:
- CRUD untuk `berita`, `dataPeserta`, `inovasi`, `users`
- Middleware autentikasi (`src/Middleware/auth.js`)
- Upload file dengan middleware (`src/Middleware/Upload.js`)
- Struktur MVC sederhana (Controllers, Models, Routes)

Prasyarat:
- Node.js v14+ dan npm
- Database MySQL (lihat `query.sql` untuk struktur tabel)

Instalasi:
1. Clone repo
2. Install dependencies

```bash
npm install
```

3. Siapkan environment variables (contoh `.env`):

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdbname
JWT_SECRET=rahasia
```

Menjalankan aplikasi:

```bash
npm start
# atau untuk development dengan nodemon
npm run dev
```

Struktur penting:
- `index.js` - entrypoint aplikasi
- `src/config/db.js` - konfigurasi koneksi database
- `src/Controller/` - logika endpoint
- `src/Models/` - definisi model dan query
- `src/Routes/` - definisi route untuk setiap resource
- `query.sql` - skrip SQL contoh untuk membuat tabel

API (route dasar):
- `GET /api/berita` - daftar berita
- `POST /api/berita` - buat berita
- `GET /api/berita/:id` - detail berita
- `PUT /api/berita/:id` - update berita
- `DELETE /api/berita/:id` - hapus berita

- `GET /api/dataPeserta` - daftar peserta
- `POST /api/dataPeserta` - buat data peserta

- `GET /api/inovasi` - daftar inovasi
- `POST /api/inovasi` - buat inovasi

- `POST /api/users/register` - registrasi pengguna
- `POST /api/users/login` - login (mengembalikan JWT)

Catatan:
- Pastikan variabel JWT_SECRET sama dengan yang digunakan di `src/Middleware/auth.js`.
- Jika menggunakan upload file, periksa konfigurasi di `src/Middleware/Upload.js`.

Kontribusi:
- Buka issue atau PR untuk perbaikan atau fitur baru.

Lisensi:
- Silakan tambahkan lisensi proyek jika diperlukan.
