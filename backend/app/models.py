from typing import Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    mission_text: str = Field(..., min_length=20)
    required_availability: Optional[str] = None
    priority_skills: list[str] = []
    max_results: int = Field(default=10, ge=3, le=20)


class RewrittenOffer(BaseModel):
    title: str
    mission_type: str
    duration: str
    technical_skills: list[str]
    soft_skills: list[str]
    client_context: str


class ConsultantMatch(BaseModel):
    id: str
    name: str
    title: str
    score: int
    matched_skills: list[str]
    missing_skills: list[str]
    explanation: str
    available: bool
    cv_filename: str


class AnalyzeResponse(BaseModel):
    rewritten_offer: RewrittenOffer
    consultants: list[ConsultantMatch]
    total_cvs: int


class HealthResponse(BaseModel):
    status: str
    cvs_loaded: int
    model_ready: bool
