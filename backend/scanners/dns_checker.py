from utils.dns_resolver import resolve_a, resolve_ns


async def check_dns_health(domain: str) -> dict:
    ns_records = await resolve_ns(domain)
    a_records = await resolve_a(domain)

    issues = []
    if not ns_records:
        issues.append("no NS records")
    if not a_records:
        issues.append("no A records")

    if issues:
        return {
            "check": "DNS Health",
            "category": "exposure",
            "status": "info",
            "detail": f"DNS looks incomplete ({', '.join(issues)}). If this is unexpected, your site may be hard to reach for some users.",
            "score_impact": 0,
            "raw_data": {"ns_records": ns_records, "a_records": a_records, "issues": issues},
        }

    return {
        "check": "DNS Health",
        "category": "exposure",
        "status": "pass",
        "detail": "DNS records look healthy.",
        "score_impact": 1,
        "raw_data": {"ns_records": ns_records, "a_records": a_records},
    }

