import json
from fastapi import APIRouter
from pydantic import BaseModel
from database import (
    save_scan_result, get_scan_by_id, get_scan_history, update_scan_simulation
)
from scanners.orchestrator import run_full_scan
from ai.explainer import explain_findings
from ai.attack_chain import generate_attack_chain
from ai.fix_generator import generate_fixes
from ai.damage_calculator import calculate_damage
from ai.hacker_simulation import generate_hacker_simulation

router = APIRouter(tags=["scan"])


class ScanRequest(BaseModel):
    domain: str
    clerk_user_id: str = "anonymous"


class SimulateRequest(BaseModel):
    scan_id: int
    business_type: str = "small_business"
    estimated_customers: int = 1000


class VerifyFixRequest(BaseModel):
    scan_id: int
    check_name: str
    domain: str


def clean_domain(domain: str) -> str:
    domain = domain.strip().lower()
    for prefix in ["https://", "http://", "www."]:
        if domain.startswith(prefix):
            domain = domain[len(prefix):]
    return domain.rstrip("/").split("/")[0]


@router.post("/scan")
async def start_scan(req: ScanRequest):
    domain = clean_domain(req.domain)

    # Run all scanners
    scan_data = await run_full_scan(domain, req.clerk_user_id)

    # AI enrichment
    findings = await explain_findings(
        scan_data["findings"], domain, scan_data["hosting_provider"]
    )
    attack_chain = await generate_attack_chain(findings, domain)
    fixes = await generate_fixes(findings, domain, scan_data["hosting_provider"])
    damage = await calculate_damage(findings)

    scan_data["findings"] = findings
    scan_data["attack_chain"] = attack_chain
    scan_data["fixes"] = fixes
    scan_data["damage"] = damage

    # Save to DB
    saved = await save_scan_result(scan_data)
    scan_data["scan_id"] = saved.id

    return scan_data


@router.get("/scan/{scan_id}")
async def get_scan(scan_id: int):
    scan = await get_scan_by_id(scan_id)
    if not scan:
        return {"error": "Scan not found"}
    return {
        "scan_id": scan.id,
        "domain": scan.domain,
        "score": scan.score,
        "findings": json.loads(scan.findings_json or "[]"),
        "attack_chain": json.loads(scan.attack_chain_json or "{}"),
        "simulation": json.loads(scan.simulation_json or "{}"),
        "damage": json.loads(scan.damage_json or "{}"),
        "hosting_provider": scan.hosting_provider,
        "created_at": str(scan.created_at),
    }


@router.get("/history/{domain}/{clerk_user_id}")
async def get_history(domain: str, clerk_user_id: str):
    history = await get_scan_history(domain, clerk_user_id)
    return [{"id": h.id, "domain": h.domain, "score": h.score, "scanned_at": str(h.scanned_at)} for h in history]


@router.post("/simulate")
async def run_simulation(req: SimulateRequest):
    scan = await get_scan_by_id(req.scan_id)
    if not scan:
        return {"error": "Scan not found"}

    findings = json.loads(scan.findings_json or "[]")
    simulation = await generate_hacker_simulation(
        findings, scan.domain, req.business_type, req.estimated_customers
    )
    await update_scan_simulation(req.scan_id, simulation)
    return simulation


@router.post("/verify-fix")
async def verify_fix(req: VerifyFixRequest):
    from scanners.ssl_checker import check_ssl
    from scanners.email_security import check_email_security
    from scanners.headers_checker import check_headers

    domain = clean_domain(req.domain)
    check = req.check_name.lower()

    new_findings = []
    if "ssl" in check:
        result = await check_ssl(domain)
        new_findings = [result]
    elif "spf" in check or "dmarc" in check or "dkim" in check:
        new_findings = await check_email_security(domain)
    elif any(h in check for h in ["hsts", "csp", "frame", "xss", "mime", "referrer"]):
        new_findings = await check_headers(domain)

    if new_findings:
        matching = [f for f in new_findings if req.check_name.lower() in f.get("check", "").lower()]
        if matching:
            f = matching[0]
            fixed = f["status"] == "pass"
            return {
                "fixed": fixed,
                "new_status": f["status"],
                "message": f["detail"],
                "points_gained": f["score_impact"] if fixed else 0,
            }

    return {"fixed": False, "new_status": "unknown", "message": "Could not re-verify this check", "points_gained": 0}
