from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.session import Base, engine
from routers import auth, leads, ai, agent
import models.user
import models.lead
import models.generated_email
import models.call_script

# Initialize DB tables (in a real prod app, we'd use Alembic migrations instead)
# But for this mini-SDR, creating them on the fly is totally fine.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mini AI SDR API",
    description="AI-powered Sales Development Representative backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes Registration ---
# Grouped by domain for easier navigation
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(ai.router)
app.include_router(agent.router)


@app.get("/api/health", tags=["utility"])
def health_check():
    """Simple health check for Docker/Kubernetes probes."""
    return {"status": "healthy", "service": "Mini AI SDR API"}
