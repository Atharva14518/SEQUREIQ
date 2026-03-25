import asyncio
import httpx


SECURITY_HEADERS = {
    "Strict-Transport-Security": {
        "name": "HSTS",
        "desc": "HSTS missing — browsers won't enforce HTTPS, man-in-the-middle attacks possible",
        "ok_desc": "HSTS enabled — browsers forced to use HTTPS only",
        "score_impact": 4,
    },
    "X-Frame-Options": {
        "name": "Clickjacking Protection",
        "desc": "X-Frame-Options missing — your site can be embedded in iframes for clickjacking attacks",
        "ok_desc": "Clickjacking protection active",
        "score_impact": 4,
    },
    "X-Content-Type-Options": {
        "name": "MIME Sniffing Protection",
        "desc": "X-Content-Type-Options missing — browsers may misinterpret file types",
        "ok_desc": "MIME sniffing protection enabled",
        "score_impact": 4,
    },
    "Content-Security-Policy": {
        "name": "Content Security Policy",
        "desc": "CSP missing — cross-site scripting (XSS) attacks not blocked at browser level",
        "ok_desc": "Content Security Policy configured",
        "score_impact": 4,
    },
    "X-XSS-Protection": {
        "name": "XSS Protection",
        "desc": "XSS Protection header missing — older browsers unprotected against script injection",
        "ok_desc": "XSS protection header present",
        "score_impact": 2,
    },
    "Referrer-Policy": {
        "name": "Referrer Policy",
        "desc": "Referrer-Policy missing — visitor URLs leaked to third-party sites you link to",
        "ok_desc": "Referrer policy configured — privacy protected",
        "score_impact": 2,
    },
}


async def check_headers(domain: str) -> list:
    findings = []
    url = f"https://{domain}"
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url)
            headers = {k.lower(): v for k, v in resp.headers.items()}
    except Exception:
        try:
            url = f"http://{domain}"
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                resp = await client.get(url)
                headers = {k.lower(): v for k, v in resp.headers.items()}
        except Exception as e:
            return [{
                "check": "Security Headers",
                "category": "headers",
                "status": "warning",
                "detail": f"Could not fetch headers: {str(e)}",
                "score_impact": 0,
                "raw_data": {},
            }]

    for header, meta in SECURITY_HEADERS.items():
        present = header.lower() in headers
        findings.append({
            "check": meta["name"],
            "category": "headers",
            "status": "pass" if present else "warning",
            "detail": meta["ok_desc"] if present else meta["desc"],
            "score_impact": meta["score_impact"] if present else 0,
            "raw_data": {
                "header": header,
                "value": headers.get(header.lower(), None),
                "present": present,
            },
        })

    return findings
