from groq import Groq
import os
import json
import asyncio
import re
import random

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def call_llm(system: str, user: str) -> str:
    result, _meta = await call_llm_with_meta(system, user)
    return result


def _looks_like_rate_limit(err: Exception) -> bool:
    s = str(err or "").lower()
    return (
        "rate limit" in s
        or "rate_limit" in s
        or "rate_limit_exceeded" in s
        or "error code: 429" in s
        or "429" in s and "tpm" in s
    )


def _suggested_retry_seconds(err: Exception) -> float | None:
    """
    Groq often returns: "Please try again in 520ms."
    """
    s = str(err or "")
    m = re.search(r"try again in\s+(\d+)\s*ms", s, flags=re.IGNORECASE)
    if m:
        try:
            return max(0.0, int(m.group(1)) / 1000.0)
        except Exception:
            return None
    return None


async def call_llm_with_meta(
    system: str,
    user: str,
    *,
    max_tokens: int = 1024,
    temperature: float = 0.3,
    retries: int = 3,
) -> tuple[str, dict]:
    loop = asyncio.get_event_loop()

    def _call():
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        text = response.choices[0].message.content
        return text, {
            "model": GROQ_MODEL,
            "input_length": len(user or ""),
            "output_length": len(text or ""),
            "max_tokens": max_tokens,
        }

    last_err: Exception | None = None
    for attempt in range(max(1, retries)):
        try:
            result, meta = await loop.run_in_executor(None, _call)
            return result, meta
        except Exception as e:
            last_err = e
            # On rate limit, wait a tiny bit and retry.
            if _looks_like_rate_limit(e) and attempt < retries - 1:
                delay = _suggested_retry_seconds(e)
                if delay is None:
                    # Exponential backoff + jitter
                    delay = min(2.0, 0.35 * (2 ** attempt)) + random.random() * 0.15
                await asyncio.sleep(delay)
                continue
            break

    # Important: return empty string so callers can use their normal fallbacks,
    # instead of rendering raw provider errors in the UI.
    return "", {
        "model": GROQ_MODEL,
        "input_length": len(user or ""),
        "output_length": 0,
        "error": str(last_err) if last_err else "unknown_error",
        "rate_limited": bool(last_err and _looks_like_rate_limit(last_err)),
        "max_tokens": max_tokens,
    }


async def call_llm_json(system: str, user: str, return_meta: bool = False) -> dict | list | tuple[dict | list, dict]:
    json_system = system + """
  CRITICAL: Respond ONLY with raw valid JSON.
  No markdown. No backticks. No explanation.
  No text before or after. Just the JSON object or array."""

    response, meta = await call_llm_with_meta(json_system, user, max_tokens=1024, temperature=0.2, retries=3)

    # Try direct parse
    try:
        parsed = json.loads(response)
        return (parsed, meta) if return_meta else parsed
    except Exception:
        pass

    # Try extract JSON from response
    try:
        start = response.find('{') if '{' in response else response.find('[')
        end = response.rfind('}') if '{' in response else response.rfind(']')
        if start != -1 and end != -1:
            parsed = json.loads(response[start:end + 1])
            return (parsed, meta) if return_meta else parsed
    except Exception:
        pass

    # Return empty fallback
    fallback = {} if system.count('{') > system.count('[') else []
    return (fallback, meta) if return_meta else fallback
