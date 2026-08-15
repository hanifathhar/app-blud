#!/bin/bash

# Quick Setup Script for Vercel Deployment
# This script helps you prepare environment variables for Vercel

echo "🚀 RTLH App - Vercel Deployment Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Read environment variables
source .env

echo "📋 Environment Variables to Add in Vercel:"
echo "=========================================="
echo ""

echo "1. DATABASE_URL"
echo "   Value: $DATABASE_URL"
echo "   Environments: Production, Preview, Development"
echo ""

echo "2. JWT_SECRET"
echo "   Value: $JWT_SECRET"
echo "   Environments: Production, Preview, Development"
echo ""

echo "3. PRISMA_CLI_QUERY_ENGINE_TYPE"
echo "   Value: binary"
echo "   Environments: Production, Preview, Development"
echo ""

echo "4. PRISMA_GENERATE_SKIP_AUTOINSTALL"
echo "   Value: false"
echo "   Environments: Production, Preview, Development"
echo ""

echo "🔗 Next Steps:"
echo "=============="
echo ""
echo "1. Go to: https://vercel.com/sendy05s-projects/app-rtlh-desk/settings/environment-variables"
echo "2. Click 'Add New' for each variable above"
echo "3. Copy the values shown above"
echo "4. Select all environments (Production, Preview, Development)"
echo "5. Click 'Save'"
echo ""
echo "6. Commit and push your code:"
echo "   git add ."
echo "   git commit -m 'Add Vercel configuration'"
echo "   git push origin main"
echo ""
echo "7. Vercel will automatically deploy your app!"
echo ""

# Generate secure JWT secret suggestion
echo "💡 Security Tip:"
echo "==============="
echo ""
echo "For production, use a more secure JWT_SECRET:"
echo ""
node -e "console.log('   JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
echo ""
echo "Copy this value to use in Vercel instead of the current one."
echo ""

echo "✨ Setup complete! Follow the next steps above."
