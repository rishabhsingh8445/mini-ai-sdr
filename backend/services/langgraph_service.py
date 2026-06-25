"""
LangGraph-powered SDR Agent Flow
Graph: qualify_lead → finalize
"""

import json
import logging
from typing import TypedDict, Optional, List
from datetime import datetime

from langgraph.graph import StateGraph, END
import groq
import google.generativeai as genai
import openai

from config.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


# ─── Agent State ──────────────────────────────────────────────────────────────

class SDRAgentState(TypedDict):
    # Lead inputs
    lead_id: int
    lead_name: str
    lead_email: str
    lead_company: Optional[str]
    lead_job_title: Optional[str]
    lead_industry: Optional[str]
    lead_linkedin_url: Optional[str]
    lead_notes: Optional[str]

    # Qualification outputs
    qualification_score: Optional[float]
    qualification_reason: Optional[str]
    qualification_recommendation: Optional[str]

    # Execution tracking
    logs: List[str]
    error: Optional[str]
    completed_at: Optional[str]


# --- Helper Functions ---
# We have a custom JSON parser because LLMs often wrap responses in markdown code blocks
# even when we explicitly ask them not to. This prevents random parsing crashes.
def _parse_json(content: str) -> dict:
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].strip()
    return json.loads(content)


def _ts() -> str:
    return datetime.utcnow().isoformat()


# ─── Node 1: qualify_lead ─────────────────────────────────────────────────────

def qualify_lead_node(state: SDRAgentState) -> dict:
    logs = list(state.get("logs", []))
    logs.append(f"[{_ts()}] Node qualify_lead: starting")

    prompt = f"""You are a Sales Development Representative (SDR) AI assistant. Analyze the following lead and provide a qualification score.

Lead Information:
- Name: {state['lead_name']}
- Email: {state['lead_email']}
- Company: {state.get('lead_company') or 'Unknown'}
- Job Title: {state.get('lead_job_title') or 'Unknown'}
- Industry: {state.get('lead_industry') or 'Unknown'}
- LinkedIn URL: {state.get('lead_linkedin_url') or 'Not provided'}
- Notes: {state.get('lead_notes') or 'None'}

Respond ONLY with valid JSON with these exact fields:
{{
  "score": <integer 0-100>,
  "reason": "<detailed reason for the score in 2-3 sentences>",
  "recommendation": "<specific action recommendation for the SDR in 1-2 sentences>"
}}

Consider factors like:
- Seniority of job title (C-level, VP, Director = higher score)
- Industry fit for B2B SaaS sales
- Completeness of lead information
- Company size signals from company name
- Engagement potential based on notes"""

    score, reason, recommendation = 0.0, "", ""
    use_fallback = False

    if settings.openai_api_key:
        try:
            client = openai.OpenAI(api_key=settings.openai_api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert SDR qualification assistant. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )
            data = _parse_json(response.choices[0].message.content.strip())
            score = float(data["score"])
            reason = str(data["reason"])
            recommendation = str(data["recommendation"])
            logs.append(f"[{_ts()}] Node qualify_lead: OpenAI returned score={score}")
        except Exception as e:
            # Often happens if the API key is expired or the model is overloaded.
            # We gracefully fall back to Groq rather than crashing the agent pipeline.
            logger.warning(f"OpenAI failed in LangGraph agent: {e}. Trying Groq fallback.")
            use_fallback = True
    else:
        use_fallback = True

    if use_fallback:
        if not settings.groq_api_key:
            logs.append(f"[{_ts()}] Node qualify_lead: ERROR — no API key configured")
            return {
                "logs": logs,
                "error": "No OpenAI or Groq API key configured.",
                "qualification_score": None,
                "qualification_reason": None,
                "qualification_recommendation": None,
            }
        try:
            client = groq.Groq(api_key=settings.groq_api_key)
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert SDR qualification assistant. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )
            data = _parse_json(response.choices[0].message.content.strip())
            score = float(data["score"])
            reason = str(data["reason"])
            recommendation = str(data["recommendation"])
            logs.append(f"[{_ts()}] Node qualify_lead: Groq (fallback) returned score={score}")
        except Exception as e:
            logs.append(f"[{_ts()}] Node qualify_lead: ERROR — {str(e)}")
            return {
                "logs": logs,
                "error": f"Qualification error: {str(e)}",
                "qualification_score": None,
                "qualification_reason": None,
                "qualification_recommendation": None,
            }

    logs.append(f"[{_ts()}] Node qualify_lead: completed. Final score={score}/100")
    return {
        "logs": logs,
        "qualification_score": score,
        "qualification_reason": reason,
        "qualification_recommendation": recommendation,
        "error": None,
    }


# ─── Node 2: finalize ─────────────────────────────────────────────────────────

def finalize_node(state: SDRAgentState) -> dict:
    logs = list(state.get("logs", []))
    completed_at = _ts()
    logs.append(f"[{completed_at}] Node finalize: agent pipeline complete.")
    return {"logs": logs, "completed_at": completed_at}


# ─── Build Graph ──────────────────────────────────────────────────────────────

def _build_agent() -> StateGraph:
    graph = StateGraph(SDRAgentState)

    graph.add_node("qualify_lead", qualify_lead_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("qualify_lead")

    graph.add_edge("qualify_lead", "finalize")
    graph.add_edge("finalize", END)

    return graph.compile()


# Compile once at import
sdr_agent = _build_agent()


# ─── Public entry point ───────────────────────────────────────────────────────

def run_sdr_agent(
    lead_id: int,
    lead_name: str,
    lead_email: str,
    lead_company: Optional[str] = None,
    lead_job_title: Optional[str] = None,
    lead_industry: Optional[str] = None,
    lead_linkedin_url: Optional[str] = None,
    lead_notes: Optional[str] = None,
) -> dict:
    """Invoke the full SDR LangGraph agent and return final state dict."""
    initial: SDRAgentState = {
        "lead_id": lead_id,
        "lead_name": lead_name,
        "lead_email": lead_email,
        "lead_company": lead_company,
        "lead_job_title": lead_job_title,
        "lead_industry": lead_industry,
        "lead_linkedin_url": lead_linkedin_url,
        "lead_notes": lead_notes,
        "qualification_score": None,
        "qualification_reason": None,
        "qualification_recommendation": None,
        "logs": [f"[{_ts()}] Agent started for lead_id={lead_id}"],
        "error": None,
        "completed_at": None,
    }
    return sdr_agent.invoke(initial)
