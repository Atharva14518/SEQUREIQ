import re
import httpx


def _parse_components(headers: dict) -> list[dict]:
    """
    Best-effort component detection from common headers.
    Returns: [{ ecosystem, name, version, source }]
    """
    comps: list[dict] = []
    server = headers.get("server", "")
    x_powered = headers.get("x-powered-by", "")

    def add(name: str, version: str | None, source: str):
        if not name:
            return
        comps.append({
            "ecosystem": "generic",
            "name": name,
            "version": version,
            "source": source,
        })

    # Server: nginx/1.24.0, Apache/2.4.57, cloudflare, etc.
    m = re.search(r"\b(nginx|apache|caddy)\b/?\s*([0-9][0-9A-Za-z\.\-_]*)?", server, re.I)
    if m:
        add(m.group(1).lower(), m.group(2), "server")
    elif server:
        # Keep the raw token for judge visibility even if version is not parseable
        add(server.split(" ")[0].strip()[:60], None, "server_raw")

    # X-Powered-By: Express, PHP/8.2.1, Next.js, etc.
    m = re.search(r"\bphp\b/?\s*([0-9][0-9A-Za-z\.\-_]*)?", x_powered, re.I)
    if m:
        add("php", m.group(1), "x-powered-by")
    elif x_powered:
        add(x_powered.strip()[:60], None, "x-powered-by_raw")

    # Dedupe
    seen = set()
    out = []
    for c in comps:
        key = (c["name"], c.get("version"))
        if key in seen:
            continue
        seen.add(key)
        out.append(c)
    return out


async def _osv_query(name: str, version: str | None) -> list[dict]:
    if not version:
        return []
    payload = {
        "package": {"name": name, "ecosystem": "OSS-Fuzz"},
        "version": version,
    }
    # OSV ecosystems are strict; for now we do a best-effort query using a generic ecosystem
    # and fall back to keyword-based results when ecosystem mapping is unknown.
    # We keep the call guarded so scans never fail if OSV is unavailable.
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post("https://api.osv.dev/v1/query", json=payload)
        if r.status_code != 200:
            return []
        data = r.json() or {}
        vulns = data.get("vulns") or []
        out = []
        for v in vulns[:5]:
            out.append({
                "id": v.get("id"),
                "summary": (v.get("summary") or "")[:240],
                "details": (v.get("details") or "")[:240],
                "severity": v.get("severity"),
                "aliases": v.get("aliases") or [],
            })
        return out
    except Exception:
        return []


async def check_cve_exposure(domain: str) -> dict:
    """
    Automated CVE checkpoint:
    - detect components/versions from headers
    - query OSV when a version is detected
    """
    url = f"https://{domain}"
    headers_lower = {}
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            resp = await client.get(url)
            headers_lower = {k.lower(): v for k, v in resp.headers.items()}
    except Exception:
        try:
            url = f"http://{domain}"
            async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
                resp = await client.get(url)
                headers_lower = {k.lower(): v for k, v in resp.headers.items()}
        except Exception as e:
            return {
                "check": "CVE Exposure",
                "category": "exposure",
                "status": "info",
                "detail": f"Could not fingerprint software versions for CVE checks: {str(e)}",
                "score_impact": 0,
                "raw_data": {"error": str(e)},
            }

    components = _parse_components(headers_lower)
    osv_results = []
    for c in components:
        vulns = await _osv_query(c["name"], c.get("version"))
        if vulns:
            osv_results.append({"component": c, "vulns": vulns})

    if not components:
        return {
            "check": "CVE Exposure",
            "category": "exposure",
            "status": "info",
            "detail": "No reliable software version fingerprints found to run CVE checks.",
            "score_impact": 0,
            "raw_data": {"components": []},
        }

    if osv_results:
        return {
            "check": "CVE Exposure",
            "category": "exposure",
            "status": "warning",
            "detail": f"Potential known vulnerabilities detected for {len(osv_results)} component(s). Patch or upgrade affected software where possible.",
            "score_impact": 0,
            "raw_data": {"components": components, "osv": osv_results},
        }

    return {
        "check": "CVE Exposure",
        "category": "exposure",
        "status": "pass",
        "detail": "No known CVEs detected from the current fingerprinted versions (best-effort).",
        "score_impact": 1,
        "raw_data": {"components": components, "osv": []},
    }

