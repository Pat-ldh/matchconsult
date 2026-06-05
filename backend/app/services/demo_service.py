"""
Mode démo — retourne des données fictives sans aucun appel LLM.
Activé par DEMO_MODE=true dans .env (ou absence de toute clé API).
"""
import re

from app.models import RewrittenOffer


def _extract_keywords(text: str) -> list[str]:
    """Extrait grossièrement des mots-clés techniques du texte libre."""
    patterns = [
        r"\bJava\b", r"\bPython\b", r"\bSpring\b", r"\bDjango\b", r"\bFastAPI\b",
        r"\bReact\b", r"\bVue\b", r"\bAngular\b", r"\bTypeScript\b", r"\bJavaScript\b",
        r"\bKubernetes\b", r"\bDocker\b", r"\bAWS\b", r"\bAzure\b", r"\bGCP\b",
        r"\bPostgreSQL\b", r"\bMySQL\b", r"\bMongoDB\b", r"\bKafka\b", r"\bRabbitMQ\b",
        r"\bMicroservices?\b", r"\bREST\b", r"\bGraphQL\b", r"\bCI/CD\b",
        r"\bDevOps\b", r"\bAgile\b", r"\bScrum\b",
    ]
    found = []
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            found.append(re.search(p, text, re.IGNORECASE).group(0))
    return found[:6] if found else ["Développement logiciel", "Architecture", "API"]


def _guess_title(text: str) -> str:
    text_lower = text.lower()
    if "architecte" in text_lower:
        return "Architecte Logiciel / Cloud"
    if "chef de projet" in text_lower or "moa" in text_lower:
        return "Chef de Projet MOA"
    if "devops" in text_lower:
        return "Ingénieur DevOps"
    if "data" in text_lower and "scientist" in text_lower:
        return "Data Scientist"
    if "java" in text_lower or "spring" in text_lower:
        return "Lead Developer Java / Spring"
    if "python" in text_lower:
        return "Développeur Python Senior"
    if "react" in text_lower or "frontend" in text_lower:
        return "Développeur Frontend React"
    return "Consultant Technique Senior"


def _guess_type(text: str) -> str:
    text_lower = text.lower()
    if "forfait" in text_lower:
        return "Forfait"
    if "cdi" in text_lower:
        return "CDI"
    return "Régie — temps plein"


async def demo_rewrite_offer(mission_text: str) -> RewrittenOffer:
    keywords = _extract_keywords(mission_text)
    title = _guess_title(mission_text)
    mission_type = _guess_type(mission_text)
    return RewrittenOffer(
        title=title,
        mission_type=mission_type,
        duration="6 mois (renouvelable)",
        technical_skills=keywords,
        soft_skills=["Autonomie", "Communication", "Esprit d'équipe"],
        client_context=(
            "Mission dans un contexte client grand compte — environnement agile, "
            "équipe pluridisciplinaire, démarrage rapide souhaité."
        ),
    )


_DEMO_EXPLANATIONS = [
    "Profil senior très aligné avec la mission, disponible immédiatement.",
    "Solide expérience technique, contexte métier à confirmer en entretien.",
    "Bon généraliste avec les compétences clés ; montée en charge rapide.",
    "Profil orienté architecture, adéquation technique partielle.",
    "Polyvalent, expérience back-end confirmée sur des volumes similaires.",
]


async def demo_explanations(offer_summary: str, cv_texts: list[str]) -> list[str]:
    return [
        _DEMO_EXPLANATIONS[i % len(_DEMO_EXPLANATIONS)]
        for i in range(len(cv_texts))
    ]
