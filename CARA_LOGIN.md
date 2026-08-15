# 🔐 Cara Login ke Aplikasi RTLH

## ⚠️ PENTING - Gunakan localhost, bukan IP address!

### ❌ JANGAN gunakan:
- ~~http://192.168.100.16:3000~~

### ✅ GUNAKAN:
- **http://localhost:3000**

## Mengapa?

Ketika Anda menggunakan IP address (192.168.100.16), browser menganggapnya sebagai **cross-origin request**, sehingga cookie tidak bisa di-set dengan benar. Ini menyebabkan login berhasil tapi tidak bisa redirect ke dashboard.

## Langkah-langkah Login:

1. **Buka browser di komputer yang sama dengan server**
   ```
   http://localhost:3000/login
   ```

2. **Masukkan kredensial admin**:
   - NIP: `admin`
   - Password: `admin123`

3. **Klik tombol "Login"**

4. **Anda akan diarahkan ke dashboard** dalam 1 detik

## Jika Tetap Tidak Bisa Login:

### Solusi 1: Clear Browser Cache & Cookies
1. Buka Developer Tools (F12)
2. Klik tab "Application" atau "Storage"
3. Hapus semua cookies untuk localhost:3000
4. Refresh halaman (Ctrl+R atau F5)
5. Login lagi

### Solusi 2: Cek Console untuk Error
1. Buka Developer Tools (F12)
2. Klik tab "Console"
3. Lihat apakah ada error merah
4. Screenshot dan laporkan jika ada error

### Solusi 3: Test API Langsung
Buka di browser:
```
http://localhost:3000/api/me
```

Jika muncul error "Token tidak ditemukan", berarti cookie memang tidak ter-set.

## Akses dari Komputer Lain (Optional)

Jika Anda **HARUS** akses dari komputer lain menggunakan IP address:

1. **Gunakan localhost di komputer server**
2. **Atau**, edit file `hosts` di komputer client:

### Windows (komputer client):
```powershell
# Jalankan sebagai Administrator
notepad C:\Windows\System32\drivers\etc\hosts

# Tambahkan baris ini:
192.168.100.16    rtlh.local

# Save dan close
```

### Linux/Mac (komputer client):
```bash
sudo nano /etc/hosts

# Tambahkan baris ini:
192.168.100.16    rtlh.local

# Save (Ctrl+O) dan close (Ctrl+X)
```

3. **Akses menggunakan domain**:
   ```
   http://rtlh.local:3000
   ```

## Troubleshooting Tambahan

### Error: "Token tidak valid"
- Pastikan JWT_SECRET di `.env` sama dengan yang digunakan saat membuat user
- Coba hapus dan buat ulang user admin:
  ```bash
  node prisma/seed.js
  ```

### Error: "Database connection failed"
- Cek koneksi internet
- Pastikan DATABASE_URL di `.env` benar
- Test koneksi: http://localhost:3000/api/test-db

### Port 3000 sudah digunakan
```bash
# Windows
taskkill /F /IM node.exe

# Atau ganti port
pnpm dev -p 3001
```

## Status Check

✅ Server berjalan: http://localhost:3000  
✅ Database terkoneksi: Neon PostgreSQL  
✅ User admin tersedia: NIP `admin` / Password `admin123`  
✅ Middleware aktif: Melindungi route yang memerlukan auth  

---

**Update terakhir**: November 10, 2025  
**Status**: ✅ Aplikasi siap digunakan (gunakan localhost!)
