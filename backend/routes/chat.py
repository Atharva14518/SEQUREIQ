import json
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ai.llm_client import call_llm_with_meta
from analytics.posthog import capture_event

router = APIRouter(tags=["chat"])

SYSTEM_PROMPT = (
    "You are SecureIQ AI assistant for Indian small businesses. "
    "Answer questions about the security scan in plain English. "
    "Be helpful, specific, and concise. Max 100 words."
)


class ChatRequest(BaseModel):
    message: str
    scan_context: dict = {}
    clerk_user_id: str = "anonymous"


@router.post("/chat")
async def chat(req: ChatRequest, x_posthog_distinct_id: str | None = Header(default=None)):
    user_content = (
        f"Scan: {json.dumps(req.scan_context, default=str)} "
        f"Question: {req.message}"
    )
    distinct_id = x_posthog_distinct_id or req.clerk_user_id or "anonymous"
    await capture_event(
        distinct_id,
        "llm_request",
        {
            "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            "input_length": len(user_content),
            "flow": "chat",
        },
    )
    text, meta = await call_llm_with_meta(SYSTEM_PROMPT, user_content)
    await capture_event(
        distinct_id,
        "llm_response",
        {
            "model": meta.get("model") or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            "input_length": meta.get("input_length", len(user_content)),
            "output_length": meta.get("output_length", len(text or "")),
            "flow": "chat",
        },
    )
    ts = datetime.now(timezone.utc).isoformat()
    return JSONResponse(
        content={
            "response": text,
            "timestamp": ts,
        }
    )
