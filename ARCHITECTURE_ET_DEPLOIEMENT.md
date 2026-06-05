# MatchConsult — Architecture technique & Guide de déploiement

---

## 1. Architecture technique complète

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Navigateur)                         │
│                         10 commerciaux ESN                          │
│                                                                     │
│   React 18 + TypeScript + Vite                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐    │
│   │  MissionInput│→ │AnalyzingScreen│→ │      ResultsPage      │    │
│   │  (saisie)    │  │ (spinner)    │  │ ConsultantCard × N    │    │
│   └──────────────┘  └──────────────┘  │ RewrittenOffer        │    │
│                                       └───────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP/JSON  POST /api/analyze
                            │           GET  /api/health
┌───────────────────────────▼─────────────────────────────────────────┐
│                     BACKEND  (Python 3.11+)                         │
│                                                                     │
│   FastAPI + Uvicorn (port 8000)                                     │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  routes/mission.py                                          │  │
│   │  POST /api/analyze  ──►  matcher.analyze_and_match()        │  │
│   │  GET  /api/health   ──►  embedding_service.is_ready         │  │
│   └──────────────────┬──────────────────────────────────────────┘  │
│                      │                                              │
│       ┌──────────────▼─────────────────────────────┐              │
│       │  services/matcher.py                        │              │
│       │  1. rewrite_offer()    → offre structurée   │              │
│       │  2. rank_by_similarity()→ top-N CVs         │              │
│       │  3. generate_explanations()→ phrases LLM    │              │
│       └──────┬────────────────────┬─────────────────┘              │
│              │                    │                                  │
│   ┌──────────▼──────┐   ┌─────────▼──────────────────────────┐    │
│   │ claude_service  │   │  services/embeddings.py             │    │
│   │ (LLM routing)   │   │  EmbeddingService                   │    │
│   │                 │   │  • load_cvs() au démarrage          │    │
│   │ ┌─────────────┐ │   │  • rank_by_similarity() cosine sim  │    │
│   │ │ Groq backend│ │   │  • modèle: paraphrase-multilingual- │    │
│   │ │ llama-3.1-  │ │   │    MiniLM-L12-v2 (sentence-transf.)│    │
│   │ │ 8b-instant  │ │   └─────────────┬───────────────────────┘    │
│   │ └─────────────┘ │                 │                             │
│   │ ┌─────────────┐ │   ┌─────────────▼───────────────────────┐    │
│   │ │Anthropic    │ │   │  services/cv_parser.py               │    │
│   │ │claude-sonnet│ │   │  • pdfplumber  → PDF                 │    │
│   │ │claude-haiku │ │   │  • python-docx → DOCX/DOC            │    │
│   │ └─────────────┘ │   └─────────────────────────────────────┘    │
│   │ ┌─────────────┐ │                                              │
│   │ │Demo mode    │ │   ┌────────────────────────────────────────┐  │
│   │ │(sans API)   │ │   │  data/cvs/        ← fichiers PDF/DOCX  │  │
│   │ └─────────────┘ │   │  data/consultants_meta.json            │  │
│   └─────────────────┘   └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │  APIs externes (cloud)     │
              │  • Groq API (inférence LLM)│
              │  • Anthropic API (optionnel)│
              └────────────────────────────┘
```

### Stack technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React + TypeScript | 18.3 / 5.6 |
| Build tool | Vite | 5.4 |
| Backend | FastAPI + Uvicorn | 0.115 / 0.30 |
| LLM (principal) | Groq SDK → **llama-3.1-8b-instant** | 0.11 |
| LLM (alternatif) | Anthropic SDK → Claude Sonnet 4.6 / Haiku 4.5 | 0.40 |
| Embeddings | sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2` | 3.3.1 |
| Calcul vectoriel | NumPy (similarité cosinus) | 1.26.4 |
| Parsing CV | pdfplumber + python-docx | 0.11.4 / 1.1.2 |
| Validation | Pydantic v2 + pydantic-settings | 2.9.2 |

