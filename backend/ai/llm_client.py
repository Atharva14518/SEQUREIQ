from groq import Groq
import os
import json
import asyncio

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def call_llm(system: str, user: str) -> str:
    result, _meta = await call_llm_with_meta(system, user)
    return result


async def call_llm_with_meta(system: str, user: str) -> tuple[str, dict]:
    loop = asyncio.get_event_loop()

    def _call():
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        text = response.choices[0].message.content
        return text, {
            "model": GROQ_MODEL,
            "input_length": len(user or ""),
            "output_length": len(text or ""),
        }

    try:
        result, meta = await loop.run_in_executor(None, _call)
        return result, meta
    except Exception as e:
        return f"AI analysis unavailable: {str(e)}", {
            "model": GROQ_MODEL,
            "input_length": len(user or ""),
            "output_length": 0,
            "error": str(e),
        }


async def call_llm_json(system: str, user: str, return_meta: bool = False) -> dict | list | tuple[dict | list, dict]:
    json_system = system + """
  CRITICAL: Respond ONLY with raw valid JSON.
  No markdown. No backticks. No explanation.
  No text before or after. Just the JSON object or array."""

    response, meta = await call_llm_with_meta(json_system, user)

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
