import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.generated_email import GeneratedEmail
from models.lead import Lead
from config.settings import get_settings

settings = get_settings()

async def dispatch_email(db: Session, email_id: int, owner_id: int) -> bool:
    """
    Sends an email using SMTP if credentials exist, otherwise simulates sending.
    """
    email = db.query(GeneratedEmail).filter(GeneratedEmail.id == email_id, GeneratedEmail.lead_id == Lead.id, Lead.owner_id == owner_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    lead = db.query(Lead).filter(Lead.id == email.lead_id, Lead.owner_id == owner_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # If SMTP is configured, send the real email
    if settings.smtp_server and settings.smtp_username and settings.smtp_password:
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.smtp_from_email or settings.smtp_username
            msg['To'] = lead.email
            msg['Subject'] = email.subject
            
            msg.attach(MIMEText(email.body, 'plain'))
            
            # Send using TLS
            server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send real email: {str(e)}")
    else:
        # Simulate realistic network delay for the demo
        await asyncio.sleep(1.5)
        
    # Mark the lead as contacted
    lead.status = "contacted"
    db.commit()
    
    return True
