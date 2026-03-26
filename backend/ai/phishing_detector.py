import json
import re
import time

from ai.llm_client import call_llm_json


THREAT_INDICATORS = {
    "soft_power": [
        r"\burgent\b",
        r"\bimmediately\b",
        r"\basap\b",
        r"\bright now\b",
        r"\bdeadline\b",
        r"\bexpires?\b",
        r"\blast chance\b",
        r"\bfinal notice\b",
        r"\bact now\b",
        r"\bdon.t delay\b",
        r"\blimited time\b",
        r"\bhurry\b",
    ],
    "hierarchy_leverage": [
        r"\b(cbi|cid|police|enforcement|ed|income tax|cybercrime)\b",
        r"\b(rbi|sebi|irdai|trai|meity)\b",
        r"\b(manager|director|ceo|md|boss|hr department)\b",
        r"\b(court|legal action|arrest|warrant|fir)\b",
        r"\bgovernment of india\b",
    ],
    "channel_shift": [
        r"\bwhatsapp\b",
        r"\btelegram\b",
        r"\bsignal\b",
        r"\bcall me\b",
        r"\bcall (on|at)\b",
        r"\bcontact (me|us) on\b",
        r"\bprivate\b.*\bchannel\b",
        r"\bdo not share\b",
        r"\bkeep (this )?confidential\b",
    ],
    "financial_manipulation": [
        r"\bupi\b",
        r"\bpaytm\b",
        r"\bphonepe\b",
        r"\bgpay\b",
        r"\bwire transfer\b",
        r"\bneft\b",
        r"\brtgs\b",
        r"\bsend money\b",
        r"\btransfer funds\b",
        r"\bamount\b.*\baccount\b",
        r"\bpayment\b",
        r"\bpay now\b",
    ],
    "credential_harvesting": [
        r"\botp\b",
        r"\bpassword\b",
        r"\bpin\b",
        r"\bkyc\b",
        r"\baadhaar\b",
        r"\bpan card\b",
        r"\baccount number\b",
        r"\bverif(y|ication)\b.*\b(link|click|login)\b",
    ],
}

INDIA_SCAM_PATTERNS = {
    "Digital Arrest": [
        r"\bdigital arrest\b",
        r"\b(cbi|cybercrime|ed)\b.*\b(case|notice|officer)\b",
        r"\byou are under\b.*\binvestigation\b",
        r"\bnarcotics\b",
    ],
    "KYC Scam": [
        r"\bkyc\b.*\b(update|verify|expire|block)\b",
        r"\b(bank|account)\b.*\b(suspend|block|close)\b.*\bkyc\b",
        r"\bupdate your kyc\b",
    ],
    "GST Phishing": [
        r"\bgst\b.*\b(notice|penalty|fine|portal|number)\b",
        r"\bgstin\b",
        r"\bgst (council|department|officer)\b",
    ],
    "UPI Fraud": [
        r"\bupi\b.*\b(collect|request|link|pay)\b",
        r"\bsend ₹\b",
        r"\btransfer ₹\b",
        r"\bscan (and|the) qr\b",
        r"\bpayment (link|request)\b",
    ],
    "CEO Fraud": [
        r"\b(ceo|md|director|sir|boss|ma.?am)\b.*\b(urgent|immediate|transfer|send)\b",
        r"\bdon.t tell anyone\b",
        r"\bconfidential transfer\b",
    ],
}


def _threat_type_meta(category: str) -> tuple[str, str, int]:
    mapping = {
        "soft_power": ("urgency_manipulation", "high", 20),
        "hierarchy_leverage": ("authority_impersonation", "critical", 35),
        "channel_shift": ("channel_shift", "high", 30),
        "financial_manipulation": ("financial_manipulation", "critical", 45),
        "credential_harvesting": ("credential_harvesting", "critical", 40),
    }
    return mapping.get(category, ("social_engineering", "medium", 15))


