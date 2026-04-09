# Turku Analiz Platformu - Baslat
# Sunucuyu baslatir ve ngrok ile dis erisim saglar

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Turku Analiz Platformu Baslatiliyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# .env kontrolu
if (-not (Test-Path ".env")) {
    Write-Host "[!] .env dosyasi bulunamadi, olusturuluyor..." -ForegroundColor Yellow
    @"
JWT_SECRET=turku-analiz-platformu-gizli-anahtar-2026
PORT=3005
"@ | Set-Content -Path ".env" -Encoding UTF8
    Write-Host "[OK] .env olusturuldu." -ForegroundColor Green
}

# node_modules kontrolu
if (-not (Test-Path "node_modules")) {
    Write-Host "[!] Sunucu bagimliliklari kuruluyor..." -ForegroundColor Yellow
    npm install
}
if (-not (Test-Path "client\node_modules")) {
    Write-Host "[!] Istemci bagimliliklari kuruluyor..." -ForegroundColor Yellow
    Push-Location client
    npm install
    Pop-Location
}

# Client build kontrolu
if (-not (Test-Path "client\dist")) {
    Write-Host "[*] Istemci derleniyor..." -ForegroundColor Yellow
    Push-Location client
    npm run build
    Pop-Location
}

# Sunucuyu arka planda baslat
Write-Host "[*] Sunucu baslatiliyor (port 3005)..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server/index.js
}
Start-Sleep -Seconds 2

# Saglik kontrolu
try {
    $health = Invoke-RestMethod http://localhost:3005/api/health -TimeoutSec 5
    Write-Host "[OK] Sunucu calisiyor: http://localhost:3005" -ForegroundColor Green
} catch {
    Write-Host "[HATA] Sunucu baslatilamadi!" -ForegroundColor Red
    Receive-Job $serverJob
    exit 1
}

# ngrok kontrolu
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrokPath) {
    Write-Host ""
    Write-Host "[*] ngrok baslatiliyor..." -ForegroundColor Cyan
    Write-Host "    Ctrl+C ile durdurun." -ForegroundColor Gray
    Write-Host ""
    ngrok http 3005
} else {
    Write-Host ""
    Write-Host "[!] ngrok bulunamadi!" -ForegroundColor Yellow
    Write-Host "    Dis erisim icin ngrok kurun: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "    Kurulum sonrasi: ngrok config add-authtoken TOKENINIZ" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Simdilik yerel erisim: http://localhost:3005" -ForegroundColor Green
    Write-Host "    Durdurmak icin Ctrl+C" -ForegroundColor Gray
    Wait-Job $serverJob
}

# Temizlik
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
