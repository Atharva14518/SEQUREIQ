from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from ai.llm_client import call_llm

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    scan_context: dict = {}
    clerk_user_id: str = "anonymous"


@router.post("/chat")
async def chat(req: ChatRequest):
    ctx = req.scan_context
    domain = ctx.get("domain", "your website")
    score = ctx.get("score", "N/A")
    critical = ctx.get("critical_count", 0)
    warning = ctx.get("warning_count", 0)

    system = (
        f"You are SecureIQ AI, a friendly cybersecurity assistant. "
        f"The user's website is {domain} with a security score of {score}/100. "
        f"There are {critical} critical issues and {warning} warnings. "
        f"Answer their security question in simple, plain English. "
        f"Max 120 words. Be specific to their scan results. "
        f"Use Indian context (UPI, GST, customers) when relevant."
    )

    response = await call_llm(system, req.message)

    return {
        "response": response,
        "timestamp": datetime.utcnow().isoformat(),
    }
