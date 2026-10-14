
import html
import re

import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"



def clean_ai_response(answer: str) -> str:
    """Decode repeated HTML entity encoding and remove outer code fences."""

    import html
    import re

    answer = answer.strip()

    # Handle repeatedly encoded entities, such as &amp;#x43;.
    for _ in range(5):
        decoded = html.unescape(answer)
        if decoded == answer:
            break
        answer = decoded

    # Remove an accidental Markdown fence around the full response.
    answer = re.sub(
        r"\A\s*```(?:markdown|md|text)?[ \t]*\r?\n?",
        "",
        answer,
        flags=re.IGNORECASE,
    )
    answer = re.sub(r"\r?\n?```\s*\Z", "", answer)

    return answer.strip()


async def generate_ai_response(prompt: str) -> str:
    """Generate a response using the local Ollama model."""

    payload = {
        "model": MODEL_NAME,
        "prompt": (
            "You are LifePilot AI, a helpful personal productivity "
            "assistant. Give clear, practical, concise answers. "
            "Use normal Markdown headings and numbered lists. "
            "Never encode ordinary text as HTML entities. "
            "Do not wrap your answer in Markdown code fences.\n\n"
            f"{prompt}\n\nAssistant:"
        ),
        "stream": False,
    }

    timeout = httpx.Timeout(120.0, connect=5.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()

        except httpx.ConnectError as exc:
            raise RuntimeError(
                "Cannot connect to Ollama. Make sure Ollama is running."
            ) from exc

        except httpx.TimeoutException as exc:
            raise RuntimeError(
                "Ollama took too long to respond. Please try again."
            ) from exc

        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Ollama returned HTTP {exc.response.status_code}."
            ) from exc

        result = response.json()

    answer = clean_ai_response(result.get("response", ""))

    if not answer:
        raise RuntimeError("The AI model returned an empty response.")

    return answer
