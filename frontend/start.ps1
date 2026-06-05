# Lance le frontend MatchConsult
# Usage : .\start.ps1

Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dépendances npm…" -ForegroundColor Cyan
    npm install
}

Write-Host "Démarrage du frontend sur http://localhost:5173" -ForegroundColor Green
npm run dev
