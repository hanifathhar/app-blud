# Informasi Login Aplikasi RTLH

## 🔐 Kredensial Admin Default

- **NIP**: `admin`
- **Password**: `admin123`
- **Role**: ADMIN
- **Email**: admin@rtlh.com

## 🌐 URL Aplikasi

- **Development**: http://localhost:3000
- **Login Page**: http://localhost:3000/login

## 📊 Database

- **Provider**: Neon PostgreSQL
- **Status**: ✅ Connected
- **Data Seeded**: 
  - ✅ 15 Kecamatan
  - ✅ 238 Desa
  - ✅ 1 User Admin

## 🛡️ Fitur Keamanan

- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ Route Protection (Middleware)
- ✅ Role-based Access Control (RBAC)

## 📝 Role & Permission

### ADMIN
- Akses penuh ke semua fitur
- Manajemen user
- Verifikasi data survey
- Export data

### VERIFIER
- Verifikasi data survey
- View data survey
- Update status survey

### SURVEY
- Input data survey baru
- View survey yang dibuat sendiri
- Edit survey yang masih pending

## 🚀 Cara Menjalankan

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Database Migration**:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed Database** (jika belum):
   ```bash
   node prisma/seed.js
   ```

5. **Start Development Server**:
   ```bash
   pnpm dev
   ```

6. **Akses Aplikasi**:
   - Buka browser: http://localhost:3000
   - Login dengan kredensial admin di atas

## 📱 Halaman Utama

- `/login` - Halaman login
- `/dashboard` - Dashboard utama
- `/rumah` - Data survey rumah
- `/verifikasi` - Verifikasi data (Verifier/Admin)
- `/users` - Manajemen user (Admin only)
- `/wilayah` - Data wilayah (Kecamatan & Desa)
- `/profile` - Profil user

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Ubah password

### Data
- `GET /api/rumah` - Get data survey
- `POST /api/rumah` - Create survey baru
- `GET /api/kecamatan` - Get data kecamatan
- `GET /api/desa` - Get data desa
- `GET /api/ringkasan` - Get ringkasan statistik

## ⚠️ Catatan Penting

1. Jangan lupa ganti password admin setelah login pertama kali
2. JWT_SECRET sudah di-set di `.env`
3. Database sudah terkoneksi ke Neon PostgreSQL
4. Middleware sudah melindungi route yang memerlukan autentikasi
5. File upload disimpan di folder `public/uploads/`

## 🐛 Troubleshooting

### Port sudah digunakan
```bash
# Hentikan proses Node.js yang berjalan
taskkill /F /IM node.exe

# Atau ganti port di package.json
"dev": "next dev -p 3001"
```

### Prisma Client Error
```bash
# Generate ulang Prisma Client
npx prisma generate
```

### Database Connection Error
- Cek koneksi internet
- Pastikan DATABASE_URL di `.env` benar
- Cek apakah Neon DB masih aktif

---

**Dibuat**: November 10, 2025  
**Status**: ✅ Ready to Use
