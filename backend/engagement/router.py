from fastapi import APIRouter

# Engagement subdomains (Tempo, duels, etc.) can mount additional routers here later.

router = APIRouter(prefix="/api/v1", tags=["Engagement"])
