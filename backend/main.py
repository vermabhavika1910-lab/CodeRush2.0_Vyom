import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router

app = FastAPI(
    title="Multi-Agent LLM Workflow Backend API",
    description="High-performance backend for executing visual multi-agent DAG workflows with live LLM inference",
    version="2.0.0"
)

# Enable CORS for Vite local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Multi-Agent Workflow Engine API v2.0",
        "providers": ["groq", "openrouter", "google", "github"],
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "providers_configured": {
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
            "google": bool(os.getenv("GOOGLE_AI_KEY")),
            "github": bool(os.getenv("GITHUB_MODELS_KEY")),
        }
    }
