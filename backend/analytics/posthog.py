import asyncio
import os

import requests


POSTHOG_KEY = os.getenv("POSTHOG_KEY", "")
POSTHOG_HOST = os.getenv("POSTHOG_HOST", "https://us.i.posthog.com").rstrip("/")


def contains_link(text: str = "") -> bool:
    return bool(__import__("re").search(r"(https?://|www\.|[a-z0-9-]+\.[a-z]{2,})", text or "", __import__("re").IGNORECASE))


def contains_urgency(text: str = "") -> bool:
    return bool(__import__("re").search(r"\b(urgent|immediately|right now|asap|final notice|act now|last chance|deadline|within \d+ hours?)\b", text or "", __import__("re").IGNORECASE))


def contains_risky_patterns(text: str = "") -> bool:
    return bool(__import__("re").search(r"\b(otp|password|bank account|verify account|kyc|arrest|legal action|cbi|rbi|transfer money|upi|click here)\b", text or "", __import__("re").IGNORECASE))


def build_analysis_properties(message_text: str = "", message_type: str = "unknown", verdict: str = "UNKNOWN", score: int = 0) -> dict:
    return {
        "message_length": len(message_text or ""),
        "type": message_type,
        "contains_link": contains_link(message_text),
        "contains_urgency": contains_urgency(message_text),
        "possible_false_negative": verdict == "SAFE" and contains_risky_patterns(message_text),
        "verdict": verdict,
        "score": score,
    }


async def capture_event(distinct_id: str, event: str, properties: dict | None = None):
    if not POSTHOG_KEY:
        print(f"[PostHog] skipped {event} - missing POSTHOG_KEY")
        return

    payload = {
        "api_key": POSTHOG_KEY,
        "event": event,
        "distinct_id": distinct_id or "anonymous",
        "properties": {
            **(properties or {}),
            "$lib": "secureiq-fastapi",
        },
    }

    def _send():
        try:
            response = requests.post(f"{POSTHOG_HOST}/capture/", json=payload, timeout=5)
            print(f"[PostHog][server] {event}", {"distinct_id": payload["distinct_id"], "status": response.status_code, "properties": properties or {}})
        except Exception as exc:
            print(f"[PostHog][server] {event} failed: {exc}")

    await asyncio.get_event_loop().run_in_executor(None, _send)
