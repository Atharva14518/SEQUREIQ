import json
from ai.llm_client import call_llm_json


async def explain_findings(findings: list, domain: str, hosting_provider: str) -> list:
    if not findings:
        return findings

    system = """You are SecureIQ, a friendly security advisor for Indian small business owners.
Explain security findings in simple, conversational English. Mention real business impact 
using Indian context (customers, UPI payments, GST data, invoices, Aadhaar).
Be warm and helpful, not scary. Max 3 sentences per explanation.
Respond ONLY with a valid JSON array."""

    findings_summary = []
    for f in findings:
        findings_summary.append({
            "check": f.get("check"),
            "status": f.get("status"),
            "detail": f.get("detail"),
            "category": f.get("category"),
        })

    user = f"""Domain: {domain}
Hosting: {hosting_provider}
Findings to explain:
{json.dumps(findings_summary, indent=2)}

For each finding, add these fields:
- explanation: 2-3 sentence plain English explanation with Indian business impact
- fix_preview: one line describing what the fix involves (short, actionable)
- india_context: specific risk for Indian business (mention UPI/GST/customer data if relevant, else null)

Return the complete array with ALL original fields preserved plus these 3 new fields."""

    result = await call_llm_json(system, user)

    # Merge AI explanations back into original findings
    if isinstance(result, list) and len(result) == len(findings):
        for i, enriched in enumerate(result):
            if isinstance(enriched, dict):
                findings[i]["explanation"] = enriched.get("explanation", findings[i].get("detail", ""))
                findings[i]["fix_preview"] = enriched.get("fix_preview", "Consult your hosting provider")
                findings[i]["india_context"] = enriched.get("india_context")
    else:
        # Fallback: add basic explanations
        for f in findings:
            if "explanation" not in f:
                f["explanation"] = f.get("detail", "")
                f["fix_preview"] = "Contact your hosting provider or web developer"
                f["india_context"] = None

    return findings
