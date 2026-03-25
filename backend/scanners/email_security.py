import asyncio
import dns.resolver


async def check_email_security(domain: str) -> list:
    results = []
    loop = asyncio.get_event_loop()

    spf = await loop.run_in_executor(None, _check_spf, domain)
    dmarc = await loop.run_in_executor(None, _check_dmarc, domain)
    dkim = await loop.run_in_executor(None, _check_dkim, domain)

    results.extend([spf, dmarc, dkim])
    return results


def _check_spf(domain: str) -> dict:
    try:
        answers = dns.resolver.resolve(domain, "TXT")
        for rdata in answers:
            txt = rdata.to_text().strip('"')
            if txt.startswith("v=spf1"):
                return {
                    "check": "SPF Record",
                    "category": "email",
                    "status": "pass",
                    "detail": "SPF record found — email spoofing protection active",
                    "score_impact": 10,
                    "raw_data": {"record": txt},
                }
        return {
            "check": "SPF Record",
            "category": "email",
            "status": "critical",
            "detail": "No SPF record found — attackers can send fake emails pretending to be you",
            "score_impact": 0,
            "raw_data": {"record": None},
        }
    except Exception as e:
        return {
            "check": "SPF Record",
            "category": "email",
            "status": "critical",
            "detail": f"SPF lookup failed: {str(e)}",
            "score_impact": 0,
            "raw_data": {"error": str(e)},
        }


def _check_dmarc(domain: str) -> dict:
    try:
        answers = dns.resolver.resolve(f"_dmarc.{domain}", "TXT")
        for rdata in answers:
            txt = rdata.to_text().strip('"')
            if "v=DMARC1" in txt:
                policy = "none"
                for part in txt.split(";"):
                    part = part.strip()
                    if part.startswith("p="):
                        policy = part[2:]
                if policy in ("quarantine", "reject"):
                    status = "pass"
                    detail = f"DMARC policy '{policy}' — strong protection against email fraud"
                    score_impact = 10
                else:
                    status = "warning"
                    detail = "DMARC policy is 'none' — monitoring only, not enforcing protection"
                    score_impact = 5
                return {
                    "check": "DMARC Policy",
                    "category": "email",
                    "status": status,
                    "detail": detail,
                    "score_impact": score_impact,
                    "raw_data": {"record": txt, "policy": policy},
                }
        return {
            "check": "DMARC Policy",
            "category": "email",
            "status": "critical",
            "detail": "No DMARC record — your domain can be used for phishing emails targeting your customers",
            "score_impact": 0,
            "raw_data": {"record": None},
        }
    except Exception as e:
        return {
            "check": "DMARC Policy",
            "category": "email",
            "status": "critical",
            "detail": f"DMARC lookup failed: {str(e)}",
            "score_impact": 0,
            "raw_data": {"error": str(e)},
        }


def _check_dkim(domain: str) -> dict:
    try:
        answers = dns.resolver.resolve(f"default._domainkey.{domain}", "TXT")
        for rdata in answers:
            txt = rdata.to_text().strip('"')
            if txt:
                return {
                    "check": "DKIM Signing",
                    "category": "email",
                    "status": "pass",
                    "detail": "DKIM key found — emails from this domain are cryptographically signed",
                    "score_impact": 10,
                    "raw_data": {"record": txt[:100]},
                }
    except Exception:
        pass
    return {
        "check": "DKIM Signing",
        "category": "email",
        "status": "warning",
        "detail": "DKIM key not found at default selector — email signing may be missing or use a different selector",
        "score_impact": 3,
        "raw_data": {"record": None},
    }
