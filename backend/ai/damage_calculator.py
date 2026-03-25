INDUSTRY_MULTIPLIERS = {
    "e-commerce": 2.5,
    "fintech": 3.0,
    "healthcare": 2.8,
    "education": 1.5,
    "restaurant": 1.2,
    "retail": 1.8,
    "saas": 2.2,
    "media": 1.4,
    "real_estate": 1.6,
    "logistics": 1.7,
    "government": 2.0,
    "banking": 3.5,
    "ngo": 1.0,
    "small_business": 1.3,
    "default": 1.5,
}

FINDING_DAMAGE_MAP = {
    "SSL Certificate": {
        "label": "Man-in-the-Middle Attack",
        "risks": ["Payment data interception", "Customer credential theft", "Session hijacking"],
        "base_cost": 500000,
    },
    "SPF Record": {
        "label": "Email Spoofing & Phishing",
        "risks": ["Fake invoice fraud", "CEO fraud to employees", "Customer phishing via your domain"],
        "base_cost": 300000,
    },
    "DMARC Policy": {
        "label": "Email Brand Abuse",
        "risks": ["Phishing emails sent in your name", "Customer trust damage", "Regulatory fines"],
        "base_cost": 400000,
    },
    "DKIM Signing": {
        "label": "Email Authenticity Gap",
        "risks": ["Email spoofing", "Phishing campaigns"],
        "base_cost": 150000,
    },
    "Open Port: MySQL (3306)": {
        "label": "Database Breach",
        "risks": ["Complete customer data theft", "GST/financial data exposure", "GDPR/IT Act violation"],
        "base_cost": 2000000,
    },
    "Open Port: MongoDB (27017)": {
        "label": "NoSQL Database Exposure",
        "risks": ["All stored data theft", "Ransomware infection", "Competitor intelligence theft"],
        "base_cost": 1800000,
    },
    "Open Port: Redis (6379)": {
        "label": "Cache/Session Theft",
        "risks": ["User session hijacking", "Cached payment token theft", "Admin panel bypass"],
        "base_cost": 800000,
    },
    "Open Port: Telnet (23)": {
        "label": "Unencrypted Admin Access",
        "risks": ["Root server access", "Complete system takeover", "Ransomware deployment"],
        "base_cost": 2500000,
    },
    "Content Security Policy": {
        "label": "XSS Attack Surface",
        "risks": ["Customer browser hijacking", "Credential harvesting", "Defacement"],
        "base_cost": 200000,
    },
    "HSTS": {
        "label": "HTTPS Downgrade Attack",
        "risks": ["Payment interception", "Login credential theft"],
        "base_cost": 350000,
    },
    "Clickjacking Protection": {
        "label": "UI Redress Attack",
        "risks": ["Fraudulent clicks", "Unauthorized transactions"],
        "base_cost": 100000,
    },
    "default": {
        "label": "Security Vulnerability",
        "risks": ["Data exposure risk", "Compliance violation"],
        "base_cost": 100000,
    },
}

VISITOR_MULTIPLIERS = {
    "under_1k": 0.5,
    "1k_10k": 1.0,
    "10k_100k": 2.5,
    "100k_plus": 5.0,
}


def format_rupees(amount: int) -> str:
    if amount >= 10000000:
        return f"₹{amount / 10000000:.1f} Cr"
    elif amount >= 100000:
        return f"₹{amount / 100000:.1f}L"
    elif amount >= 1000:
        return f"₹{amount / 1000:.0f}K"
    return f"₹{amount}"


async def calculate_damage(
    findings: list,
    business_type: str = "small_business",
    monthly_visitors: str = "1k_10k",
    has_payment_processing: bool = False,
) -> dict:
    industry_mult = INDUSTRY_MULTIPLIERS.get(
        business_type.lower().replace(" ", "_"),
        INDUSTRY_MULTIPLIERS["default"]
    )
    visitor_mult = VISITOR_MULTIPLIERS.get(monthly_visitors, 1.0)
    payment_mult = 1.5 if has_payment_processing else 1.0

    total = 0
    finding_costs = []

    critical_findings = [f for f in findings if f.get("status") == "critical"]
    warning_findings = [f for f in findings if f.get("status") == "warning"]
    actionable = critical_findings + warning_findings

    for f in actionable:
        check_name = f.get("check", "")
        # Find matching damage map entry
        damage_info = None
        for key, val in FINDING_DAMAGE_MAP.items():
            if key.lower() in check_name.lower() or check_name.lower() in key.lower():
                damage_info = val
                break
        if not damage_info:
            damage_info = FINDING_DAMAGE_MAP["default"]

        severity_mult = 1.5 if f.get("status") == "critical" else 0.8
        cost = int(
            damage_info["base_cost"]
            * industry_mult
            * visitor_mult
            * payment_mult
            * severity_mult
        )
        total += cost

        affected = int(
            ({"under_1k": 500, "1k_10k": 5000, "10k_100k": 50000, "100k_plus": 500000}.get(monthly_visitors, 1000))
            * 0.3
            * severity_mult
        )

        finding_costs.append({
            "check": check_name,
            "label": damage_info["label"],
            "status": f.get("status"),
            "risks": damage_info["risks"],
            "estimated_cost": cost,
            "formatted_cost": format_rupees(cost),
            "affected_customers": affected,
        })

    industry_avg = 70 if industry_mult > 2 else 55

    time_parts = []
    if any(f["status"] == "critical" for f in finding_costs if "status" in f):
        time_parts.append("critical fixes: 2-4 hours")
    if any(f["status"] == "warning" for f in finding_costs if "status" in f):
        time_parts.append("warning fixes: 4-8 hours")

    return {
        "total_financial_risk": total,
        "formatted_total": format_rupees(total),
        "finding_costs": finding_costs,
        "industry_avg_score": industry_avg,
        "prevention_message": (
            f"These {len(actionable)} issues could cost your business up to {format_rupees(total)}. "
            f"Most fixes take a developer less than a day to implement."
        ),
        "time_to_fix_all": " | ".join(time_parts) if time_parts else "4-8 hours total",
    }
