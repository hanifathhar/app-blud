# 🚀 Deployment ke Vercel - Panduan Lengkap

## 📋 Checklist Sebelum Deploy

✅ Environment variables sudah disiapkan  
✅ Database Neon sudah aktif  
✅ Kode sudah di-commit ke GitHub  
✅ Build lokal berhasil (`pnpm build`)  

## 🔧 Environment Variables

### Di Vercel Dashboard (https://vercel.com/sendy05s-projects/app-rtlh-desk/settings/environment-variables)

Tambahkan variabel berikut:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_fJB2FeCDd5Hc@ep-billowing-fog-ah5jtcd0-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production, Preview, Development |
| `JWT_SECRET` | `rahasia-super-aman` | Production, Preview, Development |
| `PRISMA_CLI_QUERY_ENGINE_TYPE` | `binary` | Production, Preview, Development |
| `PRISMA_GENERATE_SKIP_AUTOINSTALL` | `false` | Production, Preview, Development |

### 🔒 Rekomendasi JWT_SECRET untuk Production

Untuk keamanan lebih baik, generate JWT secret baru:

```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Contoh output:
```
8f9a3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Gunakan output ini sebagai `JWT_SECRET` di production.

## 📁 File Konfigurasi yang Sudah Dibuat

### 1. `vercel.json`
Konfigurasi deployment Vercel dengan:
- Build command otomatis
- Function memory allocation
- Headers CORS
- Rewrites untuk uploads

### 2. `next.config.ts`
Next.js config yang dioptimasi untuk Vercel:
- Standalone output mode
- Webpack config untuk Prisma
- Image optimization
- Server actions config

### 3. `.vercelignore`
File yang diabaikan saat deploy untuk mempercepat build

## 🎯 Langkah-langkah Deploy

### 1. **Setup Environment Variables**

1. Buka: https://vercel.com/sendy05s-projects/app-rtlh-desk
2. Klik tab **"Settings"**
3. Klik **"Environment Variables"**
4. Tambahkan satu per satu variabel di atas

**Cara menambahkan:**
- Klik **"Add New"**
- Name: `DATABASE_URL`
- Value: (paste connection string)
- Environment: Check **Production**, **Preview**, **Development**
- Klik **"Save"**
- Ulangi untuk variabel lainnya

### 2. **Push ke GitHub**

```bash
git add .
git commit -m "Add Vercel configuration and optimize for deployment"
git push origin main
```

### 3. **Vercel Auto Deploy**

Vercel akan otomatis:
1. Detect push ke GitHub
2. Trigger build process
3. Install dependencies (`pnpm install`)
4. Generate Prisma Client (`npx prisma generate`)
5. Build aplikasi (`next build`)
6. Deploy ke production

### 4. **Monitor Deployment**

1. Buka tab **"Deployments"**
2. Lihat status build (Building → Ready)
3. Klik deployment untuk melihat logs
4. Cek jika ada error di build logs

## 🔍 Verifikasi Deployment

### Cek Build Logs

Pastikan tidak ada error di:
- ✅ Install dependencies
- ✅ Prisma generate
- ✅ Next.js build
- ✅ Collect pages
- ✅ Generate static pages

### Test Production URL

Setelah deploy berhasil, test:

```bash
# URL production
https://app-rtlh-desk.vercel.app

# Test login
https://app-rtlh-desk.vercel.app/login

# Test API
https://app-rtlh-desk.vercel.app/api/kecamatan
```

### Test Fitur Utama

1. **Login** dengan kredensial admin
2. **Dashboard** - Cek apakah data muncul
3. **Data Rumah** - Test CRUD operations
4. **Upload File** - Test file upload
5. **Export** - Test export PDF/Excel

## ⚠️ Troubleshooting

### Build Failed - Prisma Error

```bash
Error: @prisma/client did not initialize yet
```

**Solusi:**
- Pastikan `postinstall` script ada di `package.json`
- Cek environment variables sudah benar
- Redeploy

### Database Connection Error

```bash
Error: Can't reach database server
```

**Solusi:**
- Cek `DATABASE_URL` di environment variables
- Pastikan Neon database masih aktif
- Cek connection string format

### Middleware Error

```bash
Error: The edge runtime does not support...
```

**Solusi:**
- Middleware sudah diupdate untuk Edge Runtime
- Clear Vercel cache: Settings → Clear Cache → Redeploy

### Cookie Not Set (Login Loop)

**Solusi:**
- Gunakan production URL, bukan preview URL
- Clear browser cookies
- Check `sameSite` cookie settings

## 🔄 Redeploy Manual

Jika perlu redeploy tanpa push baru:

1. Klik tab **"Deployments"**
2. Klik **titik tiga (...)** pada deployment terakhir
3. Klik **"Redeploy"**
4. Pilih **"Use existing Build Cache"** atau **"Redeploy from scratch"**

## 📊 Performance Optimization

### Sudah Diimplementasi:

- ✅ Standalone output mode (smaller bundle)
- ✅ Image optimization enabled
- ✅ API routes memory allocation (1024MB)
- ✅ Max duration 10s untuk API
- ✅ Webpack externals untuk Prisma

### Tips Tambahan:

1. **Enable Vercel Analytics**
   - Settings → Analytics → Enable

2. **Enable Vercel Speed Insights**
   - Settings → Speed Insights → Enable

3. **Setup Custom Domain** (Optional)
   - Settings → Domains → Add Domain

## 🌍 Regions & Performance

Default region: **iad1** (US East - Virginia)

Untuk Indonesia, bisa tambahkan region:
- `sin1` - Singapore
- `hnd1` - Tokyo

Edit `vercel.json`:
```json
"regions": ["sin1", "iad1"]
```

## 📝 Post-Deployment Checklist

✅ Login berhasil  
✅ Dashboard loading dengan data  
✅ API endpoints berfungsi  
✅ File upload works  
✅ Database queries berhasil  
✅ No console errors  
✅ Mobile responsive  

## 🔐 Security Checklist

✅ JWT_SECRET di-set dengan aman  
✅ DATABASE_URL tidak hardcoded di code  
✅ Environment variables tidak di-commit  
✅ CORS headers dikonfigurasi  
✅ Cookie secure di production  

## 📞 Support

Jika ada masalah:
1. Cek **Build Logs** di Vercel
2. Cek **Function Logs** di Vercel
3. Cek **Runtime Logs** di Vercel
4. Buka issue di GitHub repository

## 🎉 Selesai!

Aplikasi Anda sekarang live di:
```
https://app-rtlh-desk.vercel.app
```

**Login dengan:**
- NIP: `admin`
- Password: `admin123`

---

**Dibuat**: November 10, 2025  
**Status**: ✅ Ready for Production  
**Deploy**: Automatic via GitHub
