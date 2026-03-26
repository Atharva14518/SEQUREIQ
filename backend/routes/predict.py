import asyncio
import json
import os

from fastapi import APIRouter
from groq import Groq


router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@router.post("/predict")
async def predict_threats(request: dict):
    domain = request.get("domain", "")
    business_type = request.get("business_type", "other")
    findings = request.get("findings", [])
    score = request.get("score", 50)

    critical = [f for f in findings if f.get("status") == "critical"]

    prompt = f"""
    Domain: {domain}
    Business: {business_type}
    Security Score: {score}/100
    Critical Issues: {json.dumps([f.get('check') for f in critical])}
    Location: India (Maharashtra likely)

    Predict threats for next 30 days:
    {{
      "threat_probability": integer 0-100,
      "primary_threat": "name",
      "threat_description": "2 sentences plain English",
      "active_campaigns": [
        {{
          "campaign_name": "name",
          "targets": "who",
          "method": "how",
          "businesses_hit": number,
          "relevance": "why this domain"
        }}
      ],
      "profile_match": "why targeted",
      "days_until_likely_attack": number,
      "protection_priority": ["fix1", "fix2", "fix3"]
    }}"""

    loop = asyncio.get_event_loop()

    def _call():
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {
                    "role": "system",
                    "content": "Threat intelligence analyst for Indian businesses. Respond ONLY with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=1024,
            temperature=0.3,
        )
        return response.choices[0].message.content

    result = await loop.run_in_executor(None, _call)
    try:
        return json.loads(result)
    except Exception:
        start = result.find("{")
        end = result.rfind("}")
        if start != -1 and end != -1:
            return json.loads(result[start : end + 1])
        return {
            "threat_probability": 60,
            "primary_threat": "Email Phishing",
            "threat_description": "Based on missing email security.",
            "active_campaigns": [],
            "protection_priority": ["Configure DMARC", "Add SPF record", "Enable DKIM"],
        }