### Sélection du backend LLM (logique de priorité)

```
DEMO_MODE=true    →  mode démo (aucun appel LLM)
GROQ_API_KEY      →  Groq  (llama-3.1-8b-instant)
ANTHROPIC_API_KEY →  Anthropic (Claude Sonnet pour rewrite, Haiku pour explications)
aucune clé        →  mode démo automatique
```

---

## 2. Choix du LLM — Analyse et justification

### Modèle retenu : `llama-3.1-8b-instant` via Groq

#### Pourquoi pas le 70B ?

Le projet ne sollicite le LLM que pour **deux tâches très contraintes** :

| Tâche | Tokens | Complexité réelle |
|-------|--------|-------------------|
| Rewrite JSON (schéma fixe à 6 champs) | ~1400 input / ~350 output | Extraction + structuration |
| Phrase d'explication (≤ 20 mots FR) | ~600 input / ~80 output | Génération courte |

Un modèle 70B est dimensionné pour : raisonnement multi-étapes, génération de code complexe, analyse ambiguë. **Aucun de ces besoins n'existe ici.** Le schéma JSON est fourni explicitement dans le prompt — le modèle n'a qu'à remplir les cases.

#### Pourquoi le 8B convient parfaitement

- **Llama 3.1 8B Instruct** a été spécifiquement fine-tuné pour le suivi d'instructions et la sortie JSON structurée
- **Français** : données multilingues dans l'entraînement, vocabulaire ESN/RH parfaitement couvert
- **Fiabilité JSON** : le prompt est explicite (`UNIQUEMENT ce JSON`), `_strip_markdown()` nettoie les artefacts, Pydantic valide en sortie — triple filet de sécurité
- **Vitesse sur LPU Groq** : ~2 000 tokens/sec pour 8B vs ~300 pour 70B — **7× plus rapide**
- **Concurrence 10 utilisateurs** : les 11 appels par analyse (1 rewrite + 10 explications parallèles) sont absorbés sans contention grâce à la vitesse du 8B

#### Comparatif pour ce cas d'usage précis

| Modèle | Input $/M | Output $/M | Vitesse (LPU) | JSON fiable | Verdict |
|--------|----------|------------|---------------|-------------|---------|
| `llama-3.3-70b-versatile` | $0.59 | $0.79 | ~300 tok/s | Oui | Surdimensionné ✗ |
| `llama-3.1-70b-versatile` | $0.59 | $0.79 | ~300 tok/s | Oui | Surdimensionné ✗ |
| **`llama-3.1-8b-instant`** | **$0.05** | **$0.08** | **~2000 tok/s** | **Oui** | **Optimal ✓** |
| `llama-3.2-3b-preview` | $0.06 | $0.06 | ~3000 tok/s | Fragile | Risqué ✗ |

---

## 3. Mode opératoire — Déploiement sur serveur externe

### Prérequis serveur

- Linux Ubuntu 22.04 LTS (ou Debian 12)
- Python 3.11+
- Node.js 20 LTS + npm
- Nginx
- **4 Go RAM minimum** (chargement du modèle sentence-transformers MiniLM ~1.5 Go)
- Clé API Groq (gratuite sur console.groq.com)

---

### Étapes d'installation

#### 1. Préparer le serveur

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.12 nodejs npm nginx git curl
# Installer uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 2. Cloner le projet

```bash
git clone <url-du-repo> /opt/matchconsult
cd /opt/matchconsult
```

#### 3. Backend Python

```bash
cd backend
uv sync
```

Créer le fichier `.env` :

```env
# backend/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant
CV_DIRECTORY=./data/cvs
CORS_ORIGINS=https://votre-domaine.com
DEMO_MODE=false
```

Déposer les CVs dans `backend/data/cvs/` (PDF ou DOCX).

Créer le service systemd :

