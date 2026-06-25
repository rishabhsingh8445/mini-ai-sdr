from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from database.session import get_db
from dependencies.auth import get_current_user
from models.user import User
from models.lead import Lead
from services.langgraph_service import run_sdr_agent

router = APIRouter(prefix="/api/agent", tags=["agent"])


class AgentRunResponse(BaseModel):
    lead_id: int
    qualification_score: Optional[float]
    qualification_reason: Optional[str]
    qualification_recommendation: Optional[str]
    logs: list
    error: Optional[str]
    completed_at: Optional[str]


@router.post("/run/{lead_id}", response_model=AgentRunResponse)
def run_agent_pipeline(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kicks off the LangGraph pipeline for a specific lead.
    This handles qualification and optionally email generation in a single state machine.
    
    Nodes executed:
    1. qualify_lead   — Score the lead 0-100 using OpenAI/Groq
    2. finalize       — Compile results and timestamp completion
    """
    lead: Lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    result = run_sdr_agent(
        lead_id=lead.id,
        lead_name=lead.name,
        lead_email=lead.email,
        lead_company=lead.company,
        lead_job_title=lead.job_title,
        lead_industry=lead.industry,
        lead_linkedin_url=lead.linkedin_url,
        lead_notes=lead.notes,
    )

    # Persist qualification results to the lead record
    if result.get("qualification_score") is not None:
        lead.qualification_score = result["qualification_score"]
        lead.qualification_reason = result["qualification_reason"]
        lead.qualification_recommendation = result["qualification_recommendation"]
        lead.qualification_updated_at = datetime.utcnow()
        lead.status = "qualified" if result["qualification_score"] >= 50 else "disqualified"
        db.commit()
        db.refresh(lead)

    return AgentRunResponse(
        lead_id=lead_id,
        qualification_score=result.get("qualification_score"),
        qualification_reason=result.get("qualification_reason"),
        qualification_recommendation=result.get("qualification_recommendation"),
        logs=result.get("logs", []),
        error=result.get("error"),
        completed_at=result.get("completed_at"),
    )
