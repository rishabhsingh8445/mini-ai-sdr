import json
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import google.generativeai as genai
from models.lead import Lead
from models.generated_email import GeneratedEmail
from models.call_script import CallScript
from config.settings import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

def _parse_json_content(content: str) -> dict:
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].strip()
    return json.loads(content)


def generate_email_with_gemini(db: Session, lead_id: int, owner_id: int, mode: str = "First Contact") -> GeneratedEmail:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == owner_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if not settings.gemini_api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gemini API key is not configured")

    genai.configure(api_key=settings.gemini_api_key)
    # Using flash-lite because it's insanely fast and perfectly capable of analyzing structured lead data
    model = genai.GenerativeModel("gemini-flash-lite-latest")

    # Stage 1 — Deep lead analysis
    # Instead of just asking the LLM to write an email, we first force it to extract 
    # pain points and value hooks. This "Chain of Thought" style reasoning vastly 
    # improves the final email quality.
    analysis_prompt = f"""You are a world-class B2B sales strategist. Analyze this lead deeply.

Lead Profile:
- Name: {lead.name}
- Title: {lead.job_title or 'Unknown'}
- Company: {lead.company or 'Unknown'}
- Industry: {lead.industry or 'Unknown'}
- LinkedIn: {lead.linkedin_url or 'Not provided'}
- Notes: {lead.notes or 'None'}
- AI Score: {lead.qualification_score or 'Not scored'}/100
- AI Recommendation: {lead.qualification_recommendation or 'None'}

Return a JSON analysis:
{{
  "pain_points": "<2-3 likely pain points for someone in this role/industry>",
  "value_hook": "<the single most compelling value proposition for this specific person>",
  "tone": "<formal|conversational|warm>",
  "email_framework": "<AIDA|PAS|BAB|curiosity-hook>",
  "opening_insight": "<a specific, non-generic observation about their role, company or industry that shows you did your homework>"
}}"""

    try:
        analysis_resp = model.generate_content(
            analysis_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        analysis = _parse_json_content(analysis_resp.text.strip())
    except Exception as e:
        logger.warning(f"Email agent stage 1 failed: {e}, using defaults")
        analysis = {
            "pain_points": "scaling outreach, improving conversion rates",
            "value_hook": "automated lead qualification and personalized outreach",
            "tone": "conversational",
            "email_framework": "AIDA",
            "opening_insight": f"As {lead.job_title or 'a leader'} at {lead.company or 'your company'}, you likely deal with the challenge of identifying high-value prospects quickly."
        }

    # Stage 2 — Craft the optimized email using the analysis
    write_prompt = f"""You are an elite, modern B2B sales development representative. 
Using the analysis below, write a highly personalized cold email for a lead. 

Lead: {lead.name}, {lead.job_title or 'Executive'} at {lead.company or 'their company'} ({lead.industry or 'B2B'})
Email Mode/Intent: {mode}

Strategic Analysis:
- Pain Points: {analysis.get('pain_points', '')}
- Value Hook: {analysis.get('value_hook', '')}
- Opening Insight: {analysis.get('opening_insight', '')}

CRITICAL RULES FOR HIGH-CONVERTING, PROFESSIONAL B2B EMAILS:
1. COMPELLING & PERSUASIVE: The email must be extremely persuasive, deeply personalized, and professionally written. It should establish immediate credibility and authority.
2. TONE: Highly professional yet modern. Not overly stiff, but articulate, confident, and thought-provoking. Make the recipient feel like they are talking to an industry expert.
3. PERSONALIZATION: Weave their specific company name, role, and industry naturally into the problem statement. Show you truly understand their world.
4. STRUCTURE & IMPACT:
   - Paragraph 1 (The Hook): A sophisticated opening insight that immediately grabs attention by addressing a critical challenge in their industry.
   - Paragraph 2 (The Value): A clear, compelling value proposition showing exactly how we solve their pain points and drive massive ROI.
   - Paragraph 3 (The CTA): A highly persuasive Call to Action that makes it almost impossible for them to ignore.
5. CONTEXT: Apply the specific context of the '{mode}' mode flawlessly.

Return ONLY valid JSON:
{{
  "subject": "<punchy subject line under 40 chars, lowercase formatting is okay>",
  "body": "<complete email body>"
}}"""

    try:
        write_resp = model.generate_content(
            write_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        data = _parse_json_content(write_resp.text.strip())
        subject = str(data["subject"])
        body = str(data["body"])
        # We no longer generate call_script here
        call_script = ""
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse Gemini response: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {str(e)}",
        )

    email = GeneratedEmail(lead_id=lead_id, subject=subject, body=body, call_script=call_script)
    db.add(email)
    db.commit()
    db.refresh(email)
    return email



def get_lead_emails(db: Session, lead_id: int, owner_id: int) -> list[GeneratedEmail]:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == owner_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return (
        db.query(GeneratedEmail)
        .filter(GeneratedEmail.lead_id == lead_id)
        .order_by(GeneratedEmail.created_at.desc())
        .all()
    )


def delete_email(db: Session, email_id: int, owner_id: int) -> bool:
    email = db.query(GeneratedEmail).join(Lead).filter(
        GeneratedEmail.id == email_id,
        Lead.owner_id == owner_id
    ).first()
    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    
    db.delete(email)
    db.commit()
    return True


def generate_call_script_with_gemini(db: Session, lead_id: int, owner_id: int, mode: str = "Direct Pitch") -> CallScript:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == owner_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if not settings.gemini_api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gemini API key is not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-flash-lite-latest")

    script_prompt = f"""You are an elite SDR. Write a conversational cold call script for a lead.

Lead: {lead.name}, {lead.job_title or 'Executive'} at {lead.company or 'their company'} ({lead.industry or 'B2B'})
Call Script Mode: {mode}

CRITICAL RULES FOR HIGH-CONVERTING PROFESSIONAL CALL SCRIPTS:
1. COMPELLING & PERSUASIVE: The script must sound highly professional, authoritative, and incredibly persuasive. 
2. TONE: Confident, articulate, and respectful of their time. The caller must sound like a senior consultant or industry expert, commanding immediate respect.
3. STRUCTURE:
   - Open with a strong, confident introduction that establishes immediate credibility.
   - Deliver a highly compelling value proposition tailored to their specific role and industry.
   - End with a sharp, undeniable Call to Action that forces engagement or a follow-up meeting.
4. MODE SPECIFIC: Tailor the approach exactly to the '{mode}' mode (e.g. "Gatekeeper Bypass" must be authoritative enough to get patched through).

Return ONLY valid JSON:
{{
  "script_body": "<the exact text to read out loud>"
}}"""

    try:
        resp = model.generate_content(
            script_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        data = _parse_json_content(resp.text.strip())
        script_body = str(data["script_body"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error generating call script: {str(e)}",
        )

    call_script = CallScript(lead_id=lead_id, mode=mode, script_body=script_body)
    db.add(call_script)
    db.commit()
    db.refresh(call_script)
    return call_script


def get_lead_call_scripts(db: Session, lead_id: int, owner_id: int) -> list[CallScript]:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == owner_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return (
        db.query(CallScript)
        .filter(CallScript.lead_id == lead_id)
        .order_by(CallScript.created_at.desc())
        .all()
    )


def delete_call_script(db: Session, script_id: int, owner_id: int) -> bool:
    script = db.query(CallScript).join(Lead).filter(
        CallScript.id == script_id,
        Lead.owner_id == owner_id
    ).first()
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call Script not found")
    
    db.delete(script)
    db.commit()
    return True
