from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.session import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    industry = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="new", nullable=False)

    qualification_score = Column(Float, nullable=True)
    qualification_reason = Column(Text, nullable=True)
    qualification_recommendation = Column(Text, nullable=True)
    qualification_updated_at = Column(DateTime(timezone=True), nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="leads")
    generated_emails = relationship("GeneratedEmail", back_populates="lead", cascade="all, delete-orphan")
    call_scripts = relationship("CallScript", back_populates="lead", cascade="all, delete-orphan")
