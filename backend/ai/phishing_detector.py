import re
import time
from ai.llm_client import call_llm_json

# ─── Pattern Libraries ──────────────────────────────────────────────────

THREAT_INDICATORS = {
    "soft_power": [
        r"\burgent\b", r"\bimmediately\b", r"\basap\b", r"\bright now\b",
        r"\bdeadline\b", r"\bexpires?\b", r"\blast chance\b", r"\bfinal notice\b",
        r"\bact now\b", r"\bdon.t delay\b", r"\blimited time\b", r"\bhurry\b",
    ],
    "hierarchy_leverage": [
        r"\b(cbi|cid|police|enforcement|ed|income tax|cybercrime)\b",
        r"\b(rbi|sebi|irdai|trai|meity)\b",
        r"\b(manager|director|ceo|md|boss|hr department)\b",
        r"\b(court|legal action|arrest|warrant|fir)\b",
        r"\bgovernment of india\b",
    ],
    "channel_shift": [
        r"\bwhatsapp\b", r"\btelegram\b", r"\bsignal\b",
        r"\bcall me\b", r"\bcall (on|at)\b", r"\bcontact (me|us) on\b",
        r"\bprivate\b.*\bchannel\b", r"\bdo not share\b", r"\bkeep (this )?confidential\b",
    ],
    "financial_manipulation": [
        r"\bupi\b", r"\bpaytm\b", r"\bphonepe\b", r"\bgpay\b",
        r"\bwire transfer\b", r"\bneft\b", r"\brtgs\b",
        r"\bsend money\b", r"\btransfer funds\b", r"\bamount\b.*\baccount\b",
    ],
    "credential_harvesting": [
        r"\botp\b", r"\bpassword\b", r"\bpin\b", r"\bkyc\b",
        r"\baadhaar\b", r"\bpan card\b", r"\baccount number\b",
        r"\bverif(y|ication)\b.*\b(link|click|login)\b",
    ],
}

INDIA_SCAM_PATTERNS = {
    "digital_arrest": {
        "patterns": [
            r"\bdigital arrest\b", r"\b(cbi|cybercrime|ed)\b.*\b(case|notice|officer)\b",
            r"\byou are under\b.*\binvestigation\b", r"\bnarcotics\b",
        ],
        "description": "Digital Arrest Scam — Fraudsters impersonate CBI/police to extort money",
    },
    "kyc_scam": {
        "patterns": [
            r"\bkyc\b.*\b(update|verify|expire|block)\b",
            r"\b(bank|account)\b.*\b(suspend|block|close)\b.*\bkyc\b",
            r"\bupdate your kyc\b",
        ],
        "description": "KYC Update Scam — Fake bank/wallet KYC update to steal credentials",
    },
    "gst_phishing": {
        "patterns": [
            r"\bgst\b.*\b(notice|penalty|fine|portal|number)\b",
            r"\bgstin\b", r"\bgst (council|department|officer)\b",
        ],
        "description": "GST Phishing — Fake GST notices targeting businesses",
    },
    "upi_fraud": {
        "patterns": [
            r"\bupi\b.*\b(collect|request|link|pay)\b",
            r"\bsend ₹\b", r"\btransfer ₹\b",
            r"\bscan (and|the) qr\b", r"\bpayment (link|request)\b",
        ],
        "description": "UPI Payment Fraud — Fake payment requests or reverse-UPI scams",
    },
    "ceo_fraud": {
        "patterns": [
            r"\b(ceo|md|director|sir|boss|ma.?am)\b.*\b(urgent|immediate|transfer|send)\b",
            r"\bdon.t tell anyone\b", r"\bconfidential transfer\b",
        ],
        "description": "CEO/Boss Fraud — Impersonating authority figures to request urgent transfers",
    },
}


def _pattern_score(text: str) -> tuple[int, dict]:
    text_lower = text.lower()
    matched = {k: [] for k in THREAT_INDICATORS}
    total_matches = 0

    for category, patterns in THREAT_INDICATORS.items():
        for p in patterns:
            if re.search(p, text_lower, re.IGNORECASE):
                matched[category].append(p)
                total_matches += 1

    score = min(total_matches * 8, 60)
    return score, matched


def _linguistic_analysis(text: str) -> list:
    issues = []
    words = text.split()
    if len(words) == 0:
        return issues

    caps_count = sum(1 for w in words if w.isupper() and len(w) > 2)
    caps_ratio = caps_count / len(words)
    if caps_ratio > 0.15:
        issues.append("Excessive capitalization detected")

    if text.count("!") > 2:
        issues.append("Excessive exclamation marks — pressure tactic")

    generic_greets = ["dear customer", "dear user", "dear sir/madam", "valued customer", "dear account holder"]
    if any(g in text.lower() for g in generic_greets):
        issues.append("Generic greeting — not personalized, mass scam indicator")

    return issues


def _india_scam_match(text: str) -> tuple[str | None, str | None]:
    text_lower = text.lower()
    for scam_type, data in INDIA_SCAM_PATTERNS.items():
        matches = sum(1 for p in data["patterns"] if re.search(p, text_lower, re.IGNORECASE))
        if matches >= 1:
            return scam_type, data["description"]
    return None, None


