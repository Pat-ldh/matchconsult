import asyncio
import json
import logging

from anthropic.types import TextBlock

from app.config import settings
from app.models import RewrittenOffer
from app.services.demo_service import demo_explanations, demo_rewrite_offer

logger = logging.getLogger(__name__)

# ── Prompts (partagés par tous les backends LLM) ──────────────────────────────

_REWRITE_SYSTEM = (
    "Tu es un expert en recrutement dans une ESN française. "
    "Tu analyses des fiches de poste et les reformates de manière claire et structurée. "
    "Tu réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire."
)

_REWRITE_TEMPLATE = """\
Analyse cette fiche de poste et reformate-la en JSON structuré.

Fiche de poste :
{mission_text}

Retourne UNIQUEMENT ce JSON (aucun autre texte) :
{{
  "title": "intitulé exact du poste",
  "mission_type": "Régie | Forfait | CDI | CDD",
  "duration": "ex: 6 mois, 12 mois, CDI",
  "technical_skills": ["compétence1", "compétence2"],
  "soft_skills": ["softskill1", "softskill2"],
  "client_context": "contexte client en 1-2 phrases"
}}"""

_EXPLAIN_TEMPLATE = """\
Mission : {offer_summary}

CV (extrait) :
{cv_excerpt}

En une seule phrase française concise (max 20 mots), explique pourquoi ce consultant correspond à cette mission."""


def _strip_markdown(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines)
    return text.strip()


# ── Anthropic backend ─────────────────────────────────────────────────────────

def _anthropic_client():
    import anthropic
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def _anthropic_rewrite(mission_text: str) -> RewrittenOffer:
    client = _anthropic_client()
    msg = await client.messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        system=_REWRITE_SYSTEM,
        messages=[{"role": "user", "content": _REWRITE_TEMPLATE.format(mission_text=mission_text[:4000])}],
    )
    block = msg.content[0]
    raw = _strip_markdown(block.text if isinstance(block, TextBlock) else "")
    return RewrittenOffer(**json.loads(raw))


async def _anthropic_explain_one(offer_summary: str, cv_text: str) -> str:
    try:
        client = _anthropic_client()
        msg = await client.messages.create(
            model=settings.haiku_model,
            max_tokens=80,
            messages=[{"role": "user", "content": _EXPLAIN_TEMPLATE.format(
                offer_summary=offer_summary, cv_excerpt=cv_text[:2000]
            )}],
        )
        block = msg.content[0]
        return (block.text if isinstance(block, TextBlock) else "").strip()
    except Exception as e:
        logger.error("Anthropic explanation failed: %s", e)
        return "Profil correspondant aux exigences de la mission."


# ── Groq backend ──────────────────────────────────────────────────────────────

def _groq_client():
    from groq import AsyncGroq
    return AsyncGroq(api_key=settings.groq_api_key)


async def _groq_rewrite(mission_text: str) -> RewrittenOffer:
    client = _groq_client()
    resp = await client.chat.completions.create(
        model=settings.groq_model,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": _REWRITE_SYSTEM},
            {"role": "user", "content": _REWRITE_TEMPLATE.format(mission_text=mission_text[:4000])},
        ],
    )
    raw = _strip_markdown(resp.choices[0].message.content or "")
    return RewrittenOffer(**json.loads(raw))


async def _groq_explain_one(offer_summary: str, cv_text: str) -> str:
    try:
        client = _groq_client()
        resp = await client.chat.completions.create(
            model=settings.groq_model,
            max_tokens=80,
            messages=[{"role": "user", "content": _EXPLAIN_TEMPLATE.format(
                offer_summary=offer_summary, cv_excerpt=cv_text[:2000]
            )}],
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception as e:
        logger.error("Groq explanation failed: %s", e)
        return "Profil correspondant aux exigences de la mission."


# ── Public API ────────────────────────────────────────────────────────────────

async def rewrite_offer(mission_text: str) -> RewrittenOffer:
    backend = settings.llm_backend
    logger.info("LLM backend: %s", backend)
    if backend == "groq":
        return await _groq_rewrite(mission_text)
    if backend == "anthropic":
        return await _anthropic_rewrite(mission_text)
    return await demo_rewrite_offer(mission_text)


async def generate_explanations(offer_summary: str, cv_texts: list[str]) -> list[str]:
    backend = settings.llm_backend
    if backend == "groq":
        tasks = [_groq_explain_one(offer_summary, t) for t in cv_texts]
        return await asyncio.gather(*tasks)
    if backend == "anthropic":
        tasks = [_anthropic_explain_one(offer_summary, t) for t in cv_texts]
        return await asyncio.gather(*tasks)
    return await demo_explanations(offer_summary, cv_texts)
