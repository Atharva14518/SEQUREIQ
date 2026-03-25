import json
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from database import get_scan_by_id

router = APIRouter(tags=["report"])


@router.get("/report/{scan_id}")
async def get_report_data(scan_id: int):
    scan = await get_scan_by_id(scan_id)
    if not scan:
        return JSONResponse({"error": "Scan not found"}, status_code=404)

    findings = json.loads(scan.findings_json or "[]")
    attack_chain = json.loads(scan.attack_chain_json or "{}")
    damage = json.loads(scan.damage_json or "{}")

    return {
        "scan_id": scan.id,
        "domain": scan.domain,
        "score": scan.score,
        "findings": findings,
        "attack_chain": attack_chain,
        "damage": damage,
        "hosting_provider": scan.hosting_provider,
        "created_at": str(scan.created_at),
        "critical_count": sum(1 for f in findings if f.get("status") == "critical"),
        "warning_count": sum(1 for f in findings if f.get("status") == "warning"),
        "pass_count": sum(1 for f in findings if f.get("status") == "pass"),
    }
