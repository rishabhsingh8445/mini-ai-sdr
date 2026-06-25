from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database.session import get_db
from schemas.email import GeneratedEmailResponse, EmailGenerationResponse
from schemas.ai import EmailGenerateRequest, CallScriptGenerateRequest, CallScriptResponse, CallScriptGenerationResponse
from services.ai_service import (
    generate_email_with_gemini, 
    get_lead_emails,
    generate_call_script_with_gemini,
    get_lead_call_scripts,
    delete_call_script
)
from dependencies.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/ai", tags=["ai"])



@router.post("/email/{lead_id}", response_model=EmailGenerationResponse)
def generate_email(
    lead_id: int,
    request: EmailGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Directly triggers the standalone 2-stage Gemini email agent without running 
    the entire qualification pipeline.
    """
    email = generate_email_with_gemini(db, lead_id, current_user.id, request.mode)
    return EmailGenerationResponse(email=email)


@router.get("/emails/{lead_id}", response_model=List[GeneratedEmailResponse])
def get_emails(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_lead_emails(db, lead_id, current_user.id)


@router.delete("/email/{email_id}")
def remove_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from services.ai_service import delete_email
    delete_email(db, email_id, current_user.id)
    return {"status": "success", "message": "Email deleted"}


@router.post("/email/{email_id}/send")
async def send_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dispatches the email either via real SMTP or simulated delay.
    Updates the lead's status to 'contacted'.
    """
    from services.email_service import dispatch_email
    await dispatch_email(db, email_id, current_user.id)
    return {"status": "success", "message": "Email dispatched successfully"}


@router.post("/call-script/{lead_id}", response_model=CallScriptGenerationResponse)
def generate_call_script(
    lead_id: int,
    request: CallScriptGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    script = generate_call_script_with_gemini(db, lead_id, current_user.id, request.mode)
    return CallScriptGenerationResponse(script=script)


@router.get("/call-scripts/{lead_id}", response_model=List[CallScriptResponse])
def get_call_scripts(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_lead_call_scripts(db, lead_id, current_user.id)


@router.delete("/call-script/{script_id}")
def remove_call_script(
    script_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_call_script(db, script_id, current_user.id)
    return {"status": "success", "message": "Call script deleted"}

