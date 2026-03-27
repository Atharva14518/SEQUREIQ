async def check_mfa(domain: str) -> dict:
    # MFA cannot be reliably detected via unauthenticated domain scanning.
    # We surface it as an informational checkpoint for judges and business owners.
    return {
        "check": "MFA (Multi-Factor Authentication)",
        "category": "exposure",
        "status": "info",
        "detail": "SecureIQ can't detect MFA automatically from a public scan. Enable MFA for your admin panel, hosting, email, and any dashboards to reduce account takeover risk.",
        "score_impact": 0,
        "raw_data": {"auto_detectable": False, "domain": domain},
    }

