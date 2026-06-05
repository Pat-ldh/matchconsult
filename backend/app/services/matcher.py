from app.models import AnalyzeRequest, AnalyzeResponse, ConsultantMatch
from app.services.claude_service import generate_explanations, rewrite_offer
from app.services.embeddings import embedding_service


def _skill_match(offer_skills: list[str], cv_text: str) -> tuple[list[str], list[str]]:
    cv_lower = cv_text.lower()
    matched = [s for s in offer_skills if s.lower() in cv_lower]
    missing = [s for s in offer_skills if s.lower() not in cv_lower]
    return matched[:8], missing[:4]


def _infer_title(cv_meta_title: str, cv_text: str) -> str:
    if cv_meta_title:
        return cv_meta_title
    lines = [l.strip() for l in cv_text.split("\n") if l.strip()]
    return lines[1][:60] if len(lines) > 1 else (lines[0][:60] if lines else "Consultant")


async def analyze_and_match(request: AnalyzeRequest) -> AnalyzeResponse:
    offer = await rewrite_offer(request.mission_text)

    all_skills = offer.technical_skills + offer.soft_skills
    if request.priority_skills:
        all_skills = request.priority_skills + [s for s in all_skills if s not in request.priority_skills]

    query_text = (
        f"{offer.title} "
        + " ".join(offer.technical_skills)
        + " "
        + " ".join(offer.soft_skills)
        + " "
        + offer.client_context
    )

    ranked = embedding_service.rank_by_similarity(query_text)
    top = ranked[: request.max_results]

    offer_summary = f"Poste: {offer.title}. Compétences: {', '.join(offer.technical_skills[:6])}."
    explanations = await generate_explanations(offer_summary, [r["text"] for r in top])

    consultants = [
        ConsultantMatch(
            id=r["cv_id"],
            name=r["name"],
            title=_infer_title(r.get("title", ""), r["text"]),
            score=max(0, min(100, round(r["score"] * 100))),
            matched_skills=_skill_match(all_skills, r["text"])[0],
            missing_skills=_skill_match(all_skills, r["text"])[1],
            explanation=explanations[i],
            available=r.get("available", True),
            cv_filename=r["filename"],
        )
        for i, r in enumerate(top)
    ]

    return AnalyzeResponse(
        rewritten_offer=offer,
        consultants=consultants,
        total_cvs=embedding_service.cv_count,
    )