async def analyze_message(
    message_text: str,
    message_type: str = "email",
    sender_info: str = "",
) -> dict:
    start = time.time()

    # Step 1: Pattern matching (instant)
    pattern_score, matched_patterns = _pattern_score(message_text)

    # Step 2: Linguistic analysis
    linguistic_issues = _linguistic_analysis(message_text)

    # Step 3: India scam pattern matching
    india_scam_type, india_scam_desc = _india_scam_match(message_text)

    pattern_indicators = {k: v for k, v in matched_patterns.items() if v}

    # Step 4: LLM deep analysis
    system = """You are a cybersecurity expert specializing in social engineering detection for 
Indian small businesses and individuals. Analyze messages for:
1. Soft-Power tactics (urgency, authority, FOMO, fear)
2. Hierarchy leverage (impersonating superiors, officials, government bodies)
3. Channel-shift requests (moving to WhatsApp, Telegram, private channels)
4. India-specific scams (Digital Arrest, KYC Update, GST notices, UPI fraud, CEO fraud)
5. Linguistic manipulation and deception patterns.
You run completely locally — no data ever leaves this device.
Respond ONLY with valid JSON."""

    user = f"""Message Type: {message_type}
Sender Info: {sender_info or "Unknown"}
Message to analyze:
---
{message_text[:2000]}
---
Pattern analysis already found: {list(pattern_indicators.keys())}
India scam match: {india_scam_type or "None"}

Return this exact JSON structure:
{{
  "risk_score": 0-100,
  "verdict": "SAFE|SUSPICIOUS|PHISHING|CRITICAL_THREAT",
  "attack_type": "Type of attack or manipulation",
  "confidence": "Low|Medium|High",
  "manipulation_techniques": [
    {{"technique": "name", "evidence": "exact quote from message", "explanation": "why this is suspicious"}}
  ],
  "soft_power_indicators": ["list", "of", "soft", "power", "tactics"],
  "channel_shift_detected": true/false,
  "channel_shift_evidence": "exact quote or null",
  "linguistic_deviations": ["list of linguistic anomalies"],
  "india_specific_scam": "scam type or null",
  "what_they_want": "What the attacker wants from the victim",
  "red_flags_summary": "2-3 sentence summary of red flags",
  "recommended_action": "IGNORE|VERIFY|BLOCK|REPORT",
  "safe_response_template": "Template for how to respond safely"
}}"""

    llm_result = await call_llm_json(system, user)

    # Combine scores
    llm_score = 0
    if isinstance(llm_result, dict):
        llm_score = int(llm_result.get("risk_score", 0))

    final_score = int(pattern_score * 0.4 + llm_score * 0.6)
    final_score = min(final_score, 100)

    # Determine risk level
    if final_score >= 80:
        risk_level = "CRITICAL"
        verdict = "CRITICAL_THREAT"
        is_phishing = True
    elif final_score >= 60:
        risk_level = "HIGH"
        verdict = "PHISHING"
        is_phishing = True
    elif final_score >= 35:
        risk_level = "MEDIUM"
        verdict = "SUSPICIOUS"
        is_phishing = False
    else:
        risk_level = "LOW"
        verdict = "SAFE"
        is_phishing = False

    # Override with LLM verdict if available
    if isinstance(llm_result, dict) and llm_result.get("verdict"):
        llm_verdict = llm_result["verdict"]
        if llm_verdict in ("PHISHING", "CRITICAL_THREAT"):
            is_phishing = True
            verdict = llm_verdict

    processing_time = round(time.time() - start, 2)

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "verdict": verdict,
        "is_phishing": is_phishing,
        "attack_type": llm_result.get("attack_type", "Unknown") if isinstance(llm_result, dict) else "Pattern Match",
        "confidence": llm_result.get("confidence", "Medium") if isinstance(llm_result, dict) else "Medium",
        "manipulation_techniques": llm_result.get("manipulation_techniques", []) if isinstance(llm_result, dict) else [],
        "soft_power_indicators": llm_result.get("soft_power_indicators", list(pattern_indicators.keys())) if isinstance(llm_result, dict) else list(pattern_indicators.keys()),
        "channel_shift_detected": llm_result.get("channel_shift_detected", bool(matched_patterns.get("channel_shift"))) if isinstance(llm_result, dict) else bool(matched_patterns.get("channel_shift")),
        "channel_shift_evidence": llm_result.get("channel_shift_evidence") if isinstance(llm_result, dict) else None,
        "linguistic_deviations": linguistic_issues + (llm_result.get("linguistic_deviations", []) if isinstance(llm_result, dict) else []),
        "india_specific_scam": india_scam_type or (llm_result.get("india_specific_scam") if isinstance(llm_result, dict) else None),
        "india_scam_description": india_scam_desc,
        "what_they_want": llm_result.get("what_they_want", "Unknown") if isinstance(llm_result, dict) else "Unknown",
        "red_flags_summary": llm_result.get("red_flags_summary", "") if isinstance(llm_result, dict) else "",
        "recommended_action": llm_result.get("recommended_action", "VERIFY") if isinstance(llm_result, dict) else "VERIFY",
        "safe_response_template": llm_result.get("safe_response_template", "") if isinstance(llm_result, dict) else "",
        "pattern_score": pattern_score,
        "llm_score": llm_score,
        "pattern_indicators": pattern_indicators,
        "processing_mode": "LOCAL-AI-ONLY",
        "cloud_data_sent": False,
        "processing_time_seconds": processing_time,
    }
