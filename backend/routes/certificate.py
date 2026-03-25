import json
import hashlib
import io
from datetime import datetime, timedelta
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from database import get_scan_by_id, save_certificate

router = APIRouter(tags=["certificate"])


def generate_cert_id(scan_id: int, domain: str) -> str:
    year = datetime.now().year
    hash_val = hashlib.md5(f"{scan_id}{domain}".encode()).hexdigest()[:6].upper()
    return f"SIQ-{year}-{hash_val}"


@router.get("/certificate/{scan_id}/eligibility")
async def check_eligibility(scan_id: int):
    scan = await get_scan_by_id(scan_id)
    if not scan:
        return JSONResponse({"error": "Scan not found"}, status_code=404)

    required = 70
    gap = max(0, required - scan.score)
    eligible = scan.score >= required

    return {
        "eligible": eligible,
        "score": scan.score,
        "required": required,
        "gap": gap,
        "message": (
            f"Congratulations! {scan.domain} qualifies for a SecureIQ Security Certificate."
            if eligible
            else f"Fix {gap} more points worth of issues to earn your certificate."
        ),
    }


@router.get("/certificate/{scan_id}")
async def get_certificate(scan_id: int):
    scan = await get_scan_by_id(scan_id)
    if not scan:
        return JSONResponse({"error": "Scan not found"}, status_code=404)

    if scan.score < 70:
        return JSONResponse(
            {"error": f"Score {scan.score}/100 too low. Need 70+ for certificate."},
            status_code=400
        )

    cert_id = generate_cert_id(scan_id, scan.domain)
    issued_at = datetime.utcnow()
    expires_at = issued_at + timedelta(days=365)

    # Generate PDF
    pdf_buffer = _generate_pdf(cert_id, scan.domain, scan.score, issued_at, expires_at)

    # Save record
    try:
        await save_certificate({
            "scan_id": scan_id,
            "domain": scan.domain,
            "cert_id": cert_id,
            "score": scan.score,
            "issued_at": issued_at,
            "expires_at": expires_at,
            "clerk_user_id": scan.clerk_user_id,
        })
    except Exception:
        pass  # Already exists, continue

    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="secureiq-cert-{scan.domain}.pdf"'},
    )


def _generate_pdf(cert_id: str, domain: str, score: int, issued_at: datetime, expires_at: datetime) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.colors import HexColor, white, black
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.pdfgen import canvas
    import io

    buffer = io.BytesIO()
    width, height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))

    navy = HexColor("#0D1B2A")
    blue = HexColor("#58A6FF")
    green = HexColor("#3FB950")
    gold = HexColor("#D29922")
    light = HexColor("#E6EDF3")

    # Background
    c.setFillColor(white)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Navy header banner
    c.setFillColor(navy)
    c.rect(0, height - 90, width, 90, fill=1, stroke=0)

    # Logo text
    c.setFillColor(blue)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(40, height - 60, "⬡ SecureIQ")
    c.setFillColor(light)
    c.setFont("Helvetica", 12)
    c.drawString(40, height - 78, "Cybersecurity Intelligence Platform")

    # Hackathon badge
    c.setFillColor(gold)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(width - 40, height - 55, "Ciphathon 26 — Team DomainDiggers")

    # Main title
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 32)
    title = "Certificate of Security Compliance"
    c.drawCentredString(width / 2, height - 155, title)

    # Subtitle line
    c.setFillColor(HexColor("#8B949E"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 180, "This certifies that the following domain has passed SecureIQ security verification")

    # Domain name
    c.setFillColor(blue)
    c.setFont("Helvetica-Bold", 44)
    c.drawCentredString(width / 2, height - 240, domain)

    # Score circle
    cx, cy, r = width / 2 - 200, height - 310, 45
    score_color = green if score >= 70 else gold
    c.setFillColor(score_color)
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(cx, cy - 8, str(score))
    c.setFont("Helvetica", 10)
    c.drawCentredString(cx, cy - 22, "/100")

    c.setFillColor(navy)
    c.setFont("Helvetica", 12)
    c.drawCentredString(cx, cy - 60, "Security Score")

    # Three info columns
    col_y = height - 290
    cols = [
        ("Certificate ID", cert_id, width / 2 - 60),
        ("Valid Until", expires_at.strftime("%d %B %Y"), width / 2 + 80),
        ("Verified By", "SecureIQ AI Engine", width / 2 + 230),
    ]
    for label, value, x in cols:
        c.setFillColor(HexColor("#8B949E"))
        c.setFont("Helvetica", 10)
        c.drawString(x, col_y, label)
        c.setFillColor(navy)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x, col_y - 18, value)

    # QR code
    try:
        import qrcode
        from PIL import Image
        qr = qrcode.QRCode(box_size=4, border=2)
        qr.add_data(f"https://secureiq.in/verify/{cert_id}")
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = io.BytesIO()
        img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        from reportlab.lib.utils import ImageReader
        c.drawImage(ImageReader(qr_buffer), width - 130, 40, width=90, height=90)
        c.setFillColor(HexColor("#8B949E"))
        c.setFont("Helvetica", 8)
        c.drawRightString(width - 20, 35, "Scan to verify")
    except Exception:
        pass

    # Navy footer
    c.setFillColor(navy)
    c.rect(0, 0, width, 35, fill=1, stroke=0)
    c.setFillColor(light)
    c.setFont("Helvetica", 9)
    c.drawCentredString(width / 2, 12, f"Certificate ID: {cert_id}  |  secureiq.in  |  Valid until {expires_at.strftime('%d %b %Y')}")

    c.save()
    return buffer.getvalue()
