# Debug Connection Test Script
# Kiểm tra kết nối extension với Microsoft Forms

Write-Host "🔧 Testing Extension Connection..." -ForegroundColor Cyan

# Check if Chrome is running
$chromeProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
if ($chromeProcesses) {
    Write-Host "✅ Chrome is running" -ForegroundColor Green
} else {
    Write-Host "❌ Chrome is not running" -ForegroundColor Red
}

# Check manifest permissions
Write-Host "`n📋 Checking manifest permissions:" -ForegroundColor Yellow
try {
    $manifest = Get-Content "manifest.json" | ConvertFrom-Json
    Write-Host "  Extension Name: $($manifest.name)" -ForegroundColor White
    Write-Host "  Version: $($manifest.version)" -ForegroundColor White
    
    Write-Host "  Permissions:" -ForegroundColor Cyan
    foreach ($perm in $manifest.permissions) {
        Write-Host "    - $perm" -ForegroundColor Green
    }
    
    Write-Host "  Host Permissions:" -ForegroundColor Cyan
    foreach ($host in $manifest.host_permissions) {
        Write-Host "    - $host" -ForegroundColor Green
    }
    
    Write-Host "  Content Script Matches:" -ForegroundColor Cyan
    foreach ($match in $manifest.content_scripts[0].matches) {
        Write-Host "    - $match" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Error reading manifest: $($_.Exception.Message)" -ForegroundColor Red
}

# Check file sizes
Write-Host "`n📁 Checking file sizes:" -ForegroundColor Yellow
$files = @("content.js", "popup.js", "background.js")
foreach ($file in $files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $sizeKB = [math]::Round($size / 1024, 2)
        Write-Host "  ✅ $file : $sizeKB KB" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file : Missing!" -ForegroundColor Red
    }
}

Write-Host "`n🔧 Debug Instructions:" -ForegroundColor Cyan
Write-Host "1. Load/Reload extension in Chrome" -ForegroundColor White
Write-Host "2. Open Microsoft Forms in a new tab" -ForegroundColor White
Write-Host "3. Open extension popup" -ForegroundColor White
Write-Host "4. Click 'Debug Connection' button" -ForegroundColor White
Write-Host "5. Check Console (F12) for detailed logs" -ForegroundColor White

Write-Host "`n🎯 Microsoft Forms URLs to test:" -ForegroundColor Yellow
Write-Host "- https://forms.office.com" -ForegroundColor Green
Write-Host "- https://forms.microsoft.com" -ForegroundColor Green
Write-Host "- https://forms.office365.com" -ForegroundColor Green

Write-Host "`n✨ Ready for debugging!" -ForegroundColor Green