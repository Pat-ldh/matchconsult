# MatchConsult

Outil de matching automatisé pour équipes commerciales ESN.  
Collez une fiche de poste → l'IA reformule l'offre et classe vos consultants disponibles par pertinence.

## Fonctionnalités

- **Reformulation LLM** : extraction structurée du titre, type de mission, compétences et contexte client
- **Matching vectoriel** : similarité cosinus entre la mission et chaque CV (100% local, sentence-transformers)
- **Explications par IA** : une phrase de synthèse par consultant, générée en parallèle
- **Mode démo** : zéro clé API requise — données fictives pour tester l'interface immédiatement
- **Multi-backend LLM** : Groq (gratuit, recommandé) ou Anthropic Claude

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Uvicorn (Python 3.12) |
| Embeddings | sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2` |
| LLM principal | Groq → `llama-3.1-8b-instant` |
| LLM alternatif | Anthropic → Claude Sonnet 4.6 / Haiku 4.5 |
| Gestion dépendances | [uv](https://docs.astral.sh/uv/) |

## Démarrage rapide

### Prérequis

- Python 3.12+ et [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 20+ et npm

### 1. Cloner le projet

```bash
git clone https://github.com/<votre-user>/matchconsult
cd matchconsult
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # DEMO_MODE=true par défaut, aucune clé requise
uv sync
uv run python main.py
```

Le backend démarre sur <http://localhost:8000>.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'interface est disponible sur <http://localhost:5173>.

### Windows (PowerShell)

Des scripts `start.ps1` sont disponibles dans chaque répertoire :

```powershell
cd backend  ; .\start.ps1
cd frontend ; .\start.ps1
```

## Ajouter des CVs

1. Déposez vos fichiers **PDF** ou **DOCX** dans `backend/data/cvs/`
2. Optionnel — enrichissez `backend/data/consultants_meta.json` :

```json
{
  "nom_fichier_sans_extension": {
    "name": "Prénom Nom",
    "title": "Architecte Cloud Senior",
    "available": true
  }
}
```

3. Redémarrez le backend (`uv run python main.py`) — les CVs sont vectorisés au démarrage.

> Le dossier `data/cvs/` est dans `.gitignore` pour ne pas committer de données personnelles.

## Configuration LLM

Éditez `backend/.env` :

| Mode | Configuration | Coût |
|------|---------------|------|
| Démo | `DEMO_MODE=true` | Gratuit |
| Groq | `GROQ_API_KEY=gsk_...` + `DEMO_MODE=false` | Tier gratuit suffisant |
| Anthropic | `ANTHROPIC_API_KEY=sk-ant-...` + `DEMO_MODE=false` | Payant |

Priorité de sélection : `DEMO_MODE=true` → `GROQ_API_KEY` → `ANTHROPIC_API_KEY` → démo automatique.

## Architecture & Déploiement serveur

Voir [`ARCHITECTURE_ET_DEPLOIEMENT.md`](./ARCHITECTURE_ET_DEPLOIEMENT.md) pour le guide complet :
guide Nginx + systemd + HTTPS + dimensionnement pour 10 utilisateurs simultanés.

Budget estimé : **< €7/mois** (VPS Hetzner CX22 + Groq tier gratuit).
