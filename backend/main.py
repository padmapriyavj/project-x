import os
import sys
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from postgrest.exceptions import APIError
from supabase import Client, create_client
from app_platform.auth.router import router as auth_router
from app_platform.courses.router import router as courses_router
from app_platform.dashboard.router import router as dashboard_router
from app_platform.shop.router import router as shop_router
from intelligence.betcha.router import router as betcha_router
from intelligence.concepts.router import router as concepts_router
from intelligence.ingestion.router import router as ingestion_router
from intelligence.quiz.router import router as quiz_router
from app_platform.lessons.router import router as lessons_router
from app_platform.materials.router import router as materials_router
from engagement.router import router as engagement_router

load_dotenv()

app = FastAPI(title="Project X API")


_repo_root = Path(__file__).resolve().parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

_backend_dir = Path(__file__).resolve().parent
if (_backend_dir / "platform").is_dir():
    raise RuntimeError(
        "Remove or rename backend/platform/: that folder name shadows Python's standard "
        "library module 'platform' and breaks httpx, SQLAlchemy, and other packages. "
        "Auth code lives under backend/app_platform/auth/."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(dashboard_router)
app.include_router(shop_router)
app.include_router(betcha_router)
app.include_router(concepts_router)
app.include_router(ingestion_router)
app.include_router(quiz_router)
app.include_router(lessons_router)
app.include_router(materials_router)
app.include_router(engagement_router)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/items")
def read_items():
    if supabase is None:
        return {"error": "Supabase is not configured"}
    try:
        response = supabase.table("shop_items").select("*", count="exact").execute()
        print(response.count)
        print("response", response)
        return response.data
    except APIError as e:
        return {"error": e.message, "details": e.details}
    except Exception as e:
        return {"error": "An unexpected error occurred", "details": str(e)}