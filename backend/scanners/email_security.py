from utils.dns_resolver import resolve_txt


async def check_email_security(domain: str) -> list:
    spf_records = await resolve_txt(domain)
    dmarc_records = await resolve_txt(f"_dmarc.{domain}")
    dkim_records = await resolve_txt(f"default._domainkey.{domain}")

    spf = next((txt for txt in spf_records if txt.startswith("v=spf1")), None)
    dmarc = next((txt for txt in dmarc_records if "v=DMARC1" in txt), None)
    dkim = next((txt for txt in dkim_records if txt), None)

    if spf:
        spf_result = {
            "check": "SPF Record",
            "category": "email",
            "status": "pass",
            "detail": "SPF record found — email spoofing protection active",
            "score_impact": 10,
            "raw_data": {"record": spf},
        }
    else:
        spf_result = {
            "check": "SPF Record",
            "category": "email",
            "status": "critical",
            "detail": "No SPF record found — attackers can send fake emails pretending to be you",
            "score_impact": 0,
            "raw_data": {"record": None},
        }

    if dmarc:
        policy = "none"
        for part in dmarc.split(";"):
            part = part.strip()
            if part.startswith("p="):
                policy = part[2:]
        if policy in ("quarantine", "reject"):
            dmarc_result = {
                "check": "DMARC Policy",
                "category": "email",
                "status": "pass",
                "detail": f"DMARC policy '{policy}' — strong protection against email fraud",
                "score_impact": 10,
                "raw_data": {"record": dmarc, "policy": policy},
            }
        else:
            dmarc_result = {
                "check": "DMARC Policy",
                "category": "email",
                "status": "warning",
                "detail": "DMARC policy is 'none' — monitoring only, not enforcing protection",
                "score_impact": 5,
                "raw_data": {"record": dmarc, "policy": policy},
            }
    else:
        dmarc_result = {
            "check": "DMARC Policy",
            "category": "email",
            "status": "critical",
            "detail": "No DMARC record — your domain can be used for phishing emails targeting your customers",
            "score_impact": 0,
            "raw_data": {"record": None},
        }

    if dkim:
        dkim_result = {
            "check": "DKIM Signing",
            "category": "email",
            "status": "pass",
            "detail": "DKIM key found — emails from this domain are cryptographically signed",
            "score_impact": 10,
            "raw_data": {"record": dkim[:100]},
        }
    else:
        dkim_result = {
            "check": "DKIM Signing",
            "category": "email",
            "status": "warning",
            "detail": "DKIM key not found at default selector — email signing may be missing or use a different selector",
            "score_impact": 3,
            "raw_data": {"record": None},
        }

    return [spf_result, dmarc_result, dkim_result]