def _pattern_hits(text: str) -> tuple[int, list[dict], dict]:
    text_lower = text.lower()
    matched_patterns = {k: [] for k in THREAT_INDICATORS}
    hits = []
    score = 0

    for category, patterns in THREAT_INDICATORS.items():
        threat_type, severity, weight = _threat_type_meta(category)
        for pattern in patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                evidence = match.group(0)
                matched_patterns[category].append(evidence)
                score += weight
                hits.append(
                    {
                        "category": category,
                        "threat_type": threat_type,
                        "severity": severity,
                        "evidence": evidence,
                    }
                )
                break

    if re.search(r"\bdear (customer|user|account holder)\b", text_lower, re.IGNORECASE):
        hits.append(
            {
                "category": "generic_greeting",
                "threat_type": "mass_targeting",
                "severity": "medium",
                "evidence": re.search(r"\bdear (customer|user|account holder)\b", text_lower, re.IGNORECASE).group(0),
            }
        )
        score += 15

    if re.search(r"\b(block|blocked|arrest|legal action|court notice|warrant)\b", text_lower, re.IGNORECASE):
        evidence = re.search(r"\b(block|blocked|arrest|legal action|court notice|warrant)\b", text_lower, re.IGNORECASE).group(0)
        hits.append(
            {
                "category": "legal_threat",
                "threat_type": "authority_impersonation",
                "severity": "critical",
                "evidence": evidence,
            }
        )
        score += 35

    if re.search(r"https?://\d{1,3}(?:\.\d{1,3}){3}", text_lower, re.IGNORECASE):
        hits.append(
            {
                "category": "ip_link",
                "threat_type": "credential_harvesting",
                "severity": "critical",
                "evidence": re.search(r"https?://\d{1,3}(?:\.\d{1,3}){3}", text_lower, re.IGNORECASE).group(0),
            }
        )
        score += 40

    return min(score, 100), hits, matched_patterns


def _linguistic_analysis(text: str) -> list[str]:
    issues = []
    words = text.split()
    if not words:
        return issues

    caps_count = sum(1 for w in words if w.isupper() and len(w) > 2)
    if caps_count / len(words) > 0.15:
        issues.append("Excessive capitalization detected")
    if text.count("!") > 2:
        issues.append("Excessive exclamation marks — pressure tactic")
    if any(g in text.lower() for g in ["dear customer", "dear user", "dear sir/madam", "valued customer", "dear account holder"]):
        issues.append("Generic greeting — mass-scam indicator")
    return issues


def _india_scam_match(text: str) -> str | None:
    text_lower = text.lower()
    for scam_name, patterns in INDIA_SCAM_PATTERNS.items():
        if any(re.search(pattern, text_lower, re.IGNORECASE) for pattern in patterns):
            return scam_name
    return None


def _normalized_psych_dimensions(raw_dimensions) -> list[dict]:
    if isinstance(raw_dimensions, dict):
        return [
            {"dimension": "Authority Leverage", "value": int(raw_dimensions.get("authority_score", 0) * 10)},
            {"dimension": "Urgency Pressure", "value": int(raw_dimensions.get("urgency_score", 0) * 10)},
            {"dimension": "Channel Migration Pressure", "value": int(raw_dimensions.get("isolation_score", 0) * 10)},
            {"dimension": "Fear / FOMO", "value": int(raw_dimensions.get("scarcity_score", 0) * 10)},
            {"dimension": "Credential / OTP Targeting", "value": int(raw_dimensions.get("reciprocity_score", 0) * 10)},
        ]
    if isinstance(raw_dimensions, list):
        return raw_dimensions
    return []


def _verdict_for_score(score: int) -> tuple[str, str, bool]:
    if score >= 71:
        return "CRITICAL", "CRITICAL_THREAT", True
    if score >= 41:
        return "HIGH", "PHISHING", True
    if score >= 21:
        return "MEDIUM", "SUSPICIOUS", False
    return "LOW", "SAFE", False


