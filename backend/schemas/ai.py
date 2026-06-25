from pydantic import BaseModel
from datetime import datetime

class EmailGenerateRequest(BaseModel):
    mode: str = "First Contact"

class CallScriptGenerateRequest(BaseModel):
    mode: str = "Direct Pitch"

class CallScriptResponse(BaseModel):
    id: int
    lead_id: int
    mode: str
    script_body: str
    created_at: datetime

    class Config:
        from_attributes = True

class CallScriptGenerationResponse(BaseModel):
    script: CallScriptResponse
    message: str = "Call Script generated successfully"
