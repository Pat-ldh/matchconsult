from fastapi import APIRouter, HTTPException

from app.models import AnalyzeRequest, AnalyzeResponse, HealthResponse
from app.services.embeddings import embedding_service
from app.services.matcher import analyze_and_match

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        cvs_loaded=embedding_service.cv_count,
        model_ready=embedding_service.is_ready,
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    if embedding_service.cv_count == 0:
        raise HTTPException(
            status_code=503,
            detail="Aucun CV disponible. Vérifiez le répertoire CV_DIRECTORY.",
        )
    try:
        return await analyze_and_match(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