```bash
sudo tee /etc/systemd/system/matchconsult-api.service > /dev/null <<EOF
[Unit]
Description=MatchConsult FastAPI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/matchconsult/backend
ExecStart=/root/.local/bin/uv run --project /opt/matchconsult/backend uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure
EnvironmentFile=/opt/matchconsult/backend/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable matchconsult-api
sudo systemctl start matchconsult-api
```

> `--workers 2` : 2 processus Uvicorn pour absorber les 10 commerciaux en simultané.

#### 4. Frontend React

```bash
cd /opt/matchconsult/frontend
npm install
npm run build
# Les fichiers statiques sont dans dist/
```

#### 5. Configurer Nginx (reverse proxy + static files)

```nginx
# /etc/nginx/sites-available/matchconsult
server {
    listen 80;
    server_name votre-domaine.com;

    root /opt/matchconsult/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/matchconsult /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. HTTPS avec Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

#### 7. Vérification

```bash
curl https://votre-domaine.com/api/health
# {"status":"ok","cvs_loaded":N,"model_ready":true}
```

---

## 4. Workflow de la solution (étapes clés)

```
┌─────────────────────────────────────────────────────────────┐
│  DÉMARRAGE DU SERVEUR  (une seule fois)                      │
│  1. FastAPI démarre (2 workers Uvicorn)                      │
│  2. Chargement du modèle sentence-transformers MiniLM        │
│  3. Lecture + vectorisation de tous les CVs (data/cvs/)      │
│  4. Store en mémoire : {cv_id → embedding + texte + méta}   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  REQUÊTE COMMERCIAL  (10 users simultanés possibles)         │
│  5. Saisie de la fiche de poste dans l'UI React             │
│  6. POST /api/analyze {mission_text, max_results, ...}       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  REFORMULATION LLM                                           │
│  7. Appel Groq llama-3.1-8b-instant : mission_text → JSON   │
│     { title, mission_type, duration,                        │
│       technical_skills[], soft_skills[], client_context }    │
│     Durée ~0.3 s  |  ~1400 tokens input / ~350 output       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  MATCHING VECTORIEL  (100% local, pas de LLM)                │
│  8. Concaténation titre + skills + contexte → query_text    │
│  9. Encodage query_text → vecteur (MiniLM, local)           │
│  10. Similarité cosinus query ↔ chaque CV (NumPy)           │
│  11. Tri décroissant → top-N consultants                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  ENRICHISSEMENT LLM  (parallèle)                             │
│  12. N appels Groq simultanés (asyncio.gather)               │
│      → 1 phrase d'explication par consultant (≤ 20 mots)    │
│      ~600 tokens input / ~80 output × N appels              │
│  13. Calcul matched_skills / missing_skills (recherche texte)│
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  RÉPONSE & AFFICHAGE                                         │
│  14. Retour JSON : {rewritten_offer, consultants[], total}   │
│  15. Affichage ResultsPage :                                 │
│      • Offre reformulée (RewrittenOffer)                     │
│      • Cards consultants triées par score (0–100)            │
│      • Skills matchés / manquants + explication IA           │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Dimensionnement pour 10 commerciaux simultanés

### Charge LLM par analyse

| Appel | Input tokens | Output tokens | Nb appels |
|-------|-------------|---------------|-----------|
| Rewrite JSON | ~1 400 | ~350 | 1 |
| Explication consultant | ~600 | ~80 | 10 (parallèle) |
| **Total / analyse** | **~7 400** | **~1 150** | **11** |

### Budget mensuel réel (50 analyses/jour, 10 commerciaux)

| Poste | Calcul | Coût/mois |
|-------|--------|-----------|
| VPS Hetzner CX22 (2 vCPU / 4 Go) | forfait | **€4.51** |
| Groq llama-3.1-8b-instant — 1 500 analyses | 11.1M input × $0.05 + 1.7M output × $0.08 | **~$0.70** |
| Domaine + SSL Let's Encrypt | forfait | **~€1** |
| **TOTAL** | | **< €7/mois** |

> Le tier gratuit Groq (14 400 req/jour) couvre les 10 commerciaux sans frais LLM jusqu'à ~130 analyses/jour.
