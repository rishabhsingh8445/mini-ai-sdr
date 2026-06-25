from pydantic import BaseModel
from datetime import datetime


class GeneratedEmailResponse(BaseModel):
    id: int
    lead_id: int
    subject: str
    body: str
    call_script: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmailGenerationResponse(BaseModel):
    email: GeneratedEmailResponse
    message: str = "Email generated successfully"
