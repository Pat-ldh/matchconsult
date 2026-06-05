# Lance le backend MatchConsult
# Prérequis : uv installé — https://docs.astral.sh/uv/getting-started/installation/

Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "Fichier .env créé depuis .env.example." -ForegroundColor Green
    Write-Host "Par défaut : DEMO_MODE=true (aucune clé requise)." -ForegroundColor Green
    Write-Host "Pour Groq (gratuit) : éditez .env, ajoutez GROQ_API_KEY et mettez DEMO_MODE=false." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Synchronisation des dépendances…" -ForegroundColor Cyan
uv sync

Write-Host "Démarrage du backend sur http://localhost:8000" -ForegroundColor Green
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
