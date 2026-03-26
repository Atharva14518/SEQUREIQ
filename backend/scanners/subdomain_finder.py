import asyncio

from utils.dns_resolver import resolve_a


SUBDOMAINS_TO_CHECK = [
    "mail", "webmail", "admin", "login", "ftp", "dev",
    "staging", "api", "portal", "vpn", "remote", "test",
    "old", "backup", "shop", "cpanel",
]


async def check_subdomains(domain: str) -> list:
    tasks = [_resolve_subdomain(f"{sub}.{domain}", sub) for sub in SUBDOMAINS_TO_CHECK]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    findings = []
    for res in results:
        if isinstance(res, dict) and res:
            findings.append(res)

    if not findings:
        return [{
            "check": "Subdomain Exposure",
            "category": "exposure",
            "status": "pass",
            "detail": "No sensitive subdomains publicly exposed",
            "score_impact": 5,
            "raw_data": {"checked": SUBDOMAINS_TO_CHECK},
        }]

    return findings


async def _resolve_subdomain(fqdn: str, label: str) -> dict | None:
    ips = await resolve_a(fqdn)
    if not ips:
        return None
    risk_labels = {"admin", "login", "vpn", "remote", "cpanel", "backup", "old", "dev", "staging"}
    status = "critical" if label in risk_labels else "warning"
    return {
        "check": f"Exposed Subdomain: {fqdn}",
        "category": "exposure",
        "status": status,
        "detail": f"{fqdn} is publicly accessible — {'high-risk admin/access panel' if label in risk_labels else 'potential attack surface'}",
        "score_impact": 0,
        "raw_data": {"subdomain": fqdn, "ips": ips, "label": label},
    }
