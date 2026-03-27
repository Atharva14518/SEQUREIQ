import json
from ai.llm_client import call_llm_json, call_llm


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


async def generate_plain_summary(findings: list, domain: str, score: int) -> str:
    """Generate a 3-4 sentence plain-English summary for non-technical business owners."""
    critical = [f for f in findings if f.get("status") == "critical"]
    warnings = [f for f in findings if f.get("status") == "warning"]
    passed = [f for f in findings if f.get("status") == "pass"]

    findings_brief = []
    for f in findings[:10]:  # limit tokens
        findings_brief.append({
            "check": f.get("check"),
            "status": f.get("status"),
            "detail": f.get("detail", ""),
        })

    system = """You are a friendly security advisor helping Indian small business owners understand 
their website security. Write in plain, simple English — no technical jargon. 
Imagine you are talking to a shop owner who is not a tech person. Be warm, honest, and helpful."""

    user = f"""Domain: {domain}
Overall security score: {score}/100
Critical issues found: {len(critical)}
Warnings found: {len(warnings)}
Checks passed: {len(passed)}
Key findings: {json.dumps(findings_brief, indent=2)}

Write a 3-4 sentence plain English summary of this website's security health.
- Start with a simple verdict like "Your website is in good shape" or "Your website has some serious issues that need attention"
- Mention the 1-2 most important problems in plain words (e.g. "anyone can send fake emails pretending to be you")
- End with one encouraging line about what fixing these issues will do for their business
- Do NOT use technical terms like SPF, DMARC, HSTS, TLS — use plain words instead
- Write as if talking to a friend who owns a local business, NOT a developer
- Keep it under 100 words total"""

    try:
        summary = await call_llm(system, user)
        return summary.strip() if summary else _fallback_summary(score, len(critical), len(warnings))
    except Exception:
        return _fallback_summary(score, len(critical), len(warnings))


def _fallback_summary(score: int, critical_count: int, warning_count: int) -> str:
    if score >= 80:
        return f"Your website is in great shape with a score of {score}/100! You have strong security protections in place. Keep monitoring regularly to stay ahead of threats."
    elif score >= 50:
        return f"Your website scored {score}/100 — it has some protections but {warning_count} area(s) need attention. Fixing these will better protect your customers and business data."
    else:
        return f"Your website scored {score}/100 and has {critical_count} serious issue(s) that need immediate attention. These vulnerabilities could put your customers and business at risk. We recommend fixing the critical issues as soon as possible."
