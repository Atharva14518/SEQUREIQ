import os
import httpx


HIBP_API_KEY = os.getenv("HIBP_API_KEY", "")


async def check_darkweb(domain: str) -> dict:
    if not HIBP_API_KEY or HIBP_API_KEY in ("optional_haveibeenpwned_key", ""):
        return {
            "check": "Dark Web Breach Check",
            "category": "exposure",
            "status": "pass",
            "detail": "Dark web check skipped — add HIBP_API_KEY to .env to enable breach monitoring",
            "score_impact": 5,
            "raw_data": {"skipped": True, "reason": "no_api_key"},
        }

    url = f"https://haveibeenpwned.com/api/v3/breacheddomain/{domain}"
    headers = {
        "hibp-api-key": HIBP_API_KEY,
        "User-Agent": "SecureIQ-Scanner/1.0",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=headers)

        if resp.status_code == 200:
            breaches = resp.json()
            names = list(breaches.keys()) if isinstance(breaches, dict) else []
            count = len(names)
            return {
                "check": "Dark Web Breach Check",
                "category": "exposure",
                "status": "critical" if count > 0 else "pass",
                "detail": f"{count} breach(es) found involving this domain's email accounts" if count > 0
                else "No known data breaches found for this domain",
                "score_impact": 0 if count > 0 else 5,
                "raw_data": {"breach_count": count, "breach_names": names[:5]},
            }
        elif resp.status_code == 404:
            return {
                "check": "Dark Web Breach Check",
                "category": "exposure",
                "status": "pass",
                "detail": "No known data breaches found for this domain",
                "score_impact": 5,
                "raw_data": {"breach_count": 0},
            }
        else:
            return {
                "check": "Dark Web Breach Check",
                "category": "exposure",
                "status": "pass",
                "detail": f"HIBP API returned {resp.status_code} — check skipped",
                "score_impact": 3,
                "raw_data": {"status_code": resp.status_code},
            }
    except Exception as e:
        return {
            "check": "Dark Web Breach Check",
            "category": "exposure",
            "status": "pass",
            "detail": f"Dark web check unavailable: {str(e)}",
            "score_impact": 3,
            "raw_data": {"error": str(e)},
        }
