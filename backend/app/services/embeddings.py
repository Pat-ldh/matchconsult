import json
import logging
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.services.cv_parser import SUPPORTED_EXTENSIONS, extract_text, name_from_filename

logger = logging.getLogger(__name__)

_META_FILE = Path(settings.cv_directory).parent / "consultants_meta.json"
_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
_MAX_CHARS = 6000


class EmbeddingService:
    def __init__(self):
        self.model: SentenceTransformer | None = None
        self.cv_store: dict[str, dict] = {}

    def _ensure_model(self):
        if self.model is None:
            logger.info("Loading sentence-transformer model…")
            self.model = SentenceTransformer(_MODEL_NAME)
            logger.info("Model ready.")

    def _load_meta(self) -> dict:
        if _META_FILE.exists():
            with open(_META_FILE, encoding="utf-8") as f:
                return json.load(f)
        return {}

    async def load_cvs(self):
        if settings.demo_mode:
            logger.info("Demo mode — skipping CV/model loading.")
            return
        cv_dir = Path(settings.cv_directory)
        if not cv_dir.exists():
            logger.warning("CV directory not found: %s", cv_dir)
            return
        self._ensure_model()

        meta = self._load_meta()
        loaded = 0

        for cv_path in cv_dir.iterdir():
            if cv_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue
            cv_id = cv_path.stem
            try:
                text = extract_text(str(cv_path))
                if not text.strip():
                    continue
                assert self.model is not None
                embedding = self.model.encode(text[:_MAX_CHARS])
                cv_meta = meta.get(cv_id, {})
                self.cv_store[cv_id] = {
                    "name": cv_meta.get("name", name_from_filename(cv_path.name)),
                    "title": cv_meta.get("title", ""),
                    "available": cv_meta.get("available", True),
                    "text": text,
                    "embedding": embedding,
                    "filename": cv_path.name,
                }
                loaded += 1
            except Exception as e:
                logger.error("Failed to process %s: %s", cv_path.name, e)

        logger.info("Loaded %d CVs.", loaded)

    def rank_by_similarity(self, query_text: str) -> list[dict]:
        if not self.cv_store or self.model is None:
            return []

        query_emb = self.model.encode(query_text[:_MAX_CHARS])
        query_norm = np.linalg.norm(query_emb)

        results = []
        for cv_id, cv in self.cv_store.items():
            cv_emb = cv["embedding"]
            score = float(
                np.dot(query_emb, cv_emb) / (query_norm * np.linalg.norm(cv_emb) + 1e-9)
            )
            results.append({**cv, "cv_id": cv_id, "score": score})

        return sorted(results, key=lambda x: x["score"], reverse=True)

    @property
    def cv_count(self) -> int:
        return len(self.cv_store)

    @property
    def is_ready(self) -> bool:
        return self.model is not None


embedding_service = EmbeddingService()
