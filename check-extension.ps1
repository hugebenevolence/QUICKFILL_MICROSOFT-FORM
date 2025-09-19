# Test Extension Loading
# Kiểm tra xem extension có load đúng không

Write-Host "🔍 Testing QuickFill Extension Loading..." -ForegroundColor Cyan

# Check if all required files exist
$requiredFiles = @(
    "manifest.json",
    "popup.html", 
    "popup.js",
    "content.js",
    "background.js",
    "icons/icon16.png",
    "icons/icon32.png", 
    "icons/icon48.png",
    "icons/icon128.png"
)

Write-Host "`n📁 Checking required files:" -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - MISSING!" -ForegroundColor Red
    }
}

# Check manifest version
Write-Host "`n📋 Checking manifest.json:" -ForegroundColor Yellow
try {
    $manifest = Get-Content "manifest.json" | ConvertFrom-Json
    Write-Host "  ✅ Name: $($manifest.name)" -ForegroundColor Green
    Write-Host "  ✅ Version: $($manifest.version)" -ForegroundColor Green
    Write-Host "  ✅ Manifest Version: $($manifest.manifest_version)" -ForegroundColor Green
    
    if ($manifest.permissions -contains "scripting") {
        Write-Host "  ✅ Scripting permission: Available" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Scripting permission: MISSING!" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error reading manifest.json: $($_.Exception.Message)" -ForegroundColor Red
}

# Check content script syntax
Write-Host "`n🔧 Checking content.js syntax:" -ForegroundColor Yellow
try {
    $contentJs = Get-Content "content.js" -Raw
    if ($contentJs -match "class QuickFillFormsV2") {
        Write-Host "  ✅ QuickFillFormsV2 class found" -ForegroundColor Green
    }
    if ($contentJs -match "window\.quickFillFormsV2Instance") {
        Write-Host "  ✅ Multiple injection prevention found" -ForegroundColor Green
    }
    if ($contentJs -match "case 'ping'") {
        Write-Host "  ✅ Ping handler found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Error reading content.js: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🚀 Instructions:" -ForegroundColor Cyan
Write-Host "1. Open Chrome and go to chrome://extensions/" -ForegroundColor White
Write-Host "2. Enable 'Developer mode' (top right)" -ForegroundColor White  
Write-Host "3. Click 'Load unpacked' and select this folder" -ForegroundColor White
Write-Host "4. If extension is already loaded, click 'Reload' button" -ForegroundColor White
Write-Host "5. Go to any Microsoft Forms page and test" -ForegroundColor White

Write-Host "`n✨ Extension ready for testing!" -ForegroundColor Green