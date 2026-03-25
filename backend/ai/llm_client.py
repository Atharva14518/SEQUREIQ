from groq import Groq
import os
import json
import asyncio

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def call_llm(system: str, user: str) -> str:
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
        return response.choices[0].message.content

    try:
        result = await loop.run_in_executor(None, _call)
        return result
    except Exception as e:
        return f"AI analysis unavailable: {str(e)}"


async def call_llm_json(system: str, user: str) -> dict | list:
    json_system = system + """
  CRITICAL: Respond ONLY with raw valid JSON.
  No markdown. No backticks. No explanation.
  No text before or after. Just the JSON object or array."""

    response = await call_llm(json_system, user)

    # Try direct parse
    try:
        return json.loads(response)
    except Exception:
        pass

    # Try extract JSON from response
    try:
        start = response.find('{') if '{' in response else response.find('[')
        end = response.rfind('}') if '{' in response else response.rfind(']')
        if start != -1 and end != -1:
            return json.loads(response[start:end + 1])
    except Exception:
        pass

    # Return empty fallback
    return {} if system.count('{') > system.count('[') else []
