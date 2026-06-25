from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.lead import Lead
from schemas.lead import LeadCreate, LeadUpdate
from typing import List


def create_lead(db: Session, lead_data: LeadCreate, owner_id: int) -> Lead:
    lead = Lead(**lead_data.model_dump(), owner_id=owner_id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def bulk_create_leads(db: Session, leads_data: List[dict], owner_id: int) -> int:
    """Fast bulk insert for large CSV files."""
    leads_to_insert = [Lead(**data, owner_id=owner_id) for data in leads_data]
    db.bulk_save_objects(leads_to_insert)
    db.commit()
    return len(leads_to_insert)


def get_leads(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[Lead]:
    return (
        db.query(Lead)
        .filter(Lead.owner_id == owner_id)
        .order_by(Lead.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_lead(db: Session, lead_id: int, owner_id: int) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == owner_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead


def update_lead(db: Session, lead_id: int, owner_id: int, lead_data: LeadUpdate) -> Lead:
    lead = get_lead(db, lead_id, owner_id)
    update_fields = lead_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, lead_id: int, owner_id: int) -> None:
    lead = get_lead(db, lead_id, owner_id)
    db.delete(lead)
    db.commit()
