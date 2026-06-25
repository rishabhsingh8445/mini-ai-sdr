from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import codecs
from database.session import get_db
from schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from services.lead_service import create_lead, get_leads, get_lead, update_lead, delete_lead, bulk_create_leads
from dependencies.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.post("", response_model=LeadResponse, status_code=201)
def create(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_lead(db, lead_data, current_user.id)


@router.post("/upload")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parses a CSV file and efficiently bulk inserts leads.
    """
    csvReader = csv.DictReader(codecs.iterdecode(file.file, 'utf-8-sig'))
    leads_data = []
    for row in csvReader:
        # Keys might be case-sensitive depending on the CSV, let's normalize headers
        row_lower = {k.lower().strip() if k else '': v for k, v in row.items()}
        if "name" in row_lower and "email" in row_lower:
            leads_data.append({
                "name": row_lower.get("name", "").strip(),
                "email": row_lower.get("email", "").strip(),
                "company": row_lower.get("company", "").strip(),
                "job_title": row_lower.get("job_title", "").strip(),
                "industry": row_lower.get("industry", "").strip(),
                "linkedin_url": row_lower.get("linkedin_url", "").strip(),
                "notes": row_lower.get("notes", "").strip(),
                "status": "new"
            })
    
    count = bulk_create_leads(db, leads_data, current_user.id)
    return {"message": f"Successfully imported {count} leads"}


@router.get("", response_model=List[LeadResponse])
def list_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_leads(db, current_user.id, skip=skip, limit=limit)


@router.get("/{lead_id}", response_model=LeadResponse)
def get_single(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_lead(db, lead_id, current_user.id)


@router.put("/{lead_id}", response_model=LeadResponse)
def update(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_lead(db, lead_id, current_user.id, lead_data)


@router.delete("/{lead_id}", status_code=204)
def delete(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_lead(db, lead_id, current_user.id)
