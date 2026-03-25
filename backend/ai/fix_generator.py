import json
from ai.llm_client import call_llm_json


async def generate_fixes(findings: list, domain: str, hosting_provider: str) -> dict:
    actionable = [f for f in findings if f.get("status") in ("critical", "warning")]
    if not actionable:
        return {}

    system = """You are a security remediation expert. Generate detailed, step-by-step fix instructions 
for each vulnerability. Tailor to the hosting provider. Be specific with exact values and commands.
Respond ONLY with valid JSON."""

    vuln_list = [{"check": f["check"], "status": f["status"], "detail": f["detail"]} for f in actionable]

    user = f"""Domain: {domain}
Hosting Provider: {hosting_provider}
Issues to fix:
{json.dumps(vuln_list, indent=2)}

Generate a JSON object with fix instructions for each issue.
Key = check name exactly. Value = fix object:
{{
  "check_name_exactly": {{
    "fix_title": "Short action title",
    "time_estimate": "e.g. 15 minutes",
    "difficulty": "Easy|Medium|Hard",
    "exact_value": "The exact DNS record, command, or header value to copy-paste",
    "steps": [
      {{"step": 1, "instruction": "What to do", "where": "Where to do it"}}
    ],
    "verification": "How to verify it worked",
    "warning": "Any important warning or null"
  }}
}}

Be specific. Include exact DNS record values for SPF/DMARC/DKIM.
Include exact nginx/apache config for headers."""

    result = await call_llm_json(system, user)

    if not isinstance(result, dict):
        # Fallback basic fixes
        result = {}
        for f in actionable:
            result[f["check"]] = {
                "fix_title": f"Fix: {f['check']}",
                "time_estimate": "30 minutes",
                "difficulty": "Medium",
                "exact_value": "Contact your hosting provider or web developer",
                "steps": [{"step": 1, "instruction": f["detail"], "where": "Hosting control panel"}],
                "verification": "Re-scan with SecureIQ after applying fix",
                "warning": None,
            }

    return result
