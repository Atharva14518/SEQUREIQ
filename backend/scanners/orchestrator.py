import asyncio
import time

from scanners.ssl_checker import check_ssl
from scanners.email_security import check_email_security
from scanners.port_scanner import check_ports
from scanners.headers_checker import check_headers
from scanners.subdomain_finder import check_subdomains
from scanners.darkweb_checker import check_darkweb
from scanners.mfa_checker import check_mfa
from scanners.dns_checker import check_dns_health
from scanners.cve_checker import check_cve_exposure
from utils.dns_resolver import resolve_ns


def _detect_hosting(ns_records: list) -> str:
    ns_str = " ".join(ns_records).lower()
    if "cloudflare" in ns_str:
        return "Cloudflare"
    elif "awsdns" in ns_str:
        return "Amazon AWS"
    elif "google" in ns_str:
        return "Google Cloud"
    elif "azure" in ns_str or "microsoft" in ns_str:
        return "Microsoft Azure"
    elif "godaddy" in ns_str:
        return "GoDaddy"
    elif "hostgator" in ns_str:
        return "HostGator"
    elif "bluehost" in ns_str:
        return "Bluehost"
    elif "digitalocean" in ns_str:
        return "DigitalOcean"
    elif "linode" in ns_str or "akamai" in ns_str:
        return "Linode/Akamai"
    elif "vercel" in ns_str:
        return "Vercel"
    elif "netlify" in ns_str:
        return "Netlify"
    elif "shopify" in ns_str:
        return "Shopify"
    elif "wordpress" in ns_str:
        return "WordPress.com"
    elif "siteground" in ns_str:
        return "SiteGround"
    elif "bigrock" in ns_str:
        return "BigRock"
    elif "hostindia" in ns_str or "znetlive" in ns_str:
        return "Indian Hosting Provider"
    return "Unknown Hosting"


def _calculate_score(findings: list) -> dict:
    categories = {
        "email": {"max": 30, "earned": 0},
        "ssl": {"max": 25, "earned": 0},
        "headers": {"max": 20, "earned": 0},
        "network": {"max": 15, "earned": 0},
        "exposure": {"max": 10, "earned": 0},
    }

    for f in findings:
        cat = f.get("category", "")
        impact = f.get("score_impact", 0)
        if cat in categories:
            categories[cat]["earned"] = min(
                categories[cat]["earned"] + impact,
                categories[cat]["max"]
            )

    total = sum(v["earned"] for v in categories.values())
    max_total = sum(v["max"] for v in categories.values())

    return {
        "total": int(total),
        "max": max_total,
        "categories": {k: {"earned": v["earned"], "max": v["max"]} for k, v in categories.items()},
    }


async def run_full_scan(domain: str, clerk_user_id: str = None) -> dict:
    start_time = time.time()

    # Detect hosting provider
    ns_records = await resolve_ns(domain)
    hosting_provider = _detect_hosting(ns_records)

    # Run all scanners concurrently
    ssl_task = check_ssl(domain)
    email_task = check_email_security(domain)
    ports_task = check_ports(domain)
    headers_task = check_headers(domain)
    subdomains_task = check_subdomains(domain)
    darkweb_task = check_darkweb(domain)
    mfa_task = check_mfa(domain)
    dns_task = check_dns_health(domain)
    cve_task = check_cve_exposure(domain)

    results = await asyncio.gather(
        ssl_task,
        email_task,
        ports_task,
        headers_task,
        subdomains_task,
        darkweb_task,
        mfa_task,
        dns_task,
        cve_task,
        return_exceptions=True
    )

    # Flatten all findings
    findings = []
    for r in results:
        if isinstance(r, Exception):
            continue
        if isinstance(r, list):
            findings.extend(r)
        elif isinstance(r, dict):
            findings.append(r)

    # Score calculation
    score_data = _calculate_score(findings)
    total_score = score_data["total"]

    # Counts
    critical_count = sum(1 for f in findings if f.get("status") == "critical")
    warning_count = sum(1 for f in findings if f.get("status") == "warning")
    pass_count = sum(1 for f in findings if f.get("status") == "pass")

    duration = round(time.time() - start_time, 2)

    return {
        "domain": domain,
        "score": total_score,
        "score_breakdown": score_data["categories"],
        "findings": findings,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "pass_count": pass_count,
        "hosting_provider": hosting_provider,
        "ns_records": ns_records,
        "scan_duration": duration,
        "clerk_user_id": clerk_user_id,
    }
