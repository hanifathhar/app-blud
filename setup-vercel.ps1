# Quick Setup Script for Vercel Deployment (PowerShell)
# This script helps you prepare environment variables for Vercel

Write-Host "🚀 RTLH App - Vercel Deployment Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Read environment variables
$envContent = Get-Content .env
$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim('"')
        $envVars[$key] = $value
    }
}

Write-Host "📋 Environment Variables to Add in Vercel:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. DATABASE_URL" -ForegroundColor White
Write-Host "   Value: $($envVars['DATABASE_URL'])" -ForegroundColor Gray
Write-Host "   Environments: Production, Preview, Development" -ForegroundColor Gray
Write-Host ""

Write-Host "2. JWT_SECRET" -ForegroundColor White
Write-Host "   Value: $($envVars['JWT_SECRET'])" -ForegroundColor Gray
Write-Host "   Environments: Production, Preview, Development" -ForegroundColor Gray
Write-Host ""

Write-Host "3. PRISMA_CLI_QUERY_ENGINE_TYPE" -ForegroundColor White
Write-Host "   Value: binary" -ForegroundColor Gray
Write-Host "   Environments: Production, Preview, Development" -ForegroundColor Gray
Write-Host ""

Write-Host "4. PRISMA_GENERATE_SKIP_AUTOINSTALL" -ForegroundColor White
Write-Host "   Value: false" -ForegroundColor Gray
Write-Host "   Environments: Production, Preview, Development" -ForegroundColor Gray
Write-Host ""

Write-Host "🔗 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://vercel.com/sendy05s-projects/app-rtlh-desk/settings/environment-variables" -ForegroundColor White
Write-Host "2. Click 'Add New' for each variable above" -ForegroundColor White
Write-Host "3. Copy the values shown above" -ForegroundColor White
Write-Host "4. Select all environments (Production, Preview, Development)" -ForegroundColor White
Write-Host "5. Click 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "6. Commit and push your code:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Add Vercel configuration'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Vercel will automatically deploy your app!" -ForegroundColor Green
Write-Host ""

# Generate secure JWT secret suggestion
Write-Host "💡 Security Tip:" -ForegroundColor Yellow
Write-Host "===============" -ForegroundColor Yellow
Write-Host ""
Write-Host "For production, use a more secure JWT_SECRET:" -ForegroundColor White
Write-Host ""

$secureSecret = -join ((48..57) + (97..122) + (65..90) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "   JWT_SECRET=$secureSecret" -ForegroundColor Green
Write-Host ""
Write-Host "Copy this value to use in Vercel instead of the current one." -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Setup complete! Follow the next steps above." -ForegroundColor Cyan
Write-Host ""

# Offer to open Vercel in browser
$openBrowser = Read-Host "Do you want to open Vercel dashboard now? (y/n)"
if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
    Start-Process "https://vercel.com/sendy05s-projects/app-rtlh-desk/settings/environment-variables"
}
