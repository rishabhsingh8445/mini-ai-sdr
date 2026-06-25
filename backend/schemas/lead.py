from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from datetime import datetime
from typing import Optional


class LeadBase(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "new"

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin_url(cls, v: Optional[str]) -> Optional[str]:
        if v and str(v).strip() != "":
            val = str(v).strip()
            if not val.startswith("https://linkedin.com/") and not val.startswith("https://www.linkedin.com/"):
                raise ValueError("Must be a valid LinkedIn URL")
            return val
        return v


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin_url(cls, v: Optional[str]) -> Optional[str]:
        if v and str(v).strip() != "":
            val = str(v).strip()
            if not val.startswith("https://linkedin.com/") and not val.startswith("https://www.linkedin.com/"):
                raise ValueError("Must be a valid LinkedIn URL")
            return val
        return v


class LeadResponse(LeadBase):
    id: int
    owner_id: int
    qualification_score: Optional[float] = None
    qualification_reason: Optional[str] = None
    qualification_recommendation: Optional[str] = None
    qualification_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadQualificationResponse(BaseModel):
    lead_id: int
    score: float
    reason: str
    recommendation: str
