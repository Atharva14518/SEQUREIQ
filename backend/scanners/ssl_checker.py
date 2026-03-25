import ssl
import socket
import asyncio
from datetime import datetime, timezone


async def check_ssl(domain: str) -> dict:
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, _check_ssl_sync, domain)
        return result
    except Exception as e:
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "critical",
            "detail": f"Could not connect to {domain}:443 — {str(e)}",
            "score_impact": 0,
            "raw_data": {"error": str(e)},
        }


def _check_ssl_sync(domain: str) -> dict:
    ctx = ssl.create_default_context()
    try:
        conn = ctx.wrap_socket(socket.socket(socket.AF_INET), server_hostname=domain)
        conn.settimeout(10)
        conn.connect((domain, 443))
        cert = conn.getpeercert()
        conn.close()

        expire_str = cert.get("notAfter", "")
        if expire_str:
            exp_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            days_left = (exp_dt - datetime.now(timezone.utc)).days
        else:
            days_left = -1

        issuer = dict(x[0] for x in cert.get("issuer", []))
        subject = dict(x[0] for x in cert.get("subject", []))

        if days_left > 30:
            status = "pass"
            detail = f"SSL certificate valid for {days_left} more days"
            score_impact = 25
        elif 7 <= days_left <= 30:
            status = "warning"
            detail = f"SSL certificate expires in {days_left} days — renew soon!"
            score_impact = 12
        else:
            status = "critical"
            detail = f"SSL certificate expires in {days_left} days — URGENT renewal required"
            score_impact = 0

        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": status,
            "detail": detail,
            "score_impact": score_impact,
            "raw_data": {
                "days_left": days_left,
                "cert_issuer": issuer.get("organizationName", str(issuer)),
                "cert_subject": subject.get("commonName", str(subject)),
                "expiry": expire_str,
            },
        }
    except ssl.SSLError as e:
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "critical",
            "detail": f"SSL error: {str(e)}",
            "score_impact": 0,
            "raw_data": {"error": str(e)},
        }