def _normalized_action(action: str | None, score: int) -> str:
    allowed = {"IGNORE", "VERIFY_SEPARATELY", "BLOCK_SENDER", "REPORT_TO_CYBERCRIME"}
    if action in allowed:
        return action
    if score >= 71:
        return "REPORT_TO_CYBERCRIME"
    if score >= 41:
        return "BLOCK_SENDER"
    if score >= 21:
        return "VERIFY_SEPARATELY"
    return "IGNORE"


async def analyze_message(
    message_text: str,
    message_type: str = "email",
    sender_info: str = "",
    processing_mode: str = "LOCAL-ONLY",
) -> dict:
    start = time.time()

    pattern_score, pattern_hits, matched_patterns = _pattern_hits(message_text)
    linguistic_issues = _linguistic_analysis(message_text)
    india_scam = _india_scam_match(message_text)

    system = """
You are a cybersecurity threat detection engine for Indian businesses.
Analyze messages STRICTLY for threats.

SCORING RULES — be strict:
- Any OTP request = +40 points minimum
- Any authority claim (bank/police/CBI/RBI/court) = +35 points
- Any urgency (immediately/urgent/right now/last chance) = +20 points
- Any financial request (transfer/payment/send money) = +45 points
- Any channel shift (WhatsApp/personal email/call me) = +30 points
- Generic greeting (Dear Customer/Dear User) = +15 points
- Threat of account block/arrest/legal action = +35 points
- Link with IP address or suspicious domain = +40 points
- Multiple indicators = scores compound, not replace

VERDICT THRESHOLDS:
0-20: SAFE
21-40: SUSPICIOUS
41-70: PHISHING
71-100: CRITICAL_THREAT

NEVER mark as SAFE if ANY financial request exists.
NEVER mark as SAFE if ANY OTP request exists.
NEVER mark as SAFE if ANY arrest/legal threat exists.

You are a security system not a chatbot.
Respond ONLY with valid JSON.
"""

    user = f"""
Analyze this message for threats:

FROM: {sender_info or "Unknown"}
TYPE: {message_type}
MESSAGE:
{message_text}

Preliminary pattern hits already detected:
{json.dumps(pattern_hits)}

Return STRICT analysis:
{{
  "risk_score": integer 0-100,
  "verdict": "SAFE|SUSPICIOUS|PHISHING|CRITICAL_THREAT",
  "attack_type": "specific attack name or null",
  "confidence": "HIGH|MEDIUM|LOW",
  "manipulation_techniques": [
    {{
      "technique": "technique name",
      "evidence": "exact quote from message",
      "explanation": "plain English for Indian business owner",
      "severity": "low|medium|high|critical"
    }}
  ],
  "psychological_dimensions": {{
    "authority_score": 0-10,
    "urgency_score": 0-10,
    "isolation_score": 0-10,
    "reciprocity_score": 0-10,
    "scarcity_score": 0-10
  }},
  "soft_power_indicators": ["list of psychological tactics"],
  "channel_shift_detected": true/false,
  "channel_shift_evidence": "quote or null",
  "india_specific_scam": "Digital Arrest|KYC Scam|CEO Fraud|UPI Fraud|GST Phishing|null",
  "what_they_want": "plain English goal",
  "red_flags_summary": "2-3 sentences for non-technical owner",
  "recommended_action": "IGNORE|VERIFY_SEPARATELY|BLOCK_SENDER|REPORT_TO_CYBERCRIME",
  "cybercrime_url": "https://cybercrime.gov.in if serious else null"
}}
"""

    llm_result, llm_meta = await call_llm_json(system, user, return_meta=True)
    if not isinstance(llm_result, dict):
        llm_result = {}

    llm_score = int(llm_result.get("risk_score", 0) or 0)
    final_risk = llm_score
    if any(h["severity"] == "critical" for h in pattern_hits):
        final_risk = max(final_risk, 70)
    if any(h["threat_type"] == "financial_manipulation" for h in pattern_hits):
        final_risk = max(final_risk, 65)
    if any(h["threat_type"] == "credential_harvesting" for h in pattern_hits):
        final_risk = max(final_risk, 60)
    if any(h["category"] == "soft_power" and h["evidence"].lower() in {"digital arrest"} for h in pattern_hits):
        final_risk = max(final_risk, 90)
    if india_scam == "Digital Arrest":
        final_risk = max(final_risk, 90)
    if india_scam:
        final_risk = max(final_risk, 80)
    if pattern_hits and final_risk < 40:
        final_risk = 40
    final_risk = min(final_risk, 100)

    risk_level, verdict, is_phishing = _verdict_for_score(final_risk)

    if llm_result.get("verdict") in {"SAFE", "SUSPICIOUS", "PHISHING", "CRITICAL_THREAT"}:
        if llm_result["verdict"] in {"PHISHING", "CRITICAL_THREAT"}:
            verdict = llm_result["verdict"]
            is_phishing = True
            risk_level = "CRITICAL" if verdict == "CRITICAL_THREAT" else "HIGH"
        elif not pattern_hits:
            verdict = llm_result["verdict"]
            risk_level, _, is_phishing = _verdict_for_score(final_risk)

    processing_time = round(time.time() - start, 2)
    psych_dimensions = _normalized_psych_dimensions(llm_result.get("psychological_dimensions"))
    has_channel_shift_pattern = any(h["threat_type"] == "channel_shift" for h in pattern_hits)
    recommended_action = _normalized_action(llm_result.get("recommended_action"), final_risk)

    return {
        "risk_score": final_risk,
        "risk_level": risk_level,
        "verdict": verdict,
        "is_phishing": is_phishing,
        "attack_type": llm_result.get("attack_type") or "Suspicious Message",
        "confidence": str(llm_result.get("confidence", "MEDIUM")).upper(),
        "manipulation_techniques": llm_result.get("manipulation_techniques", []),
        "soft_power_indicators": llm_result.get("soft_power_indicators", [h["category"] for h in pattern_hits]),
        "channel_shift_detected": has_channel_shift_pattern,
        "channel_shift_evidence": llm_result.get("channel_shift_evidence") if has_channel_shift_pattern else None,
        "linguistic_deviations": linguistic_issues,
        "india_specific_scam": india_scam,
        "what_they_want": llm_result.get("what_they_want", "Unknown"),
        "red_flags_summary": llm_result.get("red_flags_summary", ""),
        "recommended_action": recommended_action,
        "cybercrime_url": llm_result.get("cybercrime_url") if recommended_action == "REPORT_TO_CYBERCRIME" else None,
        "psychological_dimensions": psych_dimensions,
        "pattern_score": pattern_score,
        "llm_score": llm_score,
        "llm_model": llm_meta.get("model"),
        "llm_input_length": llm_meta.get("input_length", 0),
        "llm_output_length": llm_meta.get("output_length", 0),
        "pattern_hits": pattern_hits,
        "pattern_indicators": {k: v for k, v in matched_patterns.items() if v},
        "processing_mode": processing_mode,
        "cloud_data_sent": False,
        "processing_time_seconds": processing_time,
    }


