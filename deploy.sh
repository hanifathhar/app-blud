#!/bin/bash

echo "========================================="
echo "🚀 Deploy SMART POS"
echo "========================================="

# Masuk ke folder project
cd /home/hnf/smart-pos || exit 1

echo "📥 Update project..."
git pull origin main

echo "📦 Install dependency..."
npm install

echo "🗄️ Generate Prisma Client..."
npx prisma generate

# Jika menggunakan migration
# npx prisma migrate deploy

echo "🔨 Build Next.js..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build gagal!"
    exit 1
fi

echo "🔄 Restart PM2..."

if pm2 describe smart-pos > /dev/null 2>&1; then
    pm2 restart smart-pos
else
    pm2 start npm --name smart-pos -- start
fi

pm2 save

echo ""
echo "========================================="
echo "✅ Deploy SMART POS selesai"
echo "========================================="