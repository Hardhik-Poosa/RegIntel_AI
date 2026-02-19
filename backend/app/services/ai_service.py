import httpx
from typing import List, Dict


LM_STUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions"
MODEL_NAME = "qwen2.5-coder-7b-instruct"


class AIService:

    @staticmethod
    async def chat(messages: List[Dict[str, str]]) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                LM_STUDIO_URL,
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "temperature": 0.2
                }
            )

        response.raise_for_status()
        data = response.json()

        return data["choices"][0]["message"]["content"]
