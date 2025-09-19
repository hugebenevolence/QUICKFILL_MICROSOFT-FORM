Write-Host "🚀 QuickFill Microsoft Forms v2.0 - Extension Verification" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Gray

# Test 1: Check essential files
Write-Host "
📁 Test 1: Essential Files Check" -ForegroundColor Yellow
$essentialFiles = @(
    'manifest.json',
    'popup.html', 
    'popup.js',
    'popup.css',
    'content.js',
    'background.js'
)

$allFilesExist = $true
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Test 2: Check icon files
Write-Host "
🎨 Test 2: Icon Files Check" -ForegroundColor Yellow
$iconSizes = @('16', '32', '48', '128')
$allIconsExist = $true
foreach ($size in $iconSizes) {
    $iconPath = "icons/icon$size.png"
    if (Test-Path $iconPath) {
        $fileInfo = Get-Item $iconPath
        Write-Host "✅ icon$size.png ($($fileInfo.Length) bytes)" -ForegroundColor Green
    } else {
        Write-Host "❌ icon$size.png" -ForegroundColor Red
        $allIconsExist = $false
    }
}

# Test 3: Check manifest.json structure
Write-Host "
📋 Test 3: Manifest Structure Check" -ForegroundColor Yellow
try {
    $manifest = Get-Content 'manifest.json' | ConvertFrom-Json
    Write-Host "✅ Valid JSON format" -ForegroundColor Green
    Write-Host "  📦 Name: $($manifest.name)" -ForegroundColor Cyan
    Write-Host "  🔢 Version: $($manifest.version)" -ForegroundColor Cyan
    Write-Host "  📄 Manifest Version: $($manifest.manifest_version)" -ForegroundColor Cyan
    Write-Host "  🎯 Popup: $($manifest.action.default_popup)" -ForegroundColor Cyan
    Write-Host "  📜 Content Scripts: $($manifest.content_scripts.Count) file(s)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Invalid manifest.json format" -ForegroundColor Red
    $allFilesExist = $false
}

# Test 4: Check file sizes
Write-Host "
📊 Test 4: File Sizes Check" -ForegroundColor Yellow
$codeFiles = @('popup.js', 'content.js', 'background.js', 'popup.html', 'popup.css')
foreach ($file in $codeFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        if ($size -gt 100) {
            Write-Host "✅ $file ($size bytes)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $file ($size bytes) - Seems too small" -ForegroundColor Yellow
        }
    }
}

# Final Result
Write-Host "
🏁 Final Result" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Gray
if ($allFilesExist -and $allIconsExist) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "✅ Extension is ready to install" -ForegroundColor Green
    Write-Host "
📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open Chrome -> Extensions (chrome://extensions/)" -ForegroundColor White
    Write-Host "2. Enable Developer mode" -ForegroundColor White
    Write-Host "3. Click 'Load unpacked'" -ForegroundColor White
    Write-Host "4. Select this folder: '$(Get-Location)'" -ForegroundColor White
    Write-Host "5. Test on Microsoft Forms!" -ForegroundColor White
} else {
    Write-Host "❌ SOME TESTS FAILED!" -ForegroundColor Red
    Write-Host "⚠️  Please fix the issues above before installing" -ForegroundColor Yellow
}

Write-Host "
📖 For detailed installation guide, see: INSTALL_GUIDE.md" -ForegroundColor Gray