def _parse_conversation_lines(conversation_text: str) -> list[dict]:
    text = (conversation_text or "").strip()
    if not text:
        return []

    messages = []
    for line in [ln.strip() for ln in text.splitlines() if ln.strip()]:
        match = re.match(r"^(.{1,60}?)(:|-)\s*(.+)$", line)
        if match:
            messages.append({"sender": match.group(1).strip(), "text": match.group(3).strip()})
        else:
            messages.append({"sender": "Unknown", "text": line})
    return messages


async def analyze_conversation(conversation_text: str, message_type: str = "email", sender_info: str = "") -> dict:
    start = time.time()
    messages = _parse_conversation_lines(conversation_text)
    if not messages:
        return {
            "risk_score": 0,
            "risk_level": "LOW",
            "verdict": "SAFE",
            "is_phishing": False,
            "attack_type": "Unknown",
            "confidence": "LOW",
            "manipulation_techniques": [],
            "soft_power_indicators": [],
            "channel_shift_detected": False,
            "channel_shift_evidence": None,
            "linguistic_deviations": [],
            "india_specific_scam": None,
            "what_they_want": "Unknown",
            "red_flags_summary": "",
            "recommended_action": "VERIFY_SEPARATELY",
            "safe_response_template": "",
            "conversation_graph": {"nodes": [], "edges": []},
            "processing_mode": "LOCAL-AI-ONLY",
            "cloud_data_sent": False,
            "processing_time_seconds": 0.0,
        }

    per_turn = []
    soft_power_union = set()
    channel_shift_turns = []

    for idx, message in enumerate(messages):
        pattern_score, pattern_hits, _ = _pattern_hits(message["text"])
        hit_categories = [h["category"] for h in pattern_hits]
        if any(h["threat_type"] == "channel_shift" for h in pattern_hits):
            channel_shift_turns.append(idx)
        soft_power_union.update(hit_categories)
        per_turn.append(
            {
                "index": idx,
                "sender": message["sender"],
                "text_excerpt": message["text"][:180],
                "pattern_score": int(pattern_score),
                "matched_categories": hit_categories,
            }
        )

    nodes = []
    edges = []
    for idx, turn in enumerate(per_turn):
        nodes.append(
            {
                "id": idx,
                "sender": turn["sender"],
                "turn_index": idx,
                "risk": turn["pattern_score"],
                "labels": turn["matched_categories"],
                "text_excerpt": turn["text_excerpt"],
            }
        )
        if idx < len(per_turn) - 1:
            next_turn = per_turn[idx + 1]
            transition_labels = []
            if "channel_shift" in next_turn["matched_categories"]:
                transition_labels.append("channel_shift")
            if "soft_power" in next_turn["matched_categories"] or "hierarchy_leverage" in next_turn["matched_categories"]:
                transition_labels.append("social_engineering_escalation")
            if transition_labels:
                edges.append({"from": idx, "to": idx + 1, "type": transition_labels[0], "labels": transition_labels})

    raw = sum(turn["pattern_score"] for turn in per_turn)
    normalized = min(int(raw / max(len(per_turn), 1) * 1.6), 100)
    risk_level, verdict, is_phishing = _verdict_for_score(normalized)

    return {
        "risk_score": normalized,
        "risk_level": risk_level,
        "verdict": verdict,
        "is_phishing": is_phishing,
        "attack_type": "Conversation-Based Social Engineering",
        "confidence": "HIGH" if normalized >= 60 else "MEDIUM" if normalized >= 30 else "LOW",
        "manipulation_techniques": [],
        "soft_power_indicators": sorted(soft_power_union),
        "channel_shift_detected": bool(channel_shift_turns),
        "channel_shift_evidence": conversation_text[:220] if channel_shift_turns else None,
        "linguistic_deviations": [],
        "india_specific_scam": _india_scam_match(conversation_text),
        "what_they_want": "Trust, credentials, or money",
        "red_flags_summary": "Conversation shows escalating social engineering pressure across multiple turns." if normalized >= 30 else "Limited phishing indicators found in the conversation.",
        "recommended_action": "REPORT_TO_CYBERCRIME" if normalized >= 71 else "BLOCK_SENDER" if normalized >= 41 else "VERIFY_SEPARATELY",
        "safe_response_template": "",
        "conversation_graph": {"nodes": nodes, "edges": edges},
        "processing_mode": "LOCAL-ONLY",
        "cloud_data_sent": False,
        "processing_time_seconds": round(time.time() - start, 2),
    }
