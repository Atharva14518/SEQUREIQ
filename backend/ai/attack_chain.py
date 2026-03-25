import json
from ai.llm_client import call_llm_json


async def generate_attack_chain(findings: list, domain: str) -> dict:
    vulnerabilities = [f for f in findings if f.get("status") in ("critical", "warning")]

    if len(vulnerabilities) < 2:
        return {"has_chain": False}

    system = """You are a cybersecurity attack chain analyst. Generate a realistic multi-step 
attack chain showing how a hacker would exploit multiple vulnerabilities together.
Use Indian business context. Make it educational and specific.
Respond ONLY with valid JSON."""

    vuln_summary = [{"check": v["check"], "status": v["status"], "detail": v["detail"]} for v in vulnerabilities]

    user = f"""Domain: {domain}
Vulnerabilities found:
{json.dumps(vuln_summary, indent=2)}

Generate a realistic attack chain JSON:
{{
  "has_chain": true,
  "chain_severity": "CRITICAL|HIGH|MEDIUM",
  "time_to_compromise": "e.g. 2-4 hours",
  "chain_title": "Short dramatic title for this attack chain",
  "steps": [
    {{
      "step_number": 1,
      "action": "What the hacker does in plain English",
      "vulnerability_used": "Which finding they exploit",
      "business_impact": "What this means for the business",
      "hacker_tool": "Real tool name (nmap, sqlmap, etc.)"
    }}
  ],
  "chain_summary": "2 sentence summary of the full attack",
  "weakest_link": "The single most critical vulnerability",
  "priority_fix": "The one fix that breaks this entire chain"
}}

Make 4-6 steps. Be specific and realistic."""

    result = await call_llm_json(system, user)

    if not result or not isinstance(result, dict):
        return {
            "has_chain": True,
            "chain_severity": "HIGH",
            "time_to_compromise": "Unknown",
            "chain_title": "Multi-Vector Attack Possible",
            "steps": [],
            "chain_summary": "Multiple vulnerabilities could be chained together.",
            "weakest_link": vulnerabilities[0]["check"] if vulnerabilities else "Unknown",
            "priority_fix": "Fix critical findings first",
        }

    result["has_chain"] = True
    return result
