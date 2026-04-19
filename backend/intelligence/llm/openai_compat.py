"""Shared OpenAI SDK client: cloud OpenAI by default, Ollama or any compatible local server as override."""

from __future__ import annotations

import os

from openai import OpenAI

_OLLAMA_DEFAULT = "http://127.0.0.1:11434/v1"


def get_openai_client() -> OpenAI:
    """
    Priority order:
      1. Cloud OpenAI (default) — set OPENAI_API_KEY
      2. Local server (Ollama)  — set OPENAI_BASE_URL to local endpoint
    """
    key  = (os.environ.get("OPENAI_API_KEY") or "").strip()
    base = (os.environ.get("OPENAI_BASE_URL") or "").strip().rstrip("/")

    # Explicit local base URL (Ollama, LM Studio, vLLM, etc.)
    if base:
        return OpenAI(
            base_url=base,
            api_key=key or "ollama",
        )

    # Cloud OpenAI
    if key:
        return OpenAI(api_key=key)

    raise RuntimeError(
        "No LLM configured. Set OPENAI_API_KEY for cloud OpenAI, "
        "or OPENAI_BASE_URL for a local server (Ollama, etc.)."
    )


def default_llm_model(fallback: str = "gpt-4o-mini") -> str:
    """
    Prefer LLM_MODEL env var, then fallback.
    Default is gpt-4o-mini — fast, cheap, great JSON output.
    """
    m = (os.environ.get("LLM_MODEL") or "").strip()
    return m or fallback


def use_openai_json_schema_mode() -> bool:
    """
    Cloud OpenAI supports json_schema structured outputs.
    Ollama / local servers use json_object only.
    Override with LLM_JSON_SCHEMA=1/0.
    """
    force = (os.environ.get("LLM_JSON_SCHEMA") or "").strip().lower()
    if force in ("1", "true", "yes", "on"):
        return True
    if force in ("0", "false", "no", "off"):
        return False

    # Local base URL → json_object only
    base = (os.environ.get("OPENAI_BASE_URL") or "").strip().lower()
    if base and any(h in base for h in ("localhost", "127.0.0.1", "0.0.0.0")):
        return False

    # Cloud OpenAI → json_schema supported
    key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    if key:
        return True

    return False